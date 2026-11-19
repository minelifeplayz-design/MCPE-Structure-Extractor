# Build status

The first implementation is committed. CI runs the JavaScript unit tests, bundles the Bedrock reader into the Android assets, and compiles a debug APK.

When a commit message contains `[publish-apk]`, the workflow attaches that APK to a prerelease in this private repository. The release is private because the repository is private.

A successful compile is not the same as a successful Minecraft compatibility test. Before treating a build as verified, follow [REAL_WORLD_TEST.md](REAL_WORLD_TEST.md) with a real world containing a saved Structure Block template.


## Corrected Android build

Version 0.1.1 includes the Kotlin Android plugin so `MainActivity` is compiled into the APK. GitHub Actions run 17 completed successfully, including APK output verification. This confirms compilation and packaging only; launch on a physical Android device and extraction from a real `.mcworld` still require user testing.
