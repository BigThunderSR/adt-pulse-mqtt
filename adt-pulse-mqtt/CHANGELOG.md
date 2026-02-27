# Changelog

## 5.1.2 - Migrate from balenalib to Official Alpine Base Images (2026-02-27)

### ⬆️ Infrastructure

- **Base Image**: Replaced unmaintained balenalib base images with official Alpine images
  - `balenalib/amd64-alpine:3.21-run` → `alpine:3.21`
  - `balenalib/aarch64-alpine:3.21-run` → `alpine:3.21`
  - `balenalib/armv7hf-alpine:3.21-run` → `alpine:3.21`
- **Cross-Build**: Removed legacy balena `cross-build-start`/`cross-build-end` QEMU shims and `QEMU_EXECVE` env var from arm Dockerfiles (use `docker buildx` instead)
- **No Functional Changes**: Alpine 3.21 provides the same Node.js 22 LTS packages; runtime behavior is unchanged

---

## 5.1.1 - SmartThings Topic Lifecycle Fix (2026-02-26)

### 🐛 Bug Fixes

- **Config Topics**: Config topics are now published on every zone update
  (not just first device discovery), ensuring reconnecting subscribers
  rediscover devices
- **Config Retain**: Config topics now use `retain: true` so the MQTT
  broker stores them for future subscribers, matching the non-SmartThings
  `alarm_state_topic` behavior
- **Alarm Config Retain**: SmartThings alarm config topic now uses
  `retain: true`, consistent with the non-SmartThings alarm state topic
- **Shutdown Cleanup**: Graceful shutdown now publishes empty retained
  messages to all SmartThings config topics (alarm config + per-device
  configs) before disconnecting, preventing stale devices

---

## 5.1.0 - Alpine & Node.js Upgrade (2026-02-26)

### ⬆️ Infrastructure

- **Base Image**: Upgraded balenalib base images from Alpine 3.20 to Alpine 3.21
- **Node.js**: Upgraded from Node.js 20.15.1 to Node.js 22.15.1 (LTS)
- **Engine Requirement**: Updated minimum Node.js version to >= 22

---

## 5.0.2 - Stale Session Retry Fix (2026-02-15)

### 🐛 Bug Fixes

- **Stale Session Recovery**: `setAlarmState` now automatically re-authenticates and retries once when ADT Pulse returns an expired session error page ("Unable to Proceed" / "do not have access")
  - Detects stale session by checking for known ADT error page strings
  - Invalidates current session and clears SAT token
  - Re-authenticates via `login()` and fetches fresh SAT token via `getZoneStatusOrb()`
  - Retries the alarm state change once (`isRetry` flag prevents infinite loops)
  - Previously, the command would silently fail and require manual resend

### 🔧 Technical Improvements

- **Stale session check runs before the `isForced` gate** — covers both normal and force-arm scenarios
- **Explicit error on persistent failure** — if re-auth retry still fails, rejects with a descriptive error message instead of a generic one

---

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

---

## 5.0.0 - Complete Modernization Release (2025-08-19)

### 🚀 Major Breaking Changes

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

- **Test Coverage**: Expanded test suite from 76 to 100 comprehensive test cases (+24 new tests)
- **Server Logic Testing**: Added 8 isolated server logic tests covering configuration, MQTT processing, and device tracking
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

All features and improvements from versions 4.0.0 and 4.1.0 have been consolidated into the comprehensive 5.0.0 release above.

## 3.4.0

- Dependency updates
- Update minimum supported Node.js version to 20.x in package.json
- Deprecate armhf builds

## 3.3.5

- Dependency updates

## 3.3.4

- Bug Fix: /smartthings/security/.../config by @robross0606 in #210

## 3.3.3

- Resolve #202 Changing method of parsing data via cheerio by @robross0606 in #203
- #201 Preliminary re-integration with SmartThings via MQTT Discovery edge driver by @robross0606 in #209
- Dependency updates

## 3.3.2

- Dependency updates

## 3.3.1

- Dependency updates

## 3.3.0

- NOTE - Only NodeJS 18 and above are supported starting with this version
- Change tests to use assert instead of chai by @BigThunderSR in #150
- Dependency updates

## 3.2.7

- Dependency updates
- Replace 'q' module promises with native JS promises

## 3.2.6

- Dependency updates

## 3.2.5

- Dependency updates

## 3.2.4

- Dependency updates

## 3.2.3

- Dependency updates

## 3.2.2

- Dependency updates

## 3.2.1

- Dependency updates
- Housekeeping on Dockerfiles - Did some cleanup and set app to actually use WORKDIR instead of root.

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
