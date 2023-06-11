require("dotenv").config();
const { env } = process;

const Pulse = require("./adt-pulse.js");
const mqtt = require("mqtt");
let config = require(env.ADT_PULSE_MQTT_CONFIG_PATH || "/data/options.json");
const log = require("./logger.js");
let client;

let myAlarm = new Pulse(
  config.pulse_login.username,
  config.pulse_login.password,
  config.pulse_login.fingerprint,
  config.pulse_interval_ms
);

// Use mqtt_url option if specified, otherwise build URL using host option
if (config.mqtt_url) {
  client = new mqtt.connect(config.mqtt_url, config.mqtt_connect_options);
} else {
  client = new mqtt.connect(
    "mqtt://" + config.mqtt_host,
    config.mqtt_connect_options
  );
}

let alarm_state_topic = config.alarm_state_topic;
let alarm_command_topic = config.alarm_command_topic;
let zone_state_topic = config.zone_state_topic;
let smartthings_topic = "smartthings";
let smartthings = config.smartthings;

let alarm_last_state = "unknown";
let devices = {};

client.on("connect", function () {
  log(`[MQTT] Subscribed to MQTT topic: ${alarm_command_topic}`);
  client.subscribe(alarm_command_topic);
  if (smartthings) {
    client.subscribe(`${smartthings_topic}/alarm/ADT Alarm System/state`);
  }
});

client.on("message", function (topic, message) {
  log(`[MQTT] Received message: ${message}`);

  if (
    smartthings &&
    topic == `${smartthings_topic}/alarm/ADT Alarm System/state` &&
    message.toString().includes("_push")
  ) {
    let toState = null;

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
    log(`[MQTT] Updating to requested alarm state: ${toState}`);

    if (toState != null) {
      client.publish(alarm_command_topic, toState, { retain: false });
    }
    return;
  }
  if (topic != alarm_command_topic) {
    return;
  }

  let msg = message.toString();
  let action;
  let prev_state = "disarmed";

  if (alarm_last_state == "armed_home") prev_state = "stay";
  if (alarm_last_state == "armed_away") prev_state = "away";

  if (msg == "arm_home") {
    action = { newstate: "stay", prev_state: prev_state };
  } else if (msg == "disarm") {
    action = { newstate: "disarm", prev_state: prev_state };
  } else if (msg == "arm_away") {
    action = { newstate: "away", prev_state: prev_state };
  } else {
    // We don't understand this mode
    log(`[MQTT] Unrecognized alarm state requested: ${msg}`, "warn");
    return;
  }

  myAlarm.setAlarmState(action);
});

// Register Callbacks:
myAlarm.onDeviceUpdate(function (device) {
  log("[MQTT] Device callback" + JSON.stringify(device));
});

myAlarm.onStatusUpdate(function (device) {
  let mqtt_state = "unknown";
  let sm_alarm_value = "off";

  let status = device.status.toLowerCase();

  // SmartThings MQTT Discovery has no typical alarm device with stay|away|alarm|home status.
  // Instead, we'll repurpose the "alarm" and map strobe|siren|both|off to stay|away|alarm|home

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
    log(
      `[MQTT.ADT] Pushing alarm state '${mqtt_state}' to ${alarm_state_topic}...`
    );
    client.publish(alarm_state_topic, mqtt_state, { retain: true });
    if (smartthings) {
      let sm_alarm_topic = `${smartthings_topic}/alarm/ADT Alarm System/config`;
      log(
        `[MQTT.SmartThings] Pushing alarm state '${sm_alarm_value}' to ${sm_alarm_topic}...`
      );
      client.publish(sm_alarm_topic, sm_alarm_value, { retain: false });
    }
    alarm_last_state = mqtt_state;
  }
});

myAlarm.onZoneUpdate(function (device) {
  let dev_zone_state_topic = `${zone_state_topic}/${device.name}/state`;
  //let devValue = JSON.stringify(device);
  let sm_dev_zone_state_topic;

  // SmartThings MQTT Discovery assumes actionable devices have a topic set with `config`.
  // So `adt/zone/DEVICE_NAME/state` needs to turn into either:
  // `smartthings/contact/DEVICE_NAME/config`
  // or
  // `smartthings/motion/DEVICE_NAME/config`

  let contactValue, contactType;
  if (smartthings) {
    contactType = "contact";
    contactValue = device.state == "devStatOK" ? "closed" : "open";

    if (device.tags.includes("motion")) {
      contactType = "motion";
      contactValue = device.state == "devStatOK" ? "inactive" : "active";
    }
  }

  const isNewDevice = devices[device.id] == null;
  if (isNewDevice || device.timestamp > devices[device.id].timestamp) {
    log(
      `[MQTT.ADT] Pushing device state '${device.state}' to ${dev_zone_state_topic}...`
    );
    client.publish(dev_zone_state_topic, device.state, { retain: false });

    if (smartthings) {
      sm_dev_zone_state_topic = `${smartthings_topic}/${contactType}/${
        device.name
      }/${isNewDevice ? "config" : "state"}`;
      log(
        `[MQTT.SmartThings] ${
          isNewDevice ? "Pushing new " : "Updating existing"
        } device state '${contactValue}' to ${sm_dev_zone_state_topic}...`
      );
      client.publish(sm_dev_zone_state_topic, contactValue, { retain: false });
    }
  }
  devices[device.id] = device;
});

myAlarm.pulse();
