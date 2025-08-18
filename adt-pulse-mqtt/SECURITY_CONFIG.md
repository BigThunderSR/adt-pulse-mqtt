# 🔒 Security Configuration Guide

This document outlines the security enhancements and secure configuration options for the ADT Pulse MQTT Bridge.

## 🛡️ Security Enhancements

### Hierarchical Configuration System

The bridge now supports multiple configuration methods with built-in security best practices:

1. **Environment Variables** (Highest Priority)
2. **Docker Secrets/Config** (Medium Priority) 
3. **Legacy JSON Files** (Lowest Priority - Backward Compatibility)

### Environment Variable Configuration

**Recommended for all new deployments** - Never store credentials in files that might be accidentally committed or shared.

```bash
# Copy the template
cp .env.example .env

# Edit with your credentials
nano .env
```

#### Required Environment Variables

```bash
# ADT Pulse Credentials
PULSE_USERNAME=your_adt_username
PULSE_PASSWORD=your_adt_password  
PULSE_FINGERPRINT=your_device_fingerprint

# MQTT Broker
MQTT_HOST=your_mqtt_broker
# OR
MQTT_URL=mqtt://username:password@broker:1883
```

#### Optional Environment Variables

```bash
# MQTT Authentication
MQTT_USERNAME=mqtt_user
MQTT_PASSWORD=mqtt_pass
MQTT_PORT=1883

# Topic Configuration
ALARM_STATE_TOPIC=adt/alarm/state
ALARM_COMMAND_TOPIC=adt/alarm/cmd
ZONE_STATE_TOPIC=adt/zone

# SmartThings Integration
SMARTTHINGS_ENABLED=true
SMARTTHINGS_TOPIC=smartthings
```

## 🔐 Security Best Practices

### File Permissions

```bash
# Secure your .env file
chmod 600 .env

# Verify permissions
ls -la .env
# Should show: -rw------- (owner read/write only)
```

### Git Security

The enhanced `.gitignore` automatically excludes:

- All `.env*` files
- Configuration files with credentials
- SSL certificates and keys
- AWS credentials
- Database files
- Temporary files that might contain secrets

### Docker Security

The enhanced `.dockerignore` prevents secrets from being included in Docker images:

- Environment files (`.env*`)
- Configuration files with credentials
- Development files and documentation
- Test directories
- Sensitive development artifacts

### MQTT Security

#### Use Encrypted Connections

```bash
# Instead of plain MQTT
MQTT_URL=mqtt://broker:1883

# Use MQTT over TLS
MQTT_URL=mqtts://broker:8883

# Or MQTT over WebSocket with TLS
MQTT_URL=wss://broker:443/mqtt
```

#### MQTT Authentication

Always use authentication for production MQTT brokers:

```bash
MQTT_USERNAME=your_secure_username
MQTT_PASSWORD=your_strong_password
```

## 🚀 Deployment Scenarios

### Local Development

1. Copy `.env.example` to `.env`
2. Fill in your credentials
3. Run locally: `npm start`

### Docker Deployment

#### Option 1: Environment Variables

```yaml
# docker-compose.yml
version: '3.8'
services:
  adt-pulse-mqtt:
    image: your-image
    environment:
      - PULSE_USERNAME=${PULSE_USERNAME}
      - PULSE_PASSWORD=${PULSE_PASSWORD}
      - PULSE_FINGERPRINT=${PULSE_FINGERPRINT}
      - MQTT_HOST=${MQTT_HOST}
```

#### Option 2: Docker Secrets

```yaml
# docker-compose.yml
version: '3.8'
services:
  adt-pulse-mqtt:
    image: your-image
    secrets:
      - pulse_username
      - pulse_password
      - pulse_fingerprint
    environment:
      - PULSE_USERNAME_FILE=/run/secrets/pulse_username
      - PULSE_PASSWORD_FILE=/run/secrets/pulse_password
      - PULSE_FINGERPRINT_FILE=/run/secrets/pulse_fingerprint

secrets:
  pulse_username:
    file: ./secrets/pulse_username.txt
  pulse_password:
    file: ./secrets/pulse_password.txt
  pulse_fingerprint:
    file: ./secrets/pulse_fingerprint.txt
```

### Home Assistant Add-on

The legacy JSON configuration at `/data/options.json` continues to work for full backward compatibility:

```json
{
  "pulse_login": {
    "username": "your_username",
    "password": "your_password",
    "fingerprint": "your_fingerprint"
  },
  "mqtt_host": "core-mosquitto"
}
```

## ⚠️ Migration from Legacy Configuration

### Existing Users

**No action required!** Your existing `/data/options.json` configuration continues to work unchanged.

### Recommended Upgrade Path

1. **Test Environment Variables**
   ```bash
   # Set environment variables
   export PULSE_USERNAME="your_username"
   export MQTT_HOST="your_mqtt_host"
   
   # Test the application
   npm start
   ```

2. **Gradual Migration**
   - Start with non-sensitive settings (MQTT topics)
   - Move credentials to environment variables
   - Remove from JSON configuration

3. **Verify Security**
   ```bash
   # Check .env file permissions
   ls -la .env
   
   # Verify .env is not in git
   git status --ignored
   ```

## 🔍 Security Validation

### Environment Verification Script

Use the included verification script:

```bash
# Make executable
chmod +x test-local-setup.sh

# Run verification
./test-local-setup.sh
```

This script checks:
- Environment variable configuration
- File permissions
- Git security status
- MQTT connectivity
- Overall security posture

### Manual Security Checklist

- [ ] `.env` file has 600 permissions (owner read/write only)
- [ ] `.env` file is not tracked by git
- [ ] No credentials in JSON files committed to git
- [ ] MQTT uses authentication and encryption (mqtts://)
- [ ] Environment variables are properly set
- [ ] Docker images don't contain secrets
- [ ] Regular credential rotation schedule

## 📚 Additional Resources

- [Environment Variables Best Practices](https://12factor.net/config)
- [Docker Secrets Documentation](https://docs.docker.com/engine/swarm/secrets/)
- [MQTT Security Best Practices](https://mqtt.org/security/)
- [Home Assistant Add-on Security](https://developers.home-assistant.io/docs/add-ons/security/)

## 🐛 Troubleshooting

### Configuration Priority Issues

If settings aren't taking effect, check the priority order:

1. Environment variables (highest)
2. Docker configuration
3. Legacy JSON files (lowest)

### Permission Errors

```bash
# Fix .env file permissions
chmod 600 .env

# Check ownership
ls -la .env
```

### Git Security Warnings

```bash
# Remove accidentally committed .env file
git rm --cached .env
git commit -m "Remove .env from tracking"

# Add to .gitignore (already included)
echo ".env" >> .gitignore
```

---

**Remember**: Security is an ongoing process. Regularly review and update your configuration, rotate credentials, and monitor for security advisories.