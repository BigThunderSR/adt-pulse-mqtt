// Forked from https://github.com/kevinmhickey/adt-pulse
const axios = require("axios");
const axiosCookieJarSupport = require("axios-cookiejar-support").wrapper;
const tough = require("tough-cookie");
//var q = require('q');
var cheerio = require("cheerio");
var _ = require("lodash");

//Cookie jar and axios client
var cookieJar;
var client;
var ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36";
var sat = "";
var lastsynckey = "";
var deviceUpdateCB = function () {};
var zoneUpdateCB = function () {};
var statusUpdateCB = function () {};

const pulse = function (username = "", password = "", fingerprint = "") {
  this.authenticated = false;
  this.isAuthenticating = false;
  this.clients = [];

  // Initialize cookie jar and axios client
  cookieJar = new tough.CookieJar();
  client = axiosCookieJarSupport(
    axios.create({
      jar: cookieJar,
      withCredentials: true,
      maxRedirects: 10,
      timeout: 30000,
    }),
  );

  this.configure({
    username: username,
    password: password,
    fingerprint: fingerprint,
  });

  /* heartbeat */
  this.pulseInterval = setInterval(this.sync.bind(this), 5000);
};

module.exports = pulse;

(function () {
  this.config = {
    baseUrl: "https://portal.adtpulse.com",
    prefix: "/myhome/13.0.0-153", // you don't need to change this every time. Addon automatically grabs the latest one on the first call.
    initialURI: "/",
    signinURI: "/access/signin.jsp",
    authURI: "/access/signin.jsp?e=n&e=n&&partner=adt",
    sensorURI: "/ajax/homeViewDevAjax.jsp",
    sensorOrbURI: "/ajax/orb.jsp",
    summaryURI: "/summary/summary.jsp",
    statusChangeURI: "/quickcontrol/serv/ChangeVariableServ",
    armURI: "/quickcontrol/serv/RunRRACommand",
    disarmURI:
      "/quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState",
    otherStatusURI: "/ajax/currentStates.jsp",
    syncURI: "/Ajax/SyncCheckServ",
    logoutURI: "/access/signout.jsp",

    orbUrl: "https://portal.adtpulse.com/myhome/9.7.0-31/ajax/orb.jsp", // not used
  };

  this.configure = function (options) {
    for (var o in options) {
      this.config[o] = options[o];
    }
  };

  this.login = function () {
    return new Promise((resolve, reject) => {
      var that = this;

      if (this.authenticated) {
        resolve();
      } else {
        console.log(
          new Date().toLocaleString() + " Pulse: Login Called, Authenticating",
        );

        that.isAuthenticating = true;
        client
          .get(this.config.baseUrl + this.config.initialURI, {
            headers: {
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "User-Agent": ua,
            },
          })
          .then(function (response) {
            // expecting /myhome/VERSION/access/signin.jsp
            if (response == null) {
              console.log(
                "\x1b[31m%s\x1b[0m",
                new Date().toLocaleString() +
                  " Pulse: Authentication Bad Response Error",
              );
              that.authenticated = false;
              that.isAuthenticating = false;
              reject(new Error("Authentication failed - bad response"));
              return;
            }

            var pathname =
              response.request.path || response.request.res.responseUrl;
            console.log(
              new Date().toLocaleString() +
                " Pulse: Authentication Received Pathname - " +
                pathname,
            );

            var uriMatch = pathname.match(/\/myhome\/(.+?)\/access/);
            if (uriMatch && uriMatch[1]) {
              var uriPart = uriMatch[1];
              console.log(
                new Date().toLocaleString() +
                  " Pulse: Authentication Page Version - " +
                  uriPart,
              );
              that.config.prefix = "/myhome/" + uriPart;
              console.log(
                new Date().toLocaleString() +
                  " Pulse: Authentication New URL Prefix - " +
                  that.config.prefix,
              );
            } else {
              console.log(
                new Date().toLocaleString() +
                  " Pulse: Authentication Failed - Could not parse URI pattern from: " +
                  pathname,
              );
              throw new Error("Failed to parse authentication URI pattern");
            }
            console.log(
              new Date().toLocaleString() +
                " Pulse: Authentication Calling - " +
                that.config.baseUrl +
                that.config.prefix +
                that.config.authURI,
            );

            const qs = require("querystring");
            return client.post(
              that.config.baseUrl + that.config.prefix + that.config.authURI,
              qs.stringify({
                username: that.config.username,
                password: that.config.password,
                fingerprint: that.config.fingerprint,
              }),
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  Host: "portal.adtpulse.com",
                  Referer:
                    that.config.baseUrl +
                    that.config.prefix +
                    that.config.authURI,
                  "User-Agent": ua,
                },
              },
            );
          })
          .then(function (httpResponse) {
            that.isAuthenticating = false;
            var responsePath =
              httpResponse.request.path || httpResponse.request.res.responseUrl;
            if (
              !responsePath ||
              !responsePath.includes(that.config.summaryURI)
            ) {
              that.authenticated = false;
              console.log(
                "\x1b[31m%s\x1b[0m",
                new Date().toLocaleString() + " Pulse: Authentication Failed",
              );
              console.log(
                "\x1b[41m%s\x1b[0m",
                new Date().toLocaleString() +
                  " Pulse: httpResponse - " +
                  JSON.stringify(httpResponse.request),
              );
              reject(new Error("Authentication failed - invalid redirect response"));
            } else {
              that.authenticated = true;
              console.log(
                "\x1b[32m%s\x1b[0m",
                new Date().toLocaleString() + " Pulse: Authentication Success",
              );
              resolve();
              that.updateAll.call(that);
            }
          })
          .catch(function (e) {
            that.isAuthenticating = false;
            that.authenticated = false;
            console.log(
              "\x1b[31m%s\x1b[0m",
              new Date().toLocaleString() +
                " Pulse: Authentication Error - " +
                JSON.stringify(e.message),
            );
            reject(new Error(`Authentication error: ${e.message || e}`));
          });
      }
    });
  };

  ((this.logout = function () {
    var that = this;

    console.log(
      "\x1b[33m%s\x1b[0m",
      new Date().toLocaleString() + " Pulse: Logout",
    );

    client
      .get(this.config.baseUrl + this.config.prefix + this.config.logoutURI, {
        headers: {
          "User-Agent": ua,
        },
      })
      .then(function () {
        that.authenticated = false;
      })
      .catch(function () {
        that.authenticated = false;
      });
  }),
    (this.updateAll = function () {
      var that = this;
      console.log(new Date().toLocaleString() + " Pulse: updateAll");

      this.getAlarmStatus()
        .then(function () {
          that.getDeviceStatus().catch(function (err) {
            console.log(
              "\x1b[31m%s\x1b[0m",
              new Date().toLocaleString() + " Pulse: updateAll - getDeviceStatus failed: " + (err.message || err)
            );
          });
          that.getZoneStatusOrb().catch(function (err) {
            console.log(
              "\x1b[31m%s\x1b[0m",
              new Date().toLocaleString() + " Pulse: updateAll - getZoneStatusOrb failed: " + (err.message || err)
            );
          });
        })
        .catch(function (err) {
          console.log(
            "\x1b[31m%s\x1b[0m",
            new Date().toLocaleString() + " Pulse: updateAll - getAlarmStatus failed: " + (err.message || err)
          );
        });
    }),
    (this.getZoneStatusOrb = function () {
      console.log(
        new Date().toLocaleString() +
          " Pulse.getZoneStatus (via Orb): Getting Zone Statuses",
      );

      return new Promise((resolve, reject) => {
        client
          .get(
            this.config.baseUrl + this.config.prefix + this.config.sensorOrbURI,
            {
              headers: {
                "User-Agent": ua,
                Referer:
                  this.config.baseUrl + this.config.prefix + this.summaryURI,
              },
            },
          )
          .then(function (response) {
            // Load response from call to Orb and parse html
            const $ = cheerio.load(response.data);
            const sensors = $("#orbSensorsList table tr.p_listRow").toArray();
            // Map values of table to variables
            const output = _.map(sensors, (sensor) => {
              const theSensor = cheerio.load(sensor);
              const extractedData = theSensor.extract({
                theName: "a.p_deviceNameText",
                theZone: "div.p_grayNormalText",
                theState: {
                  selector: "span.devStatIcon canvas",
                  value: "icon",
                },
              });
              const theName = extractedData.theName;
              const theState = extractedData.theState;
              const theZone = extractedData.theZone;

              const theZoneNumber = theZone
                ? theZone.replace(/(Zone\s)(\d+)/, "$2")
                : "0";

              let theTag;

              if (theName && theState !== "devStatUnknown") {
                if (theName.includes("Door") || theName.includes("Window")) {
                  theTag = "sensor,doorWindow";
                } else if (theName.includes("Glass")) {
                  theTag = "sensor,glass";
                } else if (theName.includes("Motion")) {
                  theTag = "sensor,motion";
                } else if (theName.includes("Gas")) {
                  theTag = "sensor,co";
                } else if (
                  theName.includes("Smoke") ||
                  theName.includes("Heat")
                ) {
                  theTag = "sensor,fire";
                }
              }
              /**
               * Expected output.
               *
               * id:    sensor-[integer]
               * name:  device name
               * tags:  sensor,[doorWindow,motion,glass,co,fire]
               * timestamp: timestamp of last activity
               * state: devStatOK (device okay)
               *        devStatOpen (door/window opened)
               *        devStatMotion (detected motion)
               *        devStatTamper (glass broken or device tamper)
               *        devStatAlarm (detected CO/Smoke)
               *        devStatUnknown (device offline)
               */
              var timestamp = Math.floor(Date.now() / 1000); // timestamp in seconds

              return {
                id: `sensor-${theZoneNumber}`,
                name: theName || "Unknown Sensor",
                tags: theTag || "sensor",
                timestamp: timestamp,
                state: theState || "devStatUnknown",
              };
            });

            console.log(
              "\x1b[32m%s\x1b[0m",
              new Date().toLocaleString() +
                " ADT Pulse: Get Zone Status (via Orb) Success",
            );
            output.forEach(function (obj) {
              var s = obj;
              console.log(
                "\x1b[42m%s\x1b[0m",
                new Date().toLocaleString() +
                  " Sensor: " +
                  s.id +
                  " Name: " +
                  s.name +
                  " Tags: " +
                  s.tags +
                  " State: " +
                  s.state,
              );
              zoneUpdateCB(s);
            });
            var satMatch = response.data.match(
              /sat=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/,
            );
            if (satMatch && satMatch[1]) {
              var newsat = satMatch[1];
              sat = newsat;
              console.log(
                "\x1b[32m%s\x1b[0m",
                new Date().toLocaleString() +
                  " Pulse.setAlarmState: New SAT - ::" +
                  sat +
                  "::",
              );
            }
            resolve(output);
          })
          .catch(function (err) {
            console.log(
              "\x1b[31m%s\x1b[0m",
              new Date().toLocaleString() +
                " Pulse.getZoneStatus (via Orb): Zone JSON Failed",
            );
            reject(err);
          });
      });
    }));

  this.getDeviceStatus = function () {
    // not tested
    console.log(
      new Date().toLocaleString() +
        " Pulse.getDeviceStatus: Getting Device Statuses",
    );

    return new Promise((resolve, reject) => {
      client
        .get(
          this.config.baseUrl + this.config.prefix + this.config.otherStatusURI,
          {
            headers: {
              "User-Agent": ua,
            },
          },
        )
        .then(function (response) {
          try {
            var $ = cheerio.load(response.data);
            $("tr tr.p_listRow").each(function () {
              try {
                deviceUpdateCB({
                  name: $(this).find("td").eq(2).text(),
                  serialnumber: $(this)
                    .find("td")
                    .eq(2)
                    .find("a")
                    .attr("href")
                    .split("'")[1],
                  state:
                    $(this).find("td").eq(3).text().trim().toLowerCase() ==
                    "off"
                      ? 0
                      : 1,
                });
              } catch (e) {
                console.log(
                  "\x1b[34m%s\x1b[0m",
                  new Date().toLocaleString() +
                    " Pulse.getDeviceStatus: No Other Devices Found",
                );
              }
            });
            resolve();
          } catch (e) {
            console.log(
              "\x1b[31m%s\x1b[0m",
              new Date().toLocaleString() +
                " Pulse.getDeviceStatus: Failed - ::" +
                response.data +
                "::",
            );
            reject(e);
          }
        })
        .catch(function (err) {
          console.log(
            "\x1b[31m%s\x1b[0m",
            new Date().toLocaleString() +
              " Pulse.getDeviceStatus: Request Failed",
          );
          reject(err);
        });
    });
  };
  ((this.onDeviceUpdate = function (updateCallback) {
    deviceUpdateCB = updateCallback;
  }),
    (this.onZoneUpdate = function (updateCallback) {
      zoneUpdateCB = updateCallback;
    }),
    (this.onStatusUpdate = function (updateCallback) {
      statusUpdateCB = updateCallback;
    }),
    // not tested
    (this.deviceStateChange = function (device) {
      console.log(
        "\x1b[33m%s\x1b[0m",
        new Date().toLocaleString() +
          " Pulse.deviceStateChange: Device State Change - ",
        device.name,
        device.state,
      );

      return new Promise((resolve, reject) => {
        const qs = require("querystring");
        client
          .post(
            this.config.baseUrl +
              this.config.prefix +
              this.config.statusChangeURI +
              "?fi=" +
              device.serialnumber +
              "&vn=level&u=On|Off&ft=light-onoff",
            qs.stringify({
              sat: sat,
              value: device.state === 0 ? "Off" : "On",
            }),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Host: "portal.adtpulse.com",
                "User-Agent": ua,
                Referer:
                  this.config.baseUrl +
                  this.config.prefix +
                  this.config.summaryURI,
              },
            },
          )
          .then(function () {
            console.log(
              "\x1b[32m%s\x1b[0m",
              new Date().toLocaleString() + " Pulse: Device State Success",
            );
            resolve();
          })
          .catch(function (err) {
            console.log(
              "\x1b[31m%s\x1b[0m",
              new Date().toLocaleString() + " Pulse: Device State Failure",
            );
            reject(new Error(`Device state change failed: ${err.message || err}`));
          });
      });
    }));

  this.getAlarmStatus = function () {
    console.log(
      new Date().toLocaleString() +
        " Pulse.getAlarmStatus: Getting Alarm Statuses",
    );

    return new Promise((resolve, reject) => {
      client
        .get(
          this.config.baseUrl + this.config.prefix + this.config.summaryURI,
          {
            headers: {
              "User-Agent": ua,
            },
          },
        )
        .then(function (response) {
          // signed in?
          if (
            response.data == null ||
            response.data.includes("You have not yet signed in")
          ) {
            console.log(
              "\x1b[31m%s\x1b[0m",
              new Date().toLocaleString() +
                " Pulse: Error Getting SAT Login, Timed Out",
            );
            reject(new Error("Login timed out - not signed in"));
            return false;
          }
          //parse the html
          try {
            var $ = cheerio.load(response.data);
            statusUpdateCB({ status: $("#divOrbTextSummary span").text() });
            resolve();
          } catch (e) {
            console.log(
              "\x1b[31m%s\x1b[0m",
              new Date().toLocaleString() +
                " Pulse: Error Getting SAT Cheerio - ::" +
                response.data +
                "::" +
                e,
            );
            reject(new Error(`Cheerio parsing failed: ${e.message}`));
            return false;
          }
        })
        .catch(function (err) {
          console.log(
            "\x1b[31m%s\x1b[0m",
            new Date().toLocaleString() + " Pulse: Error Getting Alarm Status",
          );
          reject(new Error(`Alarm status request failed: ${err.message || err}`));
        });
    });
  };

  this.setAlarmState = function (action) {
    // action can be: stay, away, disarm
    // action.newstate
    // action.prev_state

    console.log(
      "\x1b[32m%s\x1b[0m",
      new Date().toLocaleString() +
        " Pulse.setAlarmState: Setting Alarm Status",
    );

    return new Promise((resolve, reject) => {
      var that = this;
      var url, ref;

      ref = this.config.baseUrl + this.config.prefix + this.config.summaryURI;

      if (action.newstate !== "disarm") {
        // we are arming.
        if (action.isForced === true) {
          if (sat) {
            url =
              this.config.baseUrl +
              this.config.prefix +
              this.config.armURI +
              "?sat=" +
              sat +
              "&href=rest/adt/ui/client/security/setForceArm&armstate=forcearm&arm=" +
              encodeURIComponent(action.newstate);
          } else {
            url =
              this.config.baseUrl +
              this.config.prefix +
              this.config.armURI +
              "?href=rest/adt/ui/client/security/setForceArm&armstate=forcearm&arm=" +
              encodeURIComponent(action.newstate);
          }
          ref =
            this.config.baseUrl +
            this.config.prefix +
            this.config.disarmURI +
            "&armstate=" +
            action.prev_state +
            "&arm=" +
            action.newstate;
        } else {
          if (sat) {
            url =
              this.config.baseUrl +
              this.config.prefix +
              this.config.disarmURI +
              "&armstate=" +
              action.prev_state +
              "&arm=" +
              action.newstate +
              "&sat=" +
              sat;
          } else {
            url =
              this.config.baseUrl +
              this.config.prefix +
              this.config.disarmURI +
              "&armstate=" +
              action.prev_state +
              "&arm=" +
              action.newstate;
          }
        }
      } else {
        // disarm
        if (sat) {
          url =
            this.config.baseUrl +
            this.config.prefix +
            this.config.disarmURI +
            "&armstate=" +
            action.prev_state +
            "&arm=off" +
            "&sat=" +
            sat;
        } else {
          url =
            this.config.baseUrl +
            this.config.prefix +
            this.config.disarmURI +
            "&armstate=" +
            action.prev_state +
            "&arm=off";
        }
      }

      console.log(
        new Date().toLocaleString() +
          " Pulse.setAlarmState: Calling the URL - " +
          url,
      );

      client
        .get(url, {
          headers: {
            "User-Agent": ua,
            Referer: ref,
          },
        })
        .then(function (response) {
          // when arming check if Some sensors are open or reporting motion
          // need the new sat value;
          if (
            action.newstate !== "disarm" &&
            action.isForced !== true &&
            response.data.includes("Some sensors are open or reporting motion")
          ) {
            console.log(
              "\x1b[33m%s\x1b[0m",
              new Date().toLocaleString() +
                " Pulse.setAlarmState: Some sensors are open. Will force the alarm state.",
            );
            newsat = response.data.match(
              /sat=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/,
            )[1];
            if (newsat) {
              sat = newsat;
              console.log(
                new Date().toLocaleString() +
                  " Pulse.setAlarmState: New SAT - ::" +
                  sat +
                  "::",
              );
            }
            action.isForced = true;
            that.setAlarmState(action)
              .then((result) => {
                resolve(result);
              })
              .catch((error) => {
                reject(error);
              });
          } else {
            // we failed?
            // Arming Disarming states are captured. No need to call them failed.
            if (
              !action.isForced &&
              !response.data.includes("Disarming") &&
              !response.data.includes("Arming")
            ) {
              console.log(
                "\x1b[31m%s\x1b[0m",
                new Date().toLocaleString() +
                  " Pulse.setAlarmState: Forced Alarm State Failed - ::" +
                  response.data +
                  "::",
              );
              reject(new Error("Alarm state change failed - unexpected response"));
              return;
            }
            console.log(
              "\x1b[32m%s\x1b[0m",
              new Date().toLocaleString() +
                " Pulse.setAlarmState: Success. Forced? - " +
                action.isForced,
            );
            resolve(response.data);
          }
        })
        .catch(function (err) {
          console.log(
            "\x1b[31m%s\x1b[0m",
            new Date().toLocaleString() +
              " Pulse.setAlarmState: Failed With - " +
              err.message,
          );
          reject(new Error("Network error during alarm state change: " + err.message));
        });
    });
  };

  this.pulse = function (uid) {
    console.log(new Date().toLocaleString() + " Pulse.pulse: Spanning");

    if (this.clients.indexOf(uid) >= 0) {
      console.log(
        "\x1b[33m%s\x1b[0m",
        new Date().toLocaleString() + " Pulse.pulse: Client Lost - ",
        uid,
      );
      this.clients.splice(this.clients.indexOf(uid), 1);
    } else {
      console.log(
        new Date().toLocaleString() + " Pulse.pulse: New Client - ",
        uid,
      );
      this.clients.push(uid);
      this.sync();
    }
  };

  this.sync = function () {
    if (this.clients.length && !this.isAuthenticating) {
      var that = this;
      this.login().then(function () {
        client
          .get(that.config.baseUrl + that.config.prefix + that.config.syncURI, {
            headers: {
              "User-Agent": ua,
              Referer:
                that.config.baseUrl +
                that.config.prefix +
                that.config.summaryURI,
            },
          })
          .then(function (response) {
            console.log(
              new Date().toLocaleString() + " Pulse.sync: Syncing - ",
              response.data,
            );
            if (!response.data || response.data.indexOf("<html") > -1) {
              that.authenticated = false;
              console.log(
                "\x1b[31m%s\x1b[0m",
                new Date().toLocaleString() + " Pulse.sync: Sync Failed",
              );
            } else if (
              lastsynckey !== response.data ||
              "1-0-0" === response.data
            ) {
              lastsynckey = response.data;
              that.updateAll.call(that);
            }
          })
          .catch(function (err) {
            that.authenticated = false;
            console.log(
              "\x1b[31m%s\x1b[0m",
              new Date().toLocaleString() + " Pulse.sync: Sync Failed",
            );
          });
      });
    } else {
      console.log(
        "\x1b[33m%s\x1b[0m",
        new Date().toLocaleString() + " Pulse.sync: Sync Stuck?",
      );
    }
  };
}).call(pulse.prototype);
