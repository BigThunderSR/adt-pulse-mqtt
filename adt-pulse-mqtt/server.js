const Pulse = require("./adt-pulse.js");
const mqtt = require("mqtt");
var config = require("/data/options.json");
var client;

var myAlarm = new Pulse(
  config.pulse_login.username,
  config.pulse_login.password,
  config.pulse_login.fingerprint,
);

// Use mqtt_url option if specified, otherwise build URL using host option
if (config.mqtt_url) {
  client = new mqtt.connect(config.mqtt_url, config.mqtt_connect_options);
} else {
  client = new mqtt.connect(
    "mqtt://" + config.mqtt_host,
    config.mqtt_connect_options,
  );
}

var alarm_state_topic = config.alarm_state_topic;
var alarm_command_topic = config.alarm_command_topic;
var zone_state_topic = config.zone_state_topic;
var smartthings_topic = config.smartthings_topic;
var smartthings = config.smartthings;

var alarm_last_state = "unknown";
var devices = {};

client.on("connect", function () {
  console.log("MQTT Sub to: " + alarm_command_topic);
  client.subscribe(alarm_command_topic);
  if (smartthings) {
    client.subscribe(
      smartthings_topic + "_future/security/ADT Alarm System/state",
    );
  }
});

client.on("message", function (topic, message) {
  console.log(
    new Date().toLocaleString() + " Received Message:" + topic + ":" + message,
  );

  if (
    smartthings &&
    topic == smartthings_topic + "_future/security/ADT Alarm System/state" &&
    message.toString().includes("_push")
  ) {
    var toState = null;

    switch (message.toString()) {
      case "off_push":
        toState = "disarm";
        break;
      case "stay_push":
        toState = "arm_home";
        break;
      case "away_push":
        toState = "arm_away";
        break;
    }
    console.log(
      "\x1b[32m%s\x1b[0m",
      new Date().toLocaleString() + " Pushing alarm state to HA: " + toState,
    );

    if (toState != null) {
      client.publish(alarm_command_topic, toState, { retain: false });
    }
    return;
  }
  if (topic != alarm_command_topic) {
    return;
  }

  var msg = message.toString();
  var action;
  var prev_state = "disarmed";

  if (alarm_last_state == "armed_home") prev_state = "stay";
  if (alarm_last_state == "armed_away") prev_state = "away";

  if (msg == "arm_home") {
    action = { newstate: "stay", prev_state: prev_state };
  } else if (msg == "disarm") {
    action = { newstate: "disarm", prev_state: prev_state };
  } else if (msg == "arm_away") {
    action = { newstate: "away", prev_state: prev_state };
  } else {
    // I don't know this mode #5
    console.log(
      "\x1b[31m%s\x1b[0m",
      new Date().toLocaleString() + " Unsupported state requested: " + msg,
    );
    return;
  }

  myAlarm.setAlarmState(action);
});

// Register Callbacks:
myAlarm.onDeviceUpdate(function (device) {
  console.log("Device callback" + JSON.stringify(device));
});

myAlarm.onStatusUpdate(function (device) {
  var mqtt_state = "unknown";
  var sm_alarm_value = "off";

  var status = device.status.toLowerCase();

  // smartthings bridge has no typical alarm device with stay|away|alarm|home status.
  // we'll re-use the "alarm" and map strobe|siren|both|off to stay|away|alarm|home
  // Sorry I'm too lazy to write my own smartthings bridge for now.

  if (status.includes("disarmed")) {
    mqtt_state = "disarmed";
    sm_alarm_value = "off";
  }
  if (status.includes("armed stay")) {
    mqtt_state = "armed_home";
    sm_alarm_value = "strobe";
  }
  if (status.includes("armed away")) {
    mqtt_state = "armed_away";
    sm_alarm_value = "siren";
  }
  if (status.includes("alarm")) {
    mqtt_state = "triggered";
    sm_alarm_value = "both";
  }
  if (status.includes("arming")) {
    mqtt_state = "pending";
    sm_alarm_value = "siren"; // temporary
  }

  if (
    !mqtt_state.includes(alarm_last_state) &&
    !mqtt_state.includes("unknown")
  ) {
    console.log(
      "\x1b[32m%s\x1b[0m",
      new Date().toLocaleString() +
        " Pushing alarm state: " +
        mqtt_state +
        " to " +
        alarm_state_topic,
    );
    client.publish(alarm_state_topic, mqtt_state, { retain: true });
    if (smartthings) {
      var sm_alarm_topic =
        smartthings_topic + "_future/security/ADT Alarm System/config";
      console.log(
        new Date().toLocaleString() +
          " Pushing alarm state to smartthings" +
          sm_alarm_topic,
      );
      client.publish(sm_alarm_topic, sm_alarm_value, { retain: false });
    }
    alarm_last_state = mqtt_state;
  }
});

myAlarm.onZoneUpdate(function (device) {
  // smartthings MQTT Discovery edge driver assumes:
  // - New devices are announced/created with `config`
  // - Device status are updated with `state`
  // adt/zone/DEVICE_NAME/state needs to turn into
  // smartthings/contact/NODE_NAME/DEVICE_NAME/config
  // smartthings/contact/NODE_NAME/DEVICE_NAME/state
  // -or-
  // smartthings/motion/NODE_NAME/DEVICE_NAME/config
  // smartthings/motion/NODE_NAME/DEVICE_NAME/state

  var trackedDeviceId = `${device.id}/${device.name}`;
  var trackedDevice = devices[trackedDeviceId];
  var isUntrackedDevice = trackedDevice == null;
  if (isUntrackedDevice || device.timestamp > trackedDevice.timestamp) {
    var dev_zone_state_topic = zone_state_topic + "/" + device.name + "/state";

    client.publish(dev_zone_state_topic, device.state, { retain: false });
    console.log(
      "\x1b[32m%s\x1b[0m",
      new Date().toLocaleString() +
        " Pushing device state: " +
        device.state +
        " to topic " +
        dev_zone_state_topic,
    );

    if (smartthings) {
      var sm_device_type = "contact";
      var sm_device_state = device.state == "devStatOK" ? "closed" : "open";
      if (device.tags.includes("motion")) {
        sm_device_type = "motion";
        sm_device_state = device.state == "devStatOK" ? "inactive" : "active";
      }

      if (isUntrackedDevice) {
        // Publish a config message
        var sm_dev_zone_config_topic =
          smartthings_topic +
          "/" +
          sm_device_type +
          "/" +
          trackedDeviceId +
          "/config";
        client.publish(sm_dev_zone_config_topic, sm_device_state, {
          retain: false,
        });
        console.log(
          new Date().toLocaleString() +
            " Pushing new device to smartthings: " +
            sm_device_state +
            " to topic " +
            sm_dev_zone_config_topic,
        );
      }
      var sm_dev_zone_state_topic =
        smartthings_topic +
        "/" +
        sm_device_type +
        "/" +
        trackedDeviceId +
        "/state";
      client.publish(sm_dev_zone_state_topic, sm_device_state, {
        retain: false,
      });
      console.log(
        new Date().toLocaleString() +
          " Pushing device update to smartthings: " +
          sm_device_state +
          " to topic " +
          sm_dev_zone_state_topic,
      );
    }
  }
  devices[trackedDeviceId] = device;
});

myAlarm.pulse();
