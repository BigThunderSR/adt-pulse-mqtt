let request = require("request");
let q = require("q");
let cheerio = require("cheerio");
let _ = require("lodash");
const log = require("./logger.js");

//Cookie jar
let j;
let ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36";
let sat = "";
let lastsynckey = "";
let deviceUpdateCB = function () {};
let zoneUpdateCB = function () {};
let statusUpdateCB = function () {};

const pulse = function (
  username = "",
  password = "",
  fingerprint = "",
  interval = 5000
) {
  this.authenticated = false;
  this.isAuthenticating = false;
  this.clients = [];

  this.configure({
    username: username,
    password: password,
    fingerprint: fingerprint,
  });

  /* heartbeat */
  this.pulseInterval = setInterval(this.sync.bind(this), interval);
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
    for (let o in options) {
      this.config[o] = options[o];
    }
  };

  (this.login = function () {
    let deferred = q.defer();
    let that = this;

    if (this.authenticated) {
      deferred.resolve();
    } else {
      log("[Pulse.login] Authenticating...");

      j = request.jar();

      that.isAuthenticating = true;
      request(
        {
          url: this.config.baseUrl + this.config.initialURI, // call with no prefix to grab the prefix
          jar: j,
          headers: {
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "User-Agent": ua,
          },
        },
        function (e, hResp) {
          // expecting /myhome/VERSION/access/signin.jsp
          if (hResp == null) {
            log(
              `[Pulse.login] Authentication failed: ${JSON.stringify(e)}`,
              "error"
            );
            that.authenticated = false;
            that.isAuthenticating = false;
            deferred.reject();
            return deferred.promise;
          }
          log(
            `[Pulse.login] Authentication received pathname: ${hResp.request.uri.pathname}`
          );

          let uriPart = hResp.request.uri.pathname.match(
            /\/myhome\/(.+?)\/access/
          )[1];
          log(`[Pulse.login] Authentication detected page version: ${uriPart}`);
          that.config.prefix = "/myhome/" + uriPart;
          log(
            `[Pulse.login] Authentication new URL prefix: ${that.config.prefix}`
          );
          log(
            `[Pulse.login] Authentication calling '${that.config.baseUrl}${that.config.prefix}${that.config.authURI}'...`
          );
          request.post(
            that.config.baseUrl + that.config.prefix + that.config.authURI,
            {
              followAllRedirects: true,
              jar: j,
              headers: {
                Host: "portal.adtpulse.com",
                Referrer:
                  that.config.baseUrl +
                  that.config.prefix +
                  that.config.authURI,
                "User-Agent": ua,
              },
              form: {
                username: that.config.username,
                password: that.config.password,
                fingerprint: that.config.fingerprint,
              },
            },
            function (err, httpResponse) {
              that.isAuthenticating = false;
              if (
                err ||
                httpResponse.request.path !==
                  that.config.prefix + that.config.summaryURI
              ) {
                that.authenticated = false;
                log(
                  `[Pulse.login] Authentication failed with HTTP  response '${JSON.stringify(
                    httpResponse
                  )}'`,
                  "error"
                );
                deferred.reject();
              } else {
                that.authenticated = true;
                log("[Pulse.login] Authentication succeeded");
                deferred.resolve();
                that.updateAll.call(that);
              }
            }
          );
        }
      );
    }
    return deferred.promise;
  }),
    (this.logout = function () {
      let that = this;

      log("[Pulse.logout] Logging out...");

      request(
        {
          url: this.config.baseUrl + this.config.prefix + this.config.logoutURI,
          jar: j,
          headers: {
            "User-Agent": ua,
          },
        },
        function () {
          that.authenticated = false;
        }
      );
    }),
    (this.updateAll = function () {
      let that = this;
      log("[Pulse.updateAll] Updating all device and zone statuses...");

      this.getAlarmStatus().then(function () {
        that.getDeviceStatus();
        that.getZoneStatusOrb();
      });
    }),
    (this.getZoneStatusOrb = function () {
      log("[Pulse.getZoneStatus] Getting zone statuses...");
      let deferred = q.defer();
      request(
        {
          url:
            this.config.baseUrl + this.config.prefix + this.config.sensorOrbURI,
          jar: j,
          headers: {
            "User-Agent": ua,
            Referer: this.config.baseUrl + this.config.prefix + this.summaryURI,
          },
        },
        function (err, httpResponse, body) {
          if (err) {
            log(
              "[Pulse.getZoneStatus] Zone status query (via orb) failed",
              "error"
            );
          } else {
            // Load response from call to Orb and parse html
            const $ = cheerio.load(body);
            const sensors = $("#orbSensorsList table tr.p_listRow").toArray();
            // Map values of table to variables
            const output = _.map(sensors, (sensor) => {
              const theSensor = cheerio.load(sensor);
              const theName = theSensor("a.p_deviceNameText").html();
              const theZone = theSensor("span.p_grayNormalText").html();
              const theState = theSensor("span.devStatIcon canvas").attr(
                "icon"
              );

              const theZoneNumber = theZone
                ? theZone.replace(/(Zone&#xA0;)([0-9]{1,2})/, "$2")
                : 0;

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
              let timestamp = Math.floor(Date.now() / 1000); // timetamp in seconds

              return {
                id: `sensor-${theZoneNumber}`,
                name: theName || "Unknown Sensor",
                tags: theTag || "sensor",
                timestamp: timestamp,
                state: theState || "devStatUnknown",
              };
            });

            log("[Pulse.getZoneStatus] Zone status query (via orb) succeeded");
            output.forEach(function (obj) {
              let s = obj;
              log(
                `[Pulse.getZoneStatus] Sensor: '${s.id}' Name: '${s.name}'; Tags: '${s.tags}'; State '${s.state}'`
              );
              zoneUpdateCB(s);
            });
            let newsat = body.match(
              /sat=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/
            )[1];
            if (newsat) {
              sat = newsat;
              log(`[Pulse.getZoneStatus] New SAT ::${sat}::`);
            }
          }
        }
      );
      return deferred.promise;
    }),
    (this.getDeviceStatus = function () {
      // not tested
      log("[Pulse.getDeviceStatus] Getting device statuses...");
      let deferred = q.defer();
      request(
        {
          url:
            this.config.baseUrl +
            this.config.prefix +
            this.config.otherStatusURI,
          jar: j,
          headers: {
            "User-Agent": ua,
          },
        },
        function (err, httpResponse, body) {
          try {
            let $ = cheerio.load(body);
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
                log("[Pulse.getDeviceStatus] No other device statuses found");
              }
            });
          } catch (e) {
            log(
              `[Pulse.getDeviceStatus] Device status query failed: ::${body}::`,
              "error"
            );
          }
        }
      );
      return deferred.promise;
    }),
    (this.onDeviceUpdate = function (updateCallback) {
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
      log(
        `[Pulse.deviceStateChange] Device '${device.name}' state changed to '${device.state}'`
      );

      let deferred = q.defer();

      request.post(
        this.config.baseUrl +
          this.config.prefix +
          this.config.statusChangeURI +
          "?fi=" +
          device.serialnumber +
          "&vn=level&u=On|Off&ft=light-onoff",

        {
          followAllRedirects: true,
          jar: j,
          headers: {
            Host: "portal.adtpulse.com",
            "User-Agent": ua,
            Referer:
              this.config.baseUrl + this.config.prefix + this.config.summaryURI,
          },
          form: {
            sat: sat,
            value: device.state == 0 ? "Off" : "On",
          },
        },
        function (err) {
          if (err) {
            log(
              "[Pulse.deviceStateChange] Device state change failed",
              "error"
            );
            deferred.reject();
          } else {
            log("[Pulse.deviceStateChange] Device state change succeeded");
            deferred.resolve();
          }
        }
      );
      return deferred.promise;
    }),
    (this.getAlarmStatus = function () {
      log("[Pulse.getAlarmStatus] Getting Alarm Statuses...");
      let deferred = q.defer();

      request(
        {
          url:
            this.config.baseUrl + this.config.prefix + this.config.summaryURI,
          jar: j,
          headers: {
            "User-Agent": ua,
          },
        },
        function (err, httpResponse, body) {
          // signed in?
          if (body == null || body.includes("You have not yet signed in")) {
            log(
              "[Pulse.getAlarmStatus] Error getting sat due to login timeout",
              "error"
            );
            deferred.reject();
            return false;
          }
          //parse the html
          try {
            let $ = cheerio.load(body);
            statusUpdateCB({ status: $("#divOrbTextSummary span").text() });
            deferred.resolve();
          } catch (e) {
            log(
              `[Pulse.getAlarmStatus] Error getting sat cheerio ::${body}:: ${e}`,
              "error"
            );
            deferred.reject();
            return false;
          }
        }
      );
      return deferred.promise;
    }),
    (this.setAlarmState = function (action) {
      // action can be: stay, away, disarm
      // action.newstate
      // action.prev_state

      log("[Pulse.setAlarmState] Setting alarm state...");

      let deferred = q.defer();
      let that = this;
      let url, ref;

      ref = this.config.baseUrl + this.config.prefix + this.config.summaryURI;

      if (action.newstate != "disarm") {
        // we are arming.
        if (action.isForced == true) {
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

      log(`[Pulse.setAlarmState] Setting alarm state via '${url}'...`);

      request(
        {
          url: url,
          jar: j,
          headers: {
            "User-Agent": ua,
            Referer: ref,
          },
        },
        function (err, httpResponse, body) {
          if (err) {
            log(
              `[Pulse.setAlarmState] Setting alarm state failed with: ${body}`,
              "error"
            );
            deferred.reject();
          } else {
            // when arming check if Some sensors are open or reporting motion
            // need the new sat value;
            if (
              action.newstate != "disarm" &&
              action.isForced != true &&
              body.includes("Some sensors are open or reporting motion")
            ) {
              log(
                "[Pulse.setAlarmState] Some sensors are open so forcing alarm state..."
              );
              newsat = body.match(
                /sat=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/
              )[1];
              if (newsat) {
                sat = newsat;
                log(`[Pulse.setAlarmState] New SAT ::${sat}::`);
              }
              action.isForced = true;
              that.setAlarmState(action);
              deferred.resolve(body);
            } else {
              // we failed?
              // Arming Disarming states are captured. No need to call them failed.
              if (
                !action.isForced &&
                !body.includes("Disarming") &&
                !body.includes("Arming")
              ) {
                log(
                  `[Pulse.setAlarmState] Forcing alarm state failed ::${body}::`,
                  "error"
                );
                deferred.reject();
              }
            }
            log(
              `[Pulse.setAlarmState] Setting alamr state succeeded. Forced?: ${action.isForced}`
            );
            deferred.resolve(body);
          }
        }
      );
      return deferred.promise;
    });

  this.pulse = function (uid) {
    log("[Pulse.pulse] Spanning...");

    if (this.clients.indexOf(uid) >= 0) {
      log("[Pulse.pulse] Client lost", uid);
      this.clients.splice(this.clients.indexOf(uid), 1);
    } else {
      log(`[Pulse.pulse] New Client ${uid}`);
      this.clients.push(uid);
      this.sync();
    }
  };

  this.sync = function () {
    if (this.clients.length && !this.isAuthenticating) {
      let that = this;
      this.login().then(function () {
        request(
          {
            url: that.config.baseUrl + that.config.prefix + that.config.syncURI,
            jar: j,
            followAllRedirects: true,
            headers: {
              "User-Agent": ua,
              Referer:
                that.config.baseUrl +
                that.config.prefix +
                that.config.summaryURI,
            },
          },
          function (err, response, body) {
            log("[Pulse.sync] Syncing...");
            if (err || !body || body.indexOf("<html") > -1) {
              that.authenticated = false;
              log("[Pulse.sync] Sync failed", "error");
            } else if (lastsynckey != body || "1-0-0" == body) {
              lastsynckey = body;
              that.updateAll.call(that);
            }
          }
        );
      });
    } else {
      log("[Pulse.sync]: Sync stuck?");
    }
  };
}).call(pulse.prototype);
