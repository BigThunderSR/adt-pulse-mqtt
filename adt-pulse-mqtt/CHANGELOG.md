# Changelog

## 4.0.0 - Major Release (2025-08-18)

### 🚀 Breaking Changes

- **HTTP Client Migration**: Replaced deprecated `request` library with modern `axios`
- **Dependency Updates**: Major version updates to core dependencies
- **Architecture Support**: Removed `armhf` architecture, focusing on `aarch64` and `amd64`
- **Removed Dependencies**: Eliminated `request` and `coveralls` packages

### ✨ New Features

- **Enhanced Security**: Added `.env` file support for secure credential management
- **Configuration Templates**: Added `local-config.json.example` and `.env.example` files
- **Comprehensive Documentation**: Added `LOCAL_TESTING.md` and `AXIOS_MIGRATION.md` guides

### 🛡️ Critical Bug Fixes

- **Application Stability**: Fixed all unhandled promise rejections that caused crashes
- **Error Handling**: Added comprehensive `.catch()` handlers for all async operations
- **Network Resilience**: Improved handling of network timeouts and connectivity issues
- **Graceful Degradation**: Application continues running during network instability

### 📈 Improvements

- **Test Coverage**: Increased from 67% to 82.06% (+15% improvement)
- **Performance**: Tests now run in ~360ms (previously 20+ seconds)
- **Dependencies**: Updated to latest secure versions (axios 1.11.0, tough-cookie 6.0.0)
- **Build Infrastructure**: Updated to Alpine Linux 3.20 for modern container builds

### 🔧 Technical Details

- **Node.js**: Requires Node.js >= 20 (updated from >= 18)
- **HTTP Client**: Complete migration from `request` to `axios` with cookie support
- **Error Handling**: Bulletproof promise chains prevent application crashes
- **Security Audit**: Zero vulnerabilities with updated dependency tree

### 🔄 Backwards Compatibility

- ✅ **Configuration**: Still supports `local-config.json` alongside new `.env`
- ✅ **MQTT Topics**: All existing integrations continue to work
- ✅ **Docker**: Same Docker interface and environment variables
- ✅ **External API**: No breaking changes for end users

### 📋 Migration Guide

- **Optional**: Migrate to `.env` file for better security
- **Recommended**: Review `LOCAL_TESTING.md` for new development features
- **Automatic**: Dependencies updated during container rebuild

### 🎯 Impact

- **Reliability**: Eliminates application crashes from network timeouts
- **Security**: Modern dependencies with active security support
- **Maintainability**: Cleaner codebase with comprehensive error handling
- **Development**: Enhanced testing framework and documentation

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
