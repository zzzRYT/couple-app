# Mobile

The owner creates and manages the Expo account. This app uses EAS for development, preview, TestFlight, production builds, and OTA updates. Check the current EAS plan allowance before using build capacity.

## Release

- `development` is the dev client; `preview` is an ad hoc internal build; `testflight` is the store-signed iOS profile that uploads to the `preview` channel; `production` uses the `production` channel.
- App version is `1.0.0`; EAS remote versioning increments the build number. OTA compatibility uses the `fingerprint` runtime policy.
- Use **Actions → Release iOS** to build the `testflight` profile and optionally submit it. Use **Actions → OTA** to publish a preview update or republish a checked update group to production.
- Before the first release, complete the [owner-only steps in H01](../../specs/002-couple-dday-v0/handoffs/H01-release-pipeline.md#10-owner-only-steps).
