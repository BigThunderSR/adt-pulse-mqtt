# Changelog

## 4.1.0 - Modernization & Optimization Release

### 🔧 Infrastructure Improvements

- **Testing Framework**: Migrated from `nyc` to modern `c8` coverage tool
- **Coverage Engine**: Now uses Node.js built-in V8 coverage for faster generation without runtime instrumentation overhead
- **Dependency Cleanup**: Removed unnecessary transitive dependencies and resolved deprecation warnings
- **ESLint Integration**: Added modern native ESLint parsing for consistent code quality across all versions
- **Code Quality**: Fixed all ESLint errors including unused variables and unsafe prototype access patterns

## 4.0.0 - Major Release (2025-08-18)

### 🚀 Breaking Changes

- **HTTP Client Migration**: Replaced deprecated `request` library with modern `axios`
- **Dependency Updates**: Major version updates to core dependencies
- **Architecture Support**: Removed `armhf` architecture, focusing on `aarch64` and `amd64`
- **Removed Dependencies**: Eliminated `request` and `coveralls` packages

### ✨ New Features

- **Enhanced Local Testing Capability**: Added `.env` file support for simpler local testing capabilities
- **Configuration Templates**: Added `local-config.json.example` and `.env.example` files
- **Updated Documentation**: Added `LOCAL_TESTING.md` and `AXIOS_MIGRATION.md` guides

### 🛡️ Critical Bug Fixes

- **Application Stability**: Fixed all unhandled promise rejections that caused crashes
- **Error Handling**: Added comprehensive `.catch()` handlers for all async operations
- **Network Resilience**: Improved handling of network timeouts and connectivity issues
- **Graceful Degradation**: Application continues running during network instability

### 📈 Improvements

- **Test Coverage**: Increased from 67% to 82.06% (+15% improvement)
- **Dependencies**: Updated to latest secure versions (axios 1.11.0, tough-cookie 6.0.0)

### 🔧 Technical Details

- **Node.js**: Requires Node.js >= 20
- **HTTP Client**: Complete migration from `request` to `axios` with cookie support
- **Error Handling**: Improved promise chains prevent application crashes
- **Security Audit**: Zero known vulnerabilities at the time of release with updated dependency tree

### 🔄 Backwards Compatibility

- ✅ **Configuration**: Still supports `local-config.json` alongside new `.env`
- ✅ **MQTT Topics**: All existing integrations continue to work
- ✅ **Docker**: Same Docker interface and environment variables
- ✅ **External API**: No breaking changes for end users

### 📋 Migration Guide

- **Optional**: Migrate to `.env` file for simplified local testing
- **Recommended**: Review `LOCAL_TESTING.md` for new development features

### 🎯 Impact

- **Reliability**: Minimizes application crashes from network timeouts
- **Security**: Modern dependencies with active security support
- **Maintainability**: Cleaner codebase with comprehensive error handling
- **Development**: Enhanced testing framework and documentation

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
