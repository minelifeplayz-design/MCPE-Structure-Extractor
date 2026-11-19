# MCPE Structure Extractor

An offline-first Android app for extracting **previously saved Minecraft Bedrock structure templates** from `.mcworld` archives.

## Current scope

This app reads a Bedrock LevelDB database and extracts records whose keys begin with `structuretemplate_`. It recovers structures previously saved using a Structure Block or `/structure save`. It does not scan ordinary terrain or detect arbitrary buildings.

## Android app

- Kotlin Android host with a local WebView interface.
- Android Storage Access Framework file picker and save dialog.
- Bundled JavaScript LevelDB reader; extraction works offline after installation.
- Finds structures across namespaces, including `mystructure:`.
- Exports one selected structure as `.mcstructure` or multiple selected structures as a ZIP.
- ZIP exports include an `extraction_manifest.json` with original identifiers.
- No internet permission, accounts, telemetry, or world uploads.

## Build

Requirements: JDK 17, Android SDK (compile SDK 35), Node.js 20+ and npm, Gradle 8.9.

```bash
npm install
npm test
npm run build:engine
gradle :app:assembleDebug
```

Debug APK: `app/build/outputs/apk/debug/app-debug.apk`.

GitHub Actions runs the JavaScript tests, bundles the offline reader, builds the APK, and uploads the APK as a workflow artifact.

## Technical implementation

- The app bundles `mcbe-leveldb-reader` 5.0.1, which uses a browser-compatible implementation based on Mojang's Minecraft Creator Tools LevelDB reader.
- The engine calls `extractStructureFilesFromMcworld(file, false)` to keep namespaced identifiers.
- Original structure payloads are copied to export without parsing and rewriting NBT.
- ZIP paths are sanitized and duplicate output paths receive a suffix.
- Android's native bridge writes exports in chunks and asks the user where to save them through the Storage Access Framework.

## Limitations and validation status

- Only saved structure templates are supported. Normal buildings in chunks are outside this app's scope.
- The app does not currently preview structures or rewrite/convert NBT.
- Large world archives can require substantial memory because the upstream reader materializes LevelDB files while parsing. Test with representative world sizes on the target phone.
- The repository's initial implementation is not yet verified against a real user-supplied Bedrock world. Do not treat a successful scan as proof that every exported file loads in Minecraft until that compatibility test is completed.

## Third-party code

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for bundled dependency licenses and attribution.
