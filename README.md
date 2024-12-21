[![Home Assistant Add-on](https://img.shields.io/badge/home_assistant-add--on-blue.svg?logo=homeassistant&logoColor=white)](https://github.com/BigThunderSR/adt-pulse-mqtt)
![Supports aarch64 Architecture][aarch64-shield]
![Supports amd64 Architecture][amd64-shield]
![Supports armhf Architecture][armhf-shield]

[![CodeQL](https://github.com/BigThunderSR/adt-pulse-mqtt/actions/workflows/codeql.yml/badge.svg)](https://github.com/BigThunderSR/adt-pulse-mqtt/actions/workflows/codeql.yml)
[![Lint](https://github.com/BigThunderSR/adt-pulse-mqtt/actions/workflows/lint.yaml/badge.svg)](https://github.com/BigThunderSR/adt-pulse-mqtt/actions/workflows/lint.yaml)
[![Node.js CI](https://github.com/BigThunderSR/adt-pulse-mqtt/actions/workflows/node.js.yml/badge.svg)](https://github.com/BigThunderSR/adt-pulse-mqtt/actions/workflows/node.js.yml)
[![Builder](https://github.com/BigThunderSR/adt-pulse-mqtt/actions/workflows/builder.yaml/badge.svg)](https://github.com/BigThunderSR/adt-pulse-mqtt/actions/workflows/builder.yaml)

# adt-pulse-mqtt

ADT Pulse bridge for Home Assistant using MQTT.

Integrates ADT Pulse with Home Assistant. You can also choose to expose ADT devices associated with your ADT Pulse alarm system to SmartThings using [MQTT Discovery](https://github.com/toddaustin07/MQTT-Discovery).

## Home Assistant Setup

[![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/BigThunderSR/adt-pulse-mqtt)

- First, add the repository (https://github.com/BigThunderSR/adt-pulse-mqtt) using the Add-on Store in the Home Assistant Supervisor. This is the easiest way to run this add-on, but it can also run as an independent container using Docker. In both cases, communication is through MQTT.
- Install ADT Pulse MQTT from the store. Don't forget to configure `pulse_login` with your ADT Pulse Portal username and password. A separate login for Home Assistant is recommended.
- Configure Add-on Options

### ADT Pulse Options

The pulse_login options are:

- username: The ADT Pulse Portal Username
- password: The ADT Pulse Portal Password
- fingerprint: The fingerprint of trusted device authenticated with 2-factor authentication (see below)

### 2-Factor Authentication

ADT Pulse now requires 2-factor authentication and you will need to provide a device fingerprint:

1. Open a Chrome browser tab (under Incognito mode)
2. Open Developer Tools (using **Menu** ➜ **More tools** ➜ **Developer tools** menu or **Ctrl+Shift+I**)
3. Click on the **Network** tab (make sure **Preserve log** checkbox is checked)
4. In the filter box, enter `signin.jsp?networkid=`
5. Go to `https://portal.adtpulse.com` or `https://portal-ca.adtpulse.com` and login to your account
6. Click **Request Code**, type in the requested code, and then click **Submit Code**
7. Click **Trust this device** and name the device `Homebridge`
8. Click **Save and Continue**
9. Click **Sign Out** in the top right corner of the webpage
10. Login to your account (once again)
11. Click on the network call (beginning with `signin.jsp?networkid=`) appearing in the DevTools window. Select the last one.
12. In the **Payload** tab, under **Form Data**, copy the entire **fingerprint** (after `fingerprint:`, do not include spaces)
13. Paste the copied text into the `fingerprint` field into your `config.json`
14. Close the Chrome window (DO NOT sign out)

### MQTT Options

You'll need an MQTT broker. The Mosquitto add-on broker (https://www.home-assistant.io/addons/mosquitto/) is the easiest to implement.

In most cases, only the mqtt_options are needed:

- mqtt_host: core-mosquitto (if using Mosquitto add-on, otherwise hostname or IP address)
- mqtt_connection_options:
  - username: MQTT broker username
  - password: MQTT broker password

In most cases, these options are sufficient. Alternatively, the mqtt_url can be specified instead which allows more advanced configurations (see https://www.npmjs.com/package/mqtt#connect).

### Home Assistant Configuration

This add-on uses the Home Assistant integrations for MQTT Alarm Control Panel and MQTT Binary Sensor.

To configure these, you must edit your configuration.yaml:

To add the control panel:

<pre>
mqtt:
   alarm_control_panel:
     - name: "ADT Pulse"
       state_topic: "home/alarm/state"
       command_topic: "home/alarm/cmd"
       payload_arm_home: "arm_home"
       payload_arm_away: "arm_away"
       payload_disarm: "disarm"
       code_arm_required: false  ## Needs to be added starting with HA Core 2024.6 ##
</pre>

After running the add-on, get a list all the zones found. There are a couple of ways to do this, but they all involve subscribing to the wildcard topic "adt/zones/#".

I recommend the MQTT Snooper app on Android or just use the mosquito command-line command:

<pre>
# mosquitto_sub -h YOUR_MQTT_IP -v -t "adt/zone/#"
</pre>

Once you know the names of MQTT topics for your zones, add the following to the configuration.yaml for each zone in binary_sensor:

<pre>
mqtt:
  binary_sensor:
    - name: "Kitchen Door"
      state_topic: "adt/zone/Kitchen Door/state"
      payload_on: "devStatOpen"
      payload_off: "devStatOK"
      device_class: door
      retain: true
</pre>

This will provide basic support for door sensors. You can add additional binary sensors for other possible state values. As an example, you can add support for a low battery condition on a sensor.

<pre>
mqtt:
  binary_sensor:
    - name: "Kitchen Door Sensor Battery"
      state_topic: "adt/zone/Kitchen Door/state"
      payload_on: "devStatLowBatt"
      payload_off: "devStatOK"
      device_class: battery
</pre>

Note: State topic names come from your Pulse configuration.

The possible state values are:

- devStatOK (device okay)
- devStatOpen (door/window opened)
- devStatMotion (detected motion)
- devstatLowBatt: (low battery condition)
- devStatTamper (glass broken or device tamper)
- devStatAlarm (detected CO/Smoke)
- devStatUnknown (device offline)

If a device type is not listed, open an issue containing your MQTT dump which lists your zones.

## Docker Compose

If you want to run this add-on independently using Docker, here is a sample Docker Compose file:

```
version: '3'
services:
   pulse-adt-mqtt:
      container_name: pulse-adt-mqtt
      image: bigthundersr/adt-pulse-mqtt
      network_mode: host
      restart: always
      volumes:
       - /local/path/to/config-directory:/data~~
```

Sample config.json placed in the config-directory:

```
{
    "pulse_login" : {
        "username": "username",
        "password": "password"
    },
    "mqtt_host" : "mqtt_host"
    "mqtt_connect_options" :  {
      "username" : "username",
      "password" : "password",
      },
    "alarm_state_topic": "home/alarm/state",
    "alarm_command_topic": "home/alarm/cmd",
    "zone_state_topic": "adt/zone",
    "smartthings_topic": "smartthings",
    "smartthings": false
}
```

## Smartthings Support using the MQTT Discovery Edge Driver (EXPERIMENTAL)

ADT Pulse contact (door, window, etc.) and motion detection devices may be exposed to SmartThings for one-way status updates using the [MQTT Discovery edge driver](https://github.com/toddaustin07/MQTT-Discovery) driver.

**&#9432;** Note that the MQTT Discovery edge driver does not currently support security panel devices, so there is no current support for either status or configuration of the ADT Pulse alarm system ("armed", "disarmed", "home", "away", etc.) via SmartThings. Only contact and motion devices are currently supported, though siren and/or panel support may come in a future update.

1. Make sure an MQTT server is set up and available.
2. Follow instructions to set up the [MQTT Discover edge driver](https://github.com/toddaustin07/MQTT-Discovery?tab=readme-ov-file#instructions) to subscribe to that MQTT server.
3. Set up and ensure the `adt-mqtt-pulse` application is configured and running properly, pointing to the same MQTT server.
4. Upon refresh in the MQTT Discovery device in SmartThings application as per setup instructions, you should see ADT devices appear.

[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg
[armhf-shield]: https://img.shields.io/badge/armhf-yes-green.svg
[armv7-shield]: https://img.shields.io/badge/armv7-yes-green.svg
[i386-shield]: https://img.shields.io/badge/i386-yes-green.svg
