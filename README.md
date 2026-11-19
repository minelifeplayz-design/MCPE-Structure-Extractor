# MCPE Structure Extractor

An offline-first Android application for extracting **previously saved Minecraft Bedrock structure templates** from `.mcworld` archives.

## Scope

This project extracts existing LevelDB records whose keys begin with `structuretemplate_`. It does not detect buildings in ordinary terrain or decode chunk regions.

## Planned workflow

1. Select a `.mcworld` archive with Android's Storage Access Framework.
2. Inspect the ZIP archive and locate the Bedrock `db/` directory.
3. Read the Bedrock LevelDB database using a reader compatible with Mojang's LevelDB variant.
4. Enumerate `structuretemplate_` records across namespaces.
5. Preserve each record's original value bytes and export `.mcstructure` files.
6. Validate output and optionally package all structures into a ZIP.

## Technical direction

- Kotlin + Jetpack Compose Android shell.
- Android Storage Access Framework for file access.
- A browser-compatible Bedrock LevelDB reader is being evaluated for a bundled, local WebView engine. This avoids assuming that an ordinary desktop LevelDB JNI binary can read Bedrock databases on Android.
- No world data is uploaded to a server.

## Important compatibility notes

Bedrock uses a modified LevelDB implementation with zlib support. The reader must open the **database directory**, not an individual `.ldb` file. `.mcstructure` payloads must be copied byte-for-byte; parsing is for validation and metadata only, not for rewriting the structure.

## Status

Initial Android project scaffold. Extraction is not yet advertised as working until the bundled reader is integrated and tested against real Bedrock worlds containing saved structures.
