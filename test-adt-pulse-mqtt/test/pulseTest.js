"use strict";

const assert = require("assert");
const rewire = require("rewire");
const nock = require("nock");
const fs = require("fs");

describe("ADT Pulse Default Initialization Tests", function () {
  // Setup
  // Rewire adt-pulse module
  let pulse = rewire("../adt-pulse.js");
  let testAlarm = new pulse();
  // Prevent executing sync
  clearInterval(testAlarm.pulseInterval);

  // Evaluate

  /*
  console.log("Direct Properties");
  console.log(Object.getOwnPropertyNames(testAlarm));
  console.log("Config Properties");
  console.log(testAlarm.config); 
  */

  it("Should return an object instance", () => {
    assert.ok(testAlarm instanceof pulse);
  });

  it("Should have an authenticated property", () => {
    assert.ok(testAlarm.hasOwnProperty("authenticated"));
  });

  it("Should have a Clients property", () => {
    assert.ok(testAlarm.hasOwnProperty("clients"));
  });

  it("Should have a 0 length array in Clients property", () => {
    assert.strictEqual(testAlarm.clients.length, 0);
  });

  it("Should have a Config property set", () => {
    //assert.ok(testAlarm.hasOwnProperty("config"));
    assert.ok("config" in testAlarm);
  });

  it("Should have no value for username", () => {
    assert.strictEqual(testAlarm.config["username"], "");
  });

  it("Should have no value for password", () => {
    assert.strictEqual(testAlarm.config["password"], "");
  });

  it("Should have no value for fingerprint", () => {
    assert.strictEqual(testAlarm.config["fingerprint"], "");
  });

  // Add config properties as they are used
  it("Should have baseUrl set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("baseUrl"));
  });

  it("Should have baseUrl set to https://portal.adtpulse.com", () => {
    assert.strictEqual(testAlarm.config.baseUrl, "https://portal.adtpulse.com");
  });

  it("Should have prefix set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("prefix"));
  });

  it("Should have initialURI property set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("initialURI"));
  });

  it("Should have initialURI set to /", () => {
    assert.strictEqual(testAlarm.config.initialURI, "/");
  });

  it("Should have authURI property set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("authURI"));
  });

  it("Should have authURI set to /access/signin.jsp?e=n&e=n&&partner=adt", () => {
    assert.strictEqual(
      testAlarm.config.authURI,
      "/access/signin.jsp?e=n&e=n&&partner=adt",
    );
  });

  it("Should have summaryURI property set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("summaryURI"));
  });

  it("Should have summaryURI set to /summary/summary.jsp", () => {
    assert.strictEqual(testAlarm.config.summaryURI, "/summary/summary.jsp");
  });

  it("Should have sensorOrbURI property set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("sensorOrbURI"));
  });

  it("Should have sensorOrbURI set to /ajax/orb.jsp", () => {
    assert.strictEqual(testAlarm.config.sensorOrbURI, "/ajax/orb.jsp");
  });

  it("Should have disarmURI property set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("disarmURI"));
  });

  it("Should have disarmURI set to /quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState", () => {
    assert.strictEqual(
      testAlarm.config.disarmURI,
      "/quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState",
    );
  });
});

describe("ADT Pulse Test Value Initialization Test", function () {
  // Setup
  // Rewire adt-pulse module
  let pulse = rewire("../adt-pulse.js");
  let testAlarm = new pulse("test", "password", "123456789");
  // Prevent executing sync
  clearInterval(testAlarm.pulseInterval);

  // Evaluate

  /*
  console.log("Direct Properties");
  console.log(Object.getOwnPropertyNames(testAlarm));
  console.log("Config Properties");
  console.log(testAlarm.config); 
  */

  it("Should return an object instance", () => {
    assert.ok(testAlarm instanceof pulse);
  });

  it("Should have an authenticated property", () => {
    assert.ok(testAlarm.hasOwnProperty("authenticated"));
  });

  it("Should have a Clients property", () => {
    assert.ok(testAlarm.hasOwnProperty("clients"));
  });

  it("Should have a 0 length array in Clients property", () => {
    assert.strictEqual(testAlarm.clients.length, 0);
  });

  it("Should have a Config property set", () => {
    //assert.ok(testAlarm.hasOwnProperty("config"));
    assert.ok("config" in testAlarm);
  });

  it("Should have a username of test", () => {
    assert.strictEqual(testAlarm.config["username"], "test");
  });

  it("Should have a password of password", () => {
    assert.strictEqual(testAlarm.config["password"], "password");
  });

  it("Should have a device fingerprint", () => {
    assert.strictEqual(testAlarm.config["fingerprint"], "123456789");
  });

  // Add config properties as they are used
  it("Should have baseUrl set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("baseUrl"));
  });

  it("Should have baseUrl set to https://portal.adtpulse.com", () => {
    assert.strictEqual(testAlarm.config.baseUrl, "https://portal.adtpulse.com");
  });

  it("Should have prefix set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("prefix"));
  });

  it("Should have initialURI property set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("initialURI"));
  });

  it("Should have initialURI set to /", () => {
    assert.strictEqual(testAlarm.config.initialURI, "/");
  });

  it("Should have authURI property set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("authURI"));
  });

  it("Should have authURI set to /access/signin.jsp?e=n&e=n&&partner=adt", () => {
    assert.strictEqual(
      testAlarm.config.authURI,
      "/access/signin.jsp?e=n&e=n&&partner=adt",
    );
  });

  it("Should have summaryURI property set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("summaryURI"));
  });

  it("Should have summaryURI set to /summary/summary.jsp", () => {
    assert.strictEqual(testAlarm.config.summaryURI, "/summary/summary.jsp");
  });

  it("Should have sensorOrbURI property set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("sensorOrbURI"));
  });

  it("Should have sensorOrbURI set to /ajax/orb.jsp", () => {
    assert.strictEqual(testAlarm.config.sensorOrbURI, "/ajax/orb.jsp");
  });

  it("Should have disarmURI property set", () => {
    assert.ok(testAlarm.config.hasOwnProperty("disarmURI"));
  });

  it("Should have disarmURI set to /quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState", () => {
    assert.strictEqual(
      testAlarm.config.disarmURI,
      "/quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState",
    );
  });
});

describe("ADT Pulse Login Test", function () {
  // Setup
  // Rewire adt-pulse module
  let pulse = rewire("../adt-pulse.js");
  let testAlarm = new pulse("test", "password", "123456789");
  // Prevent executing sync
  clearInterval(testAlarm.pulseInterval);

  nock("https://portal.adtpulse.com")
    .get("/")
    .reply(302, "<html></html>", {
      Location:
        "https://portal.adtpulse.com/myhome/22.0.0-233/access/signin.jsp",
    })
    .get("/myhome/22.0.0-233/access/signin.jsp")
    .reply(200, () => {
      try {
        var page = fs.readFileSync("./test/pages/signin.jsp", "utf8");
        return page.toString();
      } catch (e) {
        console.log("Error:", e.stack);
      }
    })
    .post("/myhome/22.0.0-233/access/signin.jsp", {
      username: "test",
      password: "password",
      fingerprint: "123456789",
    })
    .query(true)
    .reply(301, "<html></html>", {
      Location:
        "https://portal.adtpulse.com/myhome/22.0.0-233/summary/summary.jsp",
    })
    .get("/myhome/22.0.0-233/summary/summary.jsp")
    .reply(200, "<html></html>");

  it("Should set prefix", function () {
    return testAlarm.login().then(() => {
      assert.strictEqual(testAlarm.config.prefix, "/myhome/22.0.0-233");
    });
  });

  it("Should be authenticated", function () {
    return testAlarm.login().then(() => {
      assert.strictEqual(testAlarm.config.prefix, "/myhome/22.0.0-233");
      assert.strictEqual(testAlarm.authenticated, true);
    });
  });
});

// Test update functions called by updateAll()
describe("ADT Pulse Update tests", function () {
  var alarm;
  var devices = "None";
  var zones = [];

  // Setup
  // Rewire adt-pulse module
  let pulse = rewire("../adt-pulse.js");
  pulse.__set__("authenticated", "true");
  let testAlarm = new pulse("test", "password", "123456789");
  // Prevent executing sync
  clearInterval(testAlarm.pulseInterval);
  // Set Callbacks
  testAlarm.onStatusUpdate(function (device) {
    alarm = device;
  });

  testAlarm.onDeviceUpdate(function (device) {
    devices = device;
  });

  testAlarm.onZoneUpdate(function (zone) {
    zones.push(zone);
  });

  nock("https://portal.adtpulse.com")
    .get("/myhome/13.0.0-153/summary/summary.jsp")
    .reply(200, () => {
      try {
        var page = fs.readFileSync(
          "./test/pages/summaryalarmstatus.jsp",
          "utf8",
        );
        return page.toString();
      } catch (e) {
        console.log("Error:", e.stack);
      }
    })
    .get("/myhome/13.0.0-153/ajax/currentStates.jsp")
    .reply(200, () => {
      try {
        var page = fs.readFileSync("./test/pages/otherdevices.jsp", "utf8");
        return page.toString();
      } catch (e) {
        console.log("Error:", e.stack);
      }
    })
    .get("/myhome/13.0.0-153/ajax/orb.jsp")
    .reply(200, () => {
      try {
        var page = fs.readFileSync("./test/pages/zonestatus.jsp", "utf8");
        return page.toString();
      } catch (e) {
        console.log("Error:", e.stack);
      }
    });

  it("Should return status of Disarmed.", function () {
    return testAlarm.getAlarmStatus().then(() => {
      assert.ok(alarm.status.includes("Disarmed"));
    });
  });

  it("Should find no devices", function () {
    return testAlarm.getDeviceStatus().then(() => {
      assert.strictEqual(devices, "None");
    });
  });

  it("Should return the status of zones", function () {
    return testAlarm.getZoneStatusOrb().then(() => {
      assert.strictEqual(zones.length, 7);
      assert.ok(zones[0].id.includes("sensor"));
      assert.strictEqual(zones[0].name, "BACK DOOR");
      assert.strictEqual(zones[0].state, "devStatOK");
    });
  });
});

describe("ADT Pulse Disarm Test", function () {
  let setAlarm;

  let pulse = rewire("../adt-pulse.js");
  pulse.__set__("authenticated", "true");
  pulse.__set__("sat", "11111111-2222-3333-4444-555555555555");
  let testAlarm = new pulse("test", "password");
  // Prevent executing sync
  clearInterval(testAlarm.pulseInterval);

  nock("https://portal.adtpulse.com")
    .get(
      "/myhome/13.0.0-153/quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState&armstate=stay&arm=off",
    )
    .reply(200, "Disarmed")
    .get(
      "/myhome/13.0.0-153/quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState&armstate=stay&arm=off&sat=11111111-2222-3333-4444-555555555555",
    )
    .reply(200, "Disarmed");

  // Test disarming
  setAlarm = { newstate: "disarm", prev_state: "stay", isForced: "false" };
  it("Should disarmed alarm", function () {
    return testAlarm.setAlarmState(setAlarm).then(() => {
      assert.ok(true);
    });
  });
});

describe("ADT Pulse Arm Stay Test", function () {
  let setAlarm;

  let pulse = rewire("../adt-pulse.js");
  pulse.__set__("authenticated", "true");
  pulse.__set__("sat", "11111111-2222-3333-4444-555555555555");
  let testAlarm = new pulse("test", "password");
  // Prevent executing sync
  clearInterval(testAlarm.pulseInterval);

  nock("https://portal.adtpulse.com")
    .get(
      "/myhome/13.0.0-153/quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState&armstate=disarmed&arm=stay",
    )
    .reply(200, "Armed stay")
    .get(
      "/myhome/13.0.0-153/quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState&armstate=disarmed&arm=stay&sat=11111111-2222-3333-4444-555555555555",
    )
    .reply(200, "Armed stay");

  // Test arm stay
  setAlarm = { newstate: "stay", prev_state: "disarmed", isForced: "false" };
  it("Should arm the alarm to stay", function () {
    return testAlarm.setAlarmState(setAlarm).then(() => {
      assert.ok(true);
    });
  });
});

describe("ADT Pulse Arm Away Test without forcing ", function () {
  let setAlarm;

  let pulse = rewire("../adt-pulse.js");
  pulse.__set__("authenticated", "true");
  pulse.__set__("sat", "11111111-2222-3333-4444-555555555555");
  let testAlarm = new pulse("test", "password");
  // Prevent executing sync
  clearInterval(testAlarm.pulseInterval);

  nock("https://portal.adtpulse.com")
    .get(
      "/myhome/13.0.0-153/quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState&armstate=disarmed&arm=away",
    )
    .reply(200, "Armed stay")
    .get(
      "/myhome/13.0.0-153/quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState&armstate=disarmed&arm=away&sat=11111111-2222-3333-4444-555555555555",
    )
    .reply(200, "Armed stay");

  // Test arm away
  setAlarm = { newstate: "away", prev_state: "disarmed", isForced: "false" };
  it("Should arm the alarm to stay", function () {
    return testAlarm.setAlarmState(setAlarm).then(() => {
      assert.ok(true);
    });
  });
});

describe("ADT Pulse Forced Arm Away Test", function () {
  let setAlarm;

  let pulse = rewire("../adt-pulse.js");
  pulse.__set__("authenticated", "true");
  pulse.__set__("sat", "11111111-2222-3333-4444-555555555555");
  let testAlarm = new pulse("test", "password");
  // Prevent executing sync
  clearInterval(testAlarm.pulseInterval);

  nock("https://portal.adtpulse.com")
    .get(
      "/myhome/13.0.0-153/quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState&armstate=disarmed&arm=away",
    )
    .reply(
      200,
      "Armed stay. Some sensors are open or reporting motion. sat=11111111-2222-3333-4444-555555555555&href=",
    )
    .get(
      "/myhome/13.0.0-153/quickcontrol/armDisarm.jsp?href=rest/adt/ui/client/security/setArmState&armstate=disarmed&arm=away&sat=11111111-2222-3333-4444-555555555555",
    )
    .reply(
      200,
      "Armed stay. Some sensors are open or reporting motion. sat=11111111-2222-3333-4444-555555555555&href=",
    )
    .get(
      "/myhome/13.0.0-153/quickcontrol/serv/RunRRACommand?sat=1234&href=rest/adt/ui/client/security/setForceArm&armstate=forcearm&arm=away&sat=11111111-2222-3333-4444-555555555555",
    )
    .reply(200, "Armed away - forced");

  // Test arm away
  setAlarm = { newstate: "away", prev_state: "disarmed", isForced: "false" };
  it("Should arm the alarm to stay", function () {
    return testAlarm.setAlarmState(setAlarm).then(() => {
      assert.ok(true);
    });
  });
});
