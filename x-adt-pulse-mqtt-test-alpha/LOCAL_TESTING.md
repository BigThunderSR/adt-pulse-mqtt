# Local Testing Guide

## Testing ADT Pulse MQTT Locally (Without Docker)

This guide shows you how to run and test the ADT Pulse MQTT bridge locally on your machine without building Docker images.

### Prerequisites

1. **Node.js** (version 20 or higher)
2. **MQTT Broker** (like Mosquitto) running locally or accessible remotely
3. **ADT Pulse account credentials**

### Setup Steps

#### 1. Install Dependencies

```bash
cd /path/to/x-adt-pulse-mqtt-test-alpha
npm install
```

#### 2. Configure the Application

**🔒 Secure Method (Recommended)**: Create a `.env` file

```bash
# Copy the example file
cp .env.example .env

# Edit with your actual settings
nano .env  # or your preferred editor
```

Edit `.env` with your actual credentials:

```bash
# ADT Pulse Credentials
ADT_USERNAME=your_actual_adt_username
ADT_PASSWORD=your_actual_adt_password
ADT_FINGERPRINT=your_device_fingerprint

# MQTT Configuration  
MQTT_HOST=localhost
MQTT_USERNAME=mqtt_username
MQTT_PASSWORD=mqtt_password

# MQTT Topics (customize as needed)
ALARM_STATE_TOPIC=home/alarm/state
ALARM_COMMAND_TOPIC=home/alarm/cmd
ZONE_STATE_TOPIC=adt/zone
SMARTTHINGS_TOPIC=smartthings
SMARTTHINGS_ENABLED=false
```

**Legacy Method**: You can still use `local-config.json` format, but `.env` is more secure since it won't be committed to Git.

**Important Configuration Notes:**

- **Security**: The `.env` file contains sensitive credentials and will NOT be committed to Git
- Replace `your_actual_adt_username` and `your_actual_adt_password` with your ADT Pulse credentials
- Set `fingerprint` to your device identifier (if you don't have one, you can leave it empty initially)  
- Update `MQTT_HOST` to point to your MQTT broker (localhost if running locally)
- If using MQTT authentication, fill in the `MQTT_USERNAME` and `MQTT_PASSWORD`

**Configuration Priority:**

1. **Environment variables** (from `.env` file) - 🔒 Most secure
2. **Docker config** (`/data/options.json`) - For container deployment
3. **Legacy local config** (`local-config.json`) - Backward compatibility

#### 3. Set up MQTT Broker (if needed)

##### Option A: Install Mosquitto locally

```bash
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# macOS
brew install mosquitto

# Start the service
sudo systemctl start mosquitto  # Linux
brew services start mosquitto   # macOS
```

##### Option B: Use Docker for MQTT only

```bash
docker run -it -p 1883:1883 eclipse-mosquitto
```

#### 4. Run the Application

```bash
npm run start
```

### Testing Commands

#### Monitor MQTT Topics

Open separate terminals to monitor MQTT traffic:

```bash
# Monitor alarm states
mosquitto_sub -h localhost -t "home/alarm/state"

# Monitor zone states  
mosquitto_sub -h localhost -t "adt/zone/+/state"

# Monitor all ADT topics
mosquitto_sub -h localhost -t "adt/#"
```

#### Send Commands

```bash
# Disarm alarm
mosquitto_pub -h localhost -t "home/alarm/cmd" -m "DISARM"

# Arm alarm (stay)
mosquitto_pub -h localhost -t "home/alarm/cmd" -m "ARM_HOME"

# Arm alarm (away)
mosquitto_pub -h localhost -t "home/alarm/cmd" -m "ARM_AWAY"
```

### Development Commands

```bash
# Run tests
npm test

# Run with debug output
npm run debug

# Lint code
npm run lint
```

### Troubleshooting

#### Authentication Issues

- Verify your ADT Pulse credentials work by logging into the web portal
- Check if 2FA is enabled on your account (may require special handling)
- Monitor the console output for specific authentication error messages

#### MQTT Connection Issues

- Verify MQTT broker is running: `mosquitto_pub -h localhost -t test -m "hello"`
- Check firewall settings if using remote MQTT broker
- Verify MQTT credentials if authentication is enabled

#### Network Issues

- The app connects to `https://portal.adtpulse.com`
- Ensure your network allows HTTPS connections
- Check for corporate firewalls or proxy settings

### File Structure

```text
x-adt-pulse-mqtt-test-alpha/
├── adt-pulse.js           # Main ADT Pulse API client (now uses axios)
├── server.js              # MQTT bridge server
├── local-config.json      # Local configuration (you create this)
├── package.json           # Dependencies and scripts
├── test/                  # Test suite
└── AXIOS_MIGRATION.md     # Migration documentation
```

### Differences from Docker Version

When running locally:

- Configuration is read from `local-config.json` instead of `/data/options.json`
- No automatic restarts (you need to manually restart after crashes)
- Logs go to console instead of Docker logs
- You manage the Node.js process directly

### Integration Testing

Once running, you can:

1. Monitor the logs to see zone status updates
2. Use Home Assistant MQTT integration to connect
3. Test alarm state changes through MQTT commands
4. Verify sensor state changes are reported correctly

### Performance Notes

The application:

- Polls ADT Pulse every 5 seconds for status updates
- Only sends MQTT updates when states actually change
- Handles authentication automatically (re-login if session expires)
- Uses modern axios HTTP client for better performance and security
