# 🧪 Local Development & Testing Guide

This guide helps you set up and test the ADT Pulse MQTT Bridge locally without Docker, perfect for development and debugging.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- Access to ADT Pulse account
- MQTT broker (local or remote)

### Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/BigThunderSR/adt-pulse-mqtt.git
   cd adt-pulse-mqtt/adt-pulse-mqtt
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit with your credentials
   nano .env
   ```

3. **Set Required Variables**
   ```bash
   # In .env file
   PULSE_USERNAME=your_adt_username
   PULSE_PASSWORD=your_adt_password
   PULSE_FINGERPRINT=your_device_fingerprint
   MQTT_HOST=localhost  # or your MQTT broker
   ```

4. **Start Application**
   ```bash
   npm start
   ```

## 🔧 Development Setup

### Environment Configuration Options

#### Option 1: .env File (Recommended)
```bash
# .env
PULSE_USERNAME=your_username
PULSE_PASSWORD=your_password
PULSE_FINGERPRINT=your_fingerprint
MQTT_HOST=localhost
MQTT_PORT=1883
```

#### Option 2: Shell Environment
```bash
export PULSE_USERNAME="your_username"
export PULSE_PASSWORD="your_password"
export PULSE_FINGERPRINT="your_fingerprint"
export MQTT_HOST="localhost"
npm start
```

#### Option 3: Legacy JSON (Backward Compatibility)
```bash
# Create /data/options.json (you may need sudo)
sudo mkdir -p /data
sudo tee /data/options.json << EOF
{
  "pulse_login": {
    "username": "your_username",
    "password": "your_password",
    "fingerprint": "your_fingerprint"
  },
  "mqtt_host": "localhost",
  "alarm_state_topic": "adt/alarm/state",
  "alarm_command_topic": "adt/alarm/cmd",
  "zone_state_topic": "adt/zone",
  "smartthings_topic": "smartthings",
  "smartthings": false
}
EOF
```

### MQTT Broker Setup

#### Local Mosquitto (Recommended for Testing)

**Install Mosquitto:**
```bash
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# macOS
brew install mosquitto

# Start service
sudo systemctl start mosquitto  # Linux
brew services start mosquitto   # macOS
```

**Test MQTT Connection:**
```bash
# Terminal 1: Subscribe to topics
mosquitto_sub -h localhost -t "adt/#" -v

# Terminal 2: Start the bridge
npm start

# You should see ADT messages in Terminal 1
```

#### Docker Mosquitto (Alternative)
```bash
# Quick MQTT broker for testing
docker run -it -p 1883:1883 eclipse-mosquitto:2.0
```

#### Remote MQTT Broker
```bash
# In .env file
MQTT_URL=mqtt://username:password@your-broker.com:1883
# OR
MQTT_HOST=your-broker.com
MQTT_USERNAME=username
MQTT_PASSWORD=password
MQTT_PORT=1883
```

## 🧩 Development Tools

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test

# Watch mode (if configured)
npm run test:watch
```

### Debugging
```bash
# Debug mode with inspector
npm run debug

# Then connect with Chrome DevTools or VS Code
# Navigate to chrome://inspect in Chrome
```

### Code Formatting
```bash
# Format code
npm run lint
```

### Environment Verification
```bash
# Run the verification script
chmod +x test-local-setup.sh
./test-local-setup.sh
```

## 📊 Monitoring & Debugging

### Application Logs

The application provides colored console output:
- 🟢 **Green**: Success operations (authentication, device updates)
- 🟡 **Yellow**: Warnings (sync issues, minor problems)
- 🔴 **Red**: Errors (authentication failures, connection issues)

### MQTT Topic Structure

Monitor these topics during testing:

```bash
# Alarm status
mosquitto_sub -h localhost -t "adt/alarm/state" -v

# Zone status (replace ZONE_NAME with actual zone)
mosquitto_sub -h localhost -t "adt/zone/+/state" -v

# All ADT topics
mosquitto_sub -h localhost -t "adt/#" -v

# Send alarm commands
mosquitto_pub -h localhost -t "adt/alarm/cmd" -m "arm_away"
mosquitto_pub -h localhost -t "adt/alarm/cmd" -m "arm_home"
mosquitto_pub -h localhost -t "adt/alarm/cmd" -m "disarm"
```

### Common Issues & Solutions

#### Authentication Issues
```bash
# Check credentials
echo "Username: $PULSE_USERNAME"
echo "Has Password: $([ -n "$PULSE_PASSWORD" ] && echo "Yes" || echo "No")"
echo "Has Fingerprint: $([ -n "$PULSE_FINGERPRINT" ] && echo "Yes" || echo "No")"

# Test ADT Pulse login manually
# Visit https://portal.adtpulse.com and verify credentials
```

#### MQTT Connection Issues
```bash
# Test MQTT broker connectivity
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "test" -m "hello"

# Check if broker requires authentication
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -u $MQTT_USERNAME -P $MQTT_PASSWORD -t "test" -m "hello"
```

#### Environment Variable Issues
```bash
# Check all environment variables
env | grep -E "(PULSE|MQTT)"

# Verify .env file loading
node -e "require('dotenv').config(); console.log(process.env.PULSE_USERNAME);"
```

## 🔄 Development Workflow

### 1. Initial Setup
```bash
git clone https://github.com/BigThunderSR/adt-pulse-mqtt.git
cd adt-pulse-mqtt/adt-pulse-mqtt
npm install
cp .env.example .env
# Edit .env with your credentials
```

### 2. Development Cycle
```bash
# 1. Make changes to code
nano server.js  # or adt-pulse.js

# 2. Run tests
npm test

# 3. Test locally
npm start

# 4. Monitor MQTT topics
mosquitto_sub -h localhost -t "adt/#" -v

# 5. Test alarm commands
mosquitto_pub -h localhost -t "adt/alarm/cmd" -m "arm_away"
```

### 3. Debugging Issues
```bash
# Enable debug mode
DEBUG=* npm start

# Or use built-in debug script
npm run debug
```

## 📁 Project Structure

```
adt-pulse-mqtt/
├── adt-pulse.js          # Core ADT Pulse integration (axios-based)
├── server.js             # Main application (MQTT bridge)
├── package.json          # Dependencies and scripts
├── .env.example          # Environment template
├── .env                  # Your local environment (don't commit!)
├── test/                 # Test files
│   └── pulseTest.js     # Main test suite
├── SECURITY_CONFIG.md    # Security configuration guide
├── LOCAL_TESTING.md      # This file
├── AXIOS_MIGRATION.md    # Technical migration details
└── test-local-setup.sh   # Environment verification script
```

## 🧪 Testing Scenarios

### Basic Functionality Test
1. Start the application
2. Verify authentication success in logs
3. Check alarm status updates
4. Test zone status updates
5. Send alarm commands via MQTT

### Error Handling Test
1. Test with wrong credentials
2. Test with unreachable MQTT broker
3. Test network interruption scenarios
4. Verify graceful reconnection

### Configuration Test
1. Test environment variable loading
2. Test fallback to JSON configuration
3. Test various MQTT connection options
4. Verify SmartThings integration (if enabled)

## 🔧 Advanced Configuration

### Custom Environment Setup
```bash
# Create custom environment for testing
cat > .env.test << EOF
PULSE_USERNAME=test_user
PULSE_PASSWORD=test_pass
PULSE_FINGERPRINT=test_fingerprint
MQTT_HOST=test.mosquitto.org
MQTT_PORT=1883
ALARM_STATE_TOPIC=test/adt/alarm/state
ALARM_COMMAND_TOPIC=test/adt/alarm/cmd
ZONE_STATE_TOPIC=test/adt/zone
EOF

# Use custom environment
cp .env.test .env
```

### Development with Home Assistant

If testing with Home Assistant:

```yaml
# configuration.yaml
mqtt:
  broker: localhost
  port: 1883

alarm_control_panel:
  - platform: mqtt
    name: "ADT Alarm"
    state_topic: "adt/alarm/state"
    command_topic: "adt/alarm/cmd"
    payload_disarm: "disarm"
    payload_arm_home: "arm_home" 
    payload_arm_away: "arm_away"
```

## 🚀 Production Deployment

Once local testing is complete:

1. **Docker Testing**
   ```bash
   docker build -t adt-pulse-mqtt .
   docker run --env-file .env adt-pulse-mqtt
   ```

2. **Environment Migration**
   - Test with production MQTT broker
   - Verify network connectivity
   - Test with production ADT credentials
   - Monitor for extended periods

3. **Security Review**
   - Run security verification script
   - Review environment variable exposure
   - Check file permissions
   - Verify no secrets in logs

## 📚 Additional Resources

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [Home Assistant MQTT Documentation](https://www.home-assistant.io/docs/mqtt/)
- [VS Code Node.js Debugging](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)

---

**Happy Coding!** 🎉 This local testing setup allows you to develop and debug efficiently while maintaining the same security practices used in production.