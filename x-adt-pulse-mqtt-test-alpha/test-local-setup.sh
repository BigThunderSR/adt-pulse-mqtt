#!/bin/bash

# ADT Pulse MQTT Local Test Script

echo "=== ADT Pulse MQTT Local Testing ==="
echo

# Check Node.js version
echo "1. Checking Node.js version..."
node_version=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js $node_version is installed"
else
    echo "❌ Node.js is not installed. Please install Node.js 20 or higher."
    exit 1
fi

# Check if config file exists
echo
echo "2. Checking configuration..."
if [ -f ".env" ]; then
    echo "✅ Environment configuration file '.env' found"
    
    # Check if it has the required variables
    if grep -q "ADT_USERNAME=" .env && grep -q "ADT_PASSWORD=" .env; then
        echo "✅ Required ADT credentials configured in .env"
    else
        echo "⚠️  .env file exists but missing required ADT credentials"
        echo "Make sure ADT_USERNAME and ADT_PASSWORD are set in .env"
    fi
elif [ -f "local-config.json" ]; then
    echo "✅ Legacy configuration file 'local-config.json' found"
    echo "ℹ️  Consider migrating to .env file for better security"
else
    echo "❌ No configuration file found"
    echo "Please create .env file with your ADT Pulse and MQTT settings:"
    echo "  cp .env.example .env"
    echo "  # Edit .env with your actual credentials"
    echo "See LOCAL_TESTING.md for details"
    exit 1
fi

# Check if dependencies are installed
echo
echo "3. Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ Dependencies are installed"
else
    echo "⚠️  Dependencies not found. Installing..."
    npm install
fi

# Test MQTT connectivity (if mosquitto clients are available)
echo
echo "4. Testing MQTT connectivity..."
if command -v mosquitto_pub &> /dev/null; then
    # Try to get MQTT host from .env file or use localhost as fallback
    mqtt_host="localhost"
    if [ -f ".env" ]; then
        mqtt_host=$(grep "^MQTT_HOST=" .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'")
        if [ -z "$mqtt_host" ]; then
            mqtt_host="localhost"
        fi
    elif [ -f "local-config.json" ]; then
        mqtt_host=$(grep -o '"mqtt_host":[^,]*' local-config.json 2>/dev/null | cut -d'"' -f4)
        if [ -z "$mqtt_host" ]; then
            mqtt_host="localhost"
        fi
    fi
    
    if mosquitto_pub -h "$mqtt_host" -t "test/connection" -m "test" 2>/dev/null; then
        echo "✅ MQTT broker at $mqtt_host is reachable"
    else
        echo "⚠️  Cannot connect to MQTT broker at $mqtt_host"
        echo "Make sure your MQTT broker is running and accessible"
    fi
else
    echo "⚠️  mosquitto_pub not found - cannot test MQTT connectivity"
    echo "Install mosquitto-clients to test MQTT connection"
fi

# Run syntax check
echo
echo "5. Checking code syntax..."
if node -c adt-pulse.js; then
    echo "✅ Code syntax is valid"
else
    echo "❌ Syntax errors found in code"
    exit 1
fi

# Run tests
echo
echo "6. Running tests..."
if npm test > /dev/null 2>&1; then
    echo "✅ All tests pass"
else
    echo "⚠️  Some tests failed - check 'npm test' output for details"
fi

echo
echo "=== Setup Check Complete ==="
echo
echo "To start the application:"
echo "  npm run start"
echo
echo "To monitor MQTT messages:"
echo "  mosquitto_sub -h $mqtt_host -t 'home/alarm/+'"
echo "  mosquitto_sub -h $mqtt_host -t 'adt/zone/+/state'"
echo
echo "Configuration priority:"
echo "  1. Environment variables (.env file) 🔒 SECURE"
echo "  2. Docker config (/data/options.json)"
echo "  3. Legacy local config (local-config.json)"
echo
echo "See LOCAL_TESTING.md for detailed usage instructions."
