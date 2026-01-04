# Release Process

This document describes how to create releases for the Greenroom Launchpad application.

## Overview

The project uses a tag-based release system with semantic versioning. When you create a version tag, it automatically triggers the build and release process.

## Creating a Release

### 1. Prepare for Release

1. Ensure all changes are merged to the `main` branch
2. Verify that the latest CI build is passing
3. Update any version-specific documentation if needed

### 2. Create a Release Tag

Create and push a semantic version tag in the format `v{MAJOR}.{MINOR}.{PATCH}`:

```bash
# Example: creating version 1.2.3
git tag v1.2.3
git push origin v1.2.3
```

### 3. Monitor the Release Process

After pushing the tag:

1. The **Release workflow** will automatically trigger
2. The workflow will:
   - Validate the tag format
   - Build the application for all platforms (Windows, macOS, Linux)
   - Run tests on all platforms
   - Create release artifacts
   - Generate release notes from commit history
   - Create a **draft** GitHub release

### 4. Publish the Release

1. Go to the [Releases page](../../releases)
2. Find the draft release that was created
3. Review the release notes and artifacts
4. Edit the release notes if needed
5. Click **"Publish release"** to make it public

## Manual Release Trigger

You can also trigger a release manually from the GitHub Actions tab:

1. Go to [Actions](../../actions)
2. Select the "Release" workflow
3. Click "Run workflow"
4. Enter the tag name (e.g., `v1.2.3`)
5. Click "Run workflow"

## Release Artifacts

Each release includes the following artifacts:

- **Windows**: `greenroom-launchpad-{version}-win-x64.exe`
- **macOS (Apple Silicon)**: `greenroom-launchpad-{version}-mac-arm64.dmg`
- **macOS (Intel)**: `greenroom-launchpad-{version}-mac-x64.dmg`
- **Linux**: `greenroom-launchpad-{version}-linux-x64.deb`
- **Auto-update files**: `latest*.yml` (for electron-updater)

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

Examples:
- `v1.0.0` - Initial release
- `v1.1.0` - New feature added
- `v1.1.1` - Bug fix
- `v2.0.0` - Breaking change

## CI/CD Workflows

### Main CI (`.github/workflows/main.yml`)
- Runs on every push to `main` and pull requests
- Builds and tests the application
- Used for development validation

### Entry CI (`.github/workflows/ci.yml`)
- Reusable workflow called by other workflows
- Handles the core build and test logic
- Accepts `distribution-channel` parameter

### Release (`.github/workflows/release.yml`)
- Triggered by version tags (`v*.*.*`)
- Builds release artifacts for all platforms
- Creates GitHub releases with auto-generated notes

## Auto-Updates

The application includes auto-update functionality:

- Release builds include update metadata files
- Users will be automatically notified of new versions
- Updates are delivered through GitHub Releases

## Troubleshooting

### Tag Format Issues
- Ensure tags follow the exact format: `v{MAJOR}.{MINOR}.{PATCH}`
- Valid: `v1.0.0`, `v2.1.3`, `v0.1.0`
- Invalid: `1.0.0`, `v1.0`, `v1.0.0-beta`

### Release Workflow Failures
1. Check the [Actions tab](../../actions) for error details
2. Common issues:
   - Build failures (check compilation errors)
   - Test failures (fix tests before releasing)
   - Permission issues (check repository settings)

### Manual Cleanup
If a release fails and you need to retry:
1. Delete the failed tag: `git tag -d v1.0.0 && git push origin :refs/tags/v1.0.0`
2. Delete the draft release from GitHub
3. Fix any issues and recreate the tag

## Development vs Release Channels

- **Development**: Uses `'dev'` distribution channel for testing
- **Release**: Uses `'release'` distribution channel for production
- Channels can affect update behavior and application behavior