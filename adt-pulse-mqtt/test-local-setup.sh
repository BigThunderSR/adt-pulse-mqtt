#!/bin/bash

# ====================================================================
# ADT Pulse MQTT Bridge - Local Setup Verification Script  
# ====================================================================
# This script verifies your local development environment is properly
# configured for secure operation of the ADT Pulse MQTT Bridge.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

echo -e "${BLUE}======================================================================"
echo -e "🔧 ADT Pulse MQTT Bridge - Local Setup Verification"
echo -e "======================================================================${NC}"
echo ""

# Helper functions
pass_check() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASS_COUNT++))
}

warn_check() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
    ((WARN_COUNT++))
}

fail_check() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAIL_COUNT++))
}

info_check() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

# ====================================================================
# 1. Node.js and Dependencies
# ====================================================================
echo -e "${BLUE}🚀 Checking Node.js Environment...${NC}"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    pass_check "Node.js is installed: $NODE_VERSION"
    
    # Check Node.js version (need 20+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 20 ]; then
        pass_check "Node.js version is compatible (≥20)"
    else
        warn_check "Node.js version $NODE_VERSION might be too old (recommended: ≥20)"
    fi
else
    fail_check "Node.js is not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    pass_check "npm is installed: $NPM_VERSION"
else
    fail_check "npm is not installed"
fi

# Check if we're in the right directory
if [ -f "package.json" ] && [ -f "adt-pulse.js" ] && [ -f "server.js" ]; then
    pass_check "In correct project directory"
else
    fail_check "Not in ADT Pulse MQTT project directory (missing key files)"
    echo "       Please run this script from the adt-pulse-mqtt directory"
fi

# Check node_modules
if [ -d "node_modules" ]; then
    pass_check "Dependencies installed (node_modules exists)"
    
    # Check key dependencies
    if [ -d "node_modules/axios" ]; then
        pass_check "Axios dependency found"
    else
        fail_check "Axios dependency missing - run 'npm install'"
    fi
    
    if [ -d "node_modules/dotenv" ]; then
        pass_check "Dotenv dependency found"
    else
        warn_check "Dotenv dependency missing - environment variable support may not work"
    fi
else
    fail_check "Dependencies not installed - run 'npm install'"
fi

echo ""

# ====================================================================
# 2. Environment Configuration
# ====================================================================
echo -e "${BLUE}🔧 Checking Environment Configuration...${NC}"

# Check for .env file
if [ -f ".env" ]; then
    pass_check ".env file exists"
    
    # Check .env file permissions
    ENV_PERMS=$(stat -c %a .env 2>/dev/null || stat -f %OLp .env 2>/dev/null || echo "unknown")
    if [ "$ENV_PERMS" = "600" ]; then
        pass_check ".env file has secure permissions (600)"
    elif [ "$ENV_PERMS" = "unknown" ]; then
        warn_check ".env file permissions could not be checked"
    else
        warn_check ".env file permissions are $ENV_PERMS (recommended: 600)"
        echo "       Fix with: chmod 600 .env"
    fi
else
    warn_check ".env file not found"
    if [ -f ".env.example" ]; then
        info_check "Template available: cp .env.example .env"
    else
        info_check "Create .env file with your configuration"
    fi
fi

# Check for .env.example
if [ -f ".env.example" ]; then
    pass_check ".env.example template exists"
else
    warn_check ".env.example template missing"
fi

# Load environment variables if .env exists
if [ -f ".env" ]; then
    set -a  # automatically export all variables
    source .env
    set +a
fi

# Check required environment variables
if [ -n "$PULSE_USERNAME" ]; then
    pass_check "PULSE_USERNAME is set"
else
    fail_check "PULSE_USERNAME not set"
fi

if [ -n "$PULSE_PASSWORD" ]; then
    pass_check "PULSE_PASSWORD is set"
else
    fail_check "PULSE_PASSWORD not set"
fi

if [ -n "$PULSE_FINGERPRINT" ]; then
    pass_check "PULSE_FINGERPRINT is set"
else
    fail_check "PULSE_FINGERPRINT not set"
fi

# Check MQTT configuration
if [ -n "$MQTT_HOST" ] || [ -n "$MQTT_URL" ]; then
    if [ -n "$MQTT_URL" ]; then
        pass_check "MQTT configuration: MQTT_URL is set"
    else
        pass_check "MQTT configuration: MQTT_HOST is set to '$MQTT_HOST'"
    fi
else
    fail_check "MQTT configuration missing (need MQTT_HOST or MQTT_URL)"
fi

echo ""

# ====================================================================
# 3. Security Checks
# ====================================================================
echo -e "${BLUE}🔒 Security Configuration Checks...${NC}"

# Check if .env is in .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        pass_check ".env files are excluded from git"
    else
        warn_check ".env not found in .gitignore"
        echo "       Add '.env' to .gitignore to prevent committing secrets"
    fi
else
    warn_check ".gitignore file not found"
fi

# Check if .env is tracked by git
if command -v git &> /dev/null && [ -d ".git" ]; then
    if git ls-files --error-unmatch .env &> /dev/null; then
        fail_check ".env file is tracked by git - SECURITY RISK!"
        echo "       Remove with: git rm --cached .env"
    else
        pass_check ".env file is not tracked by git"
    fi
else
    info_check "Not a git repository or git not available"
fi

# Check for secrets in environment variables
if env | grep -q "PASSWORD\|SECRET\|KEY" | grep -v "PULSE_"; then
    warn_check "Other password/secret environment variables detected"
    echo "       Review environment for sensitive data exposure"
fi

echo ""

# ====================================================================
# 4. MQTT Connectivity Test
# ====================================================================
echo -e "${BLUE}📡 MQTT Connectivity Test...${NC}"

# Determine MQTT connection details
if [ -n "$MQTT_URL" ]; then
    MQTT_TEST_HOST=$(echo "$MQTT_URL" | sed -n 's|.*://\([^:@]*@\)\?\([^:]*\).*|\2|p')
    MQTT_TEST_PORT=$(echo "$MQTT_URL" | sed -n 's|.*:\([0-9]*\).*|\1|p')
    if [ -z "$MQTT_TEST_PORT" ]; then
        if echo "$MQTT_URL" | grep -q "mqtts://"; then
            MQTT_TEST_PORT=8883
        else
            MQTT_TEST_PORT=1883
        fi
    fi
else
    MQTT_TEST_HOST=${MQTT_HOST:-"localhost"}
    MQTT_TEST_PORT=${MQTT_PORT:-1883}
fi

info_check "Testing MQTT connectivity to $MQTT_TEST_HOST:$MQTT_TEST_PORT"

# Test basic connectivity
if command -v nc &> /dev/null; then
    if nc -z "$MQTT_TEST_HOST" "$MQTT_TEST_PORT" 2>/dev/null; then
        pass_check "MQTT broker is reachable at $MQTT_TEST_HOST:$MQTT_TEST_PORT"
    else
        warn_check "Cannot reach MQTT broker at $MQTT_TEST_HOST:$MQTT_TEST_PORT"
        echo "       Check broker is running and network connectivity"
    fi
elif command -v telnet &> /dev/null; then
    if timeout 3 telnet "$MQTT_TEST_HOST" "$MQTT_TEST_PORT" &>/dev/null; then
        pass_check "MQTT broker is reachable at $MQTT_TEST_HOST:$MQTT_TEST_PORT"
    else
        warn_check "Cannot reach MQTT broker at $MQTT_TEST_HOST:$MQTT_TEST_PORT"
    fi
else
    info_check "Cannot test MQTT connectivity (nc/telnet not available)"
fi

# Test mosquitto clients if available
if command -v mosquitto_pub &> /dev/null; then
    info_check "Testing MQTT publish/subscribe..."
    
    # Create test credentials if needed
    MQTT_AUTH_ARGS=""
    if [ -n "$MQTT_USERNAME" ] && [ -n "$MQTT_PASSWORD" ]; then
        MQTT_AUTH_ARGS="-u $MQTT_USERNAME -P $MQTT_PASSWORD"
    fi
    
    # Test publish
    if timeout 5 mosquitto_pub -h "$MQTT_TEST_HOST" -p "$MQTT_TEST_PORT" $MQTT_AUTH_ARGS -t "test/setup" -m "hello" 2>/dev/null; then
        pass_check "MQTT publish test successful"
    else
        warn_check "MQTT publish test failed"
        echo "       Check MQTT credentials and broker configuration"
    fi
else
    info_check "mosquitto_pub not available - cannot test MQTT operations"
    echo "       Install with: apt-get install mosquitto-clients (Ubuntu)"
    echo "                 or: brew install mosquitto (macOS)"
fi

echo ""

# ====================================================================
# 5. Application Test
# ====================================================================
echo -e "${BLUE}🧪 Application Verification...${NC}"

# Check if tests can run
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    pass_check "Test script available in package.json"
    
    # Try to run tests
    info_check "Running test suite..."
    if npm test &> /tmp/test-output.log; then
        pass_check "All tests pass"
    else
        fail_check "Some tests failed"
        echo "       Check test output: cat /tmp/test-output.log"
    fi
else
    warn_check "No test script found in package.json"
fi

# Check main application files
if [ -f "server.js" ]; then
    if node -c server.js 2>/dev/null; then
        pass_check "server.js syntax is valid"
    else
        fail_check "server.js has syntax errors"
    fi
fi

if [ -f "adt-pulse.js" ]; then
    if node -c adt-pulse.js 2>/dev/null; then
        pass_check "adt-pulse.js syntax is valid"
    else
        fail_check "adt-pulse.js has syntax errors"
    fi
fi

echo ""

# ====================================================================
# 6. Summary Report
# ====================================================================
echo -e "${BLUE}======================================================================"
echo -e "📊 Verification Summary"
echo -e "======================================================================${NC}"

echo -e "${GREEN}✅ Passed: $PASS_COUNT${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"

echo ""

if [ $FAIL_COUNT -eq 0 ] && [ $WARN_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 Perfect! Your setup is ready for development.${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Start the application: npm start"
    echo "2. Monitor MQTT topics: mosquitto_sub -h $MQTT_TEST_HOST -t 'adt/#' -v"
    echo "3. Test alarm commands: mosquitto_pub -h $MQTT_TEST_HOST -t 'adt/alarm/cmd' -m 'arm_away'"
elif [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Setup is mostly ready, but please review the warnings above.${NC}"
    echo ""
    echo -e "${BLUE}Recommended actions:${NC}"
    echo "1. Address security warnings (file permissions, git tracking)"
    echo "2. Test MQTT connectivity if warnings exist"
    echo "3. Start application: npm start"
else
    echo -e "${RED}❌ Setup has critical issues that need to be fixed.${NC}"
    echo ""
    echo -e "${BLUE}Required actions:${NC}"
    echo "1. Fix all failed checks above"
    echo "2. Install missing dependencies: npm install"
    echo "3. Configure environment variables in .env file"
    echo "4. Re-run this script: ./test-local-setup.sh"
fi

echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "- Local Testing Guide: LOCAL_TESTING.md"
echo "- Security Configuration: SECURITY_CONFIG.md"
echo "- Migration Details: AXIOS_MIGRATION.md"

echo ""
echo -e "${BLUE}💬 Need help? Check the documentation or open an issue on GitHub.${NC}"

# Exit with appropriate code
if [ $FAIL_COUNT -gt 0 ]; then
    exit 1
elif [ $WARN_COUNT -gt 0 ]; then
    exit 2
else
    exit 0
fi