# adt-pulse-mqtt (Smartthings Edge Fork)

ADT Pulse bridge for Home Assistant using MQTT.

Integrates ADT Pulse with MQTT for use with home automation such as [Home Assistant](https://github.com/adt-pulse-mqtt/hassio) or [SmartThings](https://github.com/toddaustin07/MQTT-Discovery). SmartApp allows automatic running our Routines upon alarm changing states.

### ADT Pulse Options

The pulse_login options are:

- `username`: The ADT Pulse Portal Username
- `password`: The ADT Pulse Portal Password
- `fingerprint`: The fingerprint of a trusted device authenticated with 2-factor authentication (see below)

### 2-Factor Authentication

ADT Pulse now requires 2-factor authentication and you will need to provide a device fingerprint:

1. Open a Chrome browser tab (under Incognito mode)
2. Open Developer Tools (using **View** ➜ **Developer** ➜ **Developer Tools** menu)
3. Click on the **Network** tab (make sure **Preserve log** checkbox is checked)
4. In the filter box, enter `signin.jsp?networkid=`
5. Go to https://portal.adtpulse.com or https://portal-ca.adtpulse.com and login to your account
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

You'll need an MQTT broker. [Mosquitto](https://www.home-assistant.io/addons/mosquitto/) is the easiest broker to provision.

In most cases, only the mqtt_options are needed:

- mqtt_host: core-mosquitto (if using Mosquitto add-on, otherwise hostname or IP address)
- mqtt_connection_options:
  - `username`: MQTT broker username
  - `password`: MQTT broker password

In most cases, these options are sufficient. Alternatively, the mqtt_url can be specified instead which allows [more advanced configurations](https://www.npmjs.com/package/mqtt#connect).

### Home Assistant Support

This repository can be used as an add-on to Home Assistant for MQTT Alarm Control Panel and MQTT Binary Sensor.

To configure these, you must edit your configuration.yaml:

To add the control panel:

```yaml
mqtt:
  alarm_control_panel:
    - name: "ADT Pulse"
      state_topic: "home/alarm/state"
      command_topic: "home/alarm/cmd"
      payload_arm_home: "arm_home"
      payload_arm_away: "arm_away"
      payload_disarm: "disarm"
```

After running the add-on, get a list all the zones found. There are a couple of ways to do this, but they all involve subscribing to the wildcard topic "adt/zones/#".

I recommend the MQTT Snooper app on Android or just use the mosquito command-line command:

```sh
> mosquitto_sub -h YOUR_MQTT_IP -v -t "adt/zone/#"
```

Once you know the names of MQTT topics for your zones, add the following to the configuration.yaml for each zone in binary_sensor:

```yaml
mqtt:
  binary_sensor:
    - name: "Kitchen Door"
      state_topic: "adt/zone/Kitchen Door/state"
      payload_on: "devStatOpen"
      payload_off: "devStatOK"
      device_class: door
      retain: true
```

This will provide basic support for door sensors. You can add additional binary sensors for other possible state values. As an example, you can add support for a low battery condition on a sensor.

```yaml
mqtt:
  binary_sensor:
    - name: "Kitchen Door Sensor Battery"
      state_topic: "adt/zone/Kitchen Door/state"
      payload_on: "devStatLowBatt"
      payload_off: "devStatOK"
      device_class: battery
```

Note: State topic names come from your Pulse configuration.

The possible state values are:

- `devStatOK` (device okay)
- `devStatOpen` (door/window opened)
- `devStatMotion` (detected motion)
- `devstatLowBatt`: (low battery condition)
- `devStatTamper` (glass broken or device tamper)
- `devStatAlarm` (detected CO/Smoke)
- `devStatUnknown` (device offline)

If a device type is not listed, open an issue containing your MQTT dump which lists your zones.

## Smartthings Support

- This repository can be configured to support integration with SmartThings either with or without (see below) using Home Assistant.

```json
"smartthings": true
```

- If `smartthings` is enabled, the MQTT topic will begin with a mandatory `smartthings/`
- See the SmartThings Edge driver for [MQTT Discovery](https://github.com/toddaustin07/MQTT-Discovery) for more information.

## Docker Compose

If you want to run this add-on independently of Home Assistant using Docker, here is a sample Docker Compose file:

```yaml
version: "3"
services:
  pulse-adt-mqtt:
    container_name: pulse-adt-mqtt
    image: adtpulsemqtt/adt-pulse-mqtt
    network_mode: host
    restart: always
    volumes:
      - /local/path/to/config-directory:/data
```

Sample config.json placed in the config-directory:

```json
{
    "pulse_login" : {
        "username": "username",
        "password": "password",
        "fingerprint": "long_xyz_abc_123"
    },
    "pulse_interval_ms": 5000,
    "mqtt_host" : "mqtt_host"
    "mqtt_connect_options" :  {
      "username" : "username",
      "password" : "password",
      },
    "alarm_state_topic": "home/alarm/state",
    "alarm_command_topic": "home/alarm/cmd",
    "zone_state_topic": "adt/zone",
    "smartthings": false
}
```
