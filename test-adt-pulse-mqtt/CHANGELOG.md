# Changelog

## 5.0.1 - Graceful Shutdown Fix (2025-12-11)

### 🐛 Bug Fixes

- **Graceful Shutdown**: Added proper cleanup handling when addon is stopped
  - Stops the 5-second pulse sync interval
  - Logs out from ADT Pulse session cleanly
  - Disconnects MQTT client properly
  - Handles SIGTERM and SIGINT signals

### 🔧 Technical Improvements

- **Signal Handling**: Added process signal handlers in `server.js`
- **Shell Script**: Updated `run.sh` to trap and forward signals to Node.js
- **Error Handling**: Added handlers for uncaught exceptions and unhandled rejections
- **AppArmor Profile**: Added `apparmor.txt` for improved security score

---

## 5.0.0 - Complete Modernization Release (2025-08-19)

### � Major Breaking Changes

- **HTTP Client Migration**: Completely replaced deprecated `request` library with modern `axios`
- **Testing Framework**: Migrated from `nyc` to modern `c8` coverage tool using Node.js built-in V8 coverage
- **Architecture Support**: Removed `armhf` architecture, focusing on `aarch64` and `amd64` for better performance
- **Dependency Updates**: Major version updates to core dependencies with security improvements
- **Removed Dependencies**: Eliminated deprecated `request` package and streamlined dependencies

### ✨ New Features & Enhancements

- **Enhanced Local Testing**: Added `.env` file support for simplified local development
- **Configuration Templates**: Added `local-config.json.example` and `.env.example` files
- **Comprehensive Documentation**: Added `LOCAL_TESTING.md` and `AXIOS_MIGRATION.md` guides
- **Modern ESLint Integration**: Added native ESLint parsing for consistent code quality
- **Enhanced Test Coverage**: Improved from 67% to 79.9% total coverage (+12.9% improvement)

### 🛡️ Critical Stability Improvements

- **Application Reliability**: Fixed all unhandled promise rejections that caused crashes
- **Error Handling**: Added comprehensive `.catch()` handlers for all async operations
- **Network Resilience**: Improved handling of network timeouts and connectivity issues
- **Graceful Degradation**: Application continues running during network instability

### 📈 Test Suite Expansion

- **Test Coverage**: Expanded test suite from 76 to 92 comprehensive test cases (+16 new tests)
- **Error Handling Tests**: Added coverage for timeout scenarios, network failures, and authentication errors
- **Edge Case Testing**: Enhanced setAlarmState testing with SAT token variations and force arm retry logic
- **Configuration Testing**: Added comprehensive constructor parameter validation tests
- **Mock Testing**: Improved HTTP request mocking with comprehensive scenario coverage

### 🔧 Technical Infrastructure

- **Node.js**: Requires Node.js >= 20 for modern features and security
- **Coverage Engine**: Uses Node.js built-in V8 coverage for faster generation without runtime overhead
- **HTTP Client**: Complete migration to `axios` with cookie support and better error handling
- **Code Quality**: Fixed all ESLint errors including unused variables and unsafe prototype patterns
- **Security Audit**: Zero known vulnerabilities with updated dependency tree

### 🔄 Backwards Compatibility

- ✅ **Configuration**: Still supports `local-config.json` alongside new `.env` support
- ✅ **MQTT Topics**: All existing integrations continue to work without changes
- ✅ **Docker**: Same Docker interface and environment variables
- ✅ **External API**: No breaking changes for end users or Home Assistant integration

### 📋 Migration Guide

- **Required**: Update to Node.js >= 20 if using older versions
- **Optional**: Migrate to `.env` file for simplified local testing
- **Recommended**: Review `LOCAL_TESTING.md` for new development features
- **Testing**: Run comprehensive test suite to verify functionality

### 🎯 Impact Summary

- **Reliability**: Significantly reduced application crashes from network issues
- **Modernization**: Updated to modern HTTP client (axios) and native Node.js coverage tools (c8)
- **Security**: Modern dependencies with active security support and vulnerability patches
- **Maintainability**: Cleaner codebase with comprehensive error handling and testing
- **Development**: Enhanced testing framework, documentation, and code quality tools

## Previous Versions

### 4.1.0 & 4.0.0 - Consolidated into 5.0.0

- All features and improvements from versions 4.0.0 and 4.1.0 have been consolidated into the comprehensive 5.0.0 release above

## 3.3.1

- Testing

## 3.2.7

- Testing

## 3.2.4

- Testing

## 3.2.3

- Testing

## 3.2.2

- Testing

## 3.2.1

- Testing

## 3.2.0

- Update base image to balenalib/{arch}-alpine:3.18-run
- Use node 18

## 3.1.14

- Dependency Updates

## 3.1.13

- Dependency Updates
- Moved image install location to GHCR

## 3.1.12

- Dependency Updates
- Homogenized log output to be more uniform across all log output messages
- Fine tuned colorization in log output
- Cleaned up some additional log output
- Fixed some additional typos in log output
- Added aarch64 support

## 3.1.11

- Added colorization to log output
- Cleaned up some log output

## 3.1.10

- Fixed a couple of typos in log output
- Changed publishing logic

## 3.1.9

- Updated dependencies

## 3.1.8

- Updated dependencies

## 3.1.7

- Updated dependencies

## 3.1.6

- Updated dependencies

## 3.1.5

- Updated dependencies

## 3.1.4

- Updated dependencies and Changed slug name to use "\_" instead of "-" due to breaking change in HA Core 2023.9

## 3.1.3

- Updated dependencies

## 3.1.2

- Updated dependencies

## 3.1.1

- Initial Commit
