# Build status

The first implementation is committed. CI runs the JavaScript unit tests, bundles the Bedrock reader into the Android assets, and compiles a debug APK.

When a commit message contains `[publish-apk]`, the workflow attaches that APK to a prerelease in this private repository. The release is private because the repository is private.

A successful compile is not the same as a successful Minecraft compatibility test. Before treating a build as verified, follow [REAL_WORLD_TEST.md](REAL_WORLD_TEST.md) with a real world containing a saved Structure Block template.
