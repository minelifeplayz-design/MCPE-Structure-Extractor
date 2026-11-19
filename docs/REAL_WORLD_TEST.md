# Real-world extraction test

This is the required compatibility test before calling an APK release verified.

## Create a known saved template in Bedrock

1. Create a small test world in Minecraft Bedrock.
2. Build a small, distinctive test structure.
3. Place a Structure Block and switch it to Save mode.
4. Give it a simple name such as `testhouse`.
5. Set the structure bounds so the whole build is included, then save it.
6. Exit the world and export it as a `.mcworld` backup.

A normal building that was not saved through a Structure Block or `/structure save` is not a valid test fixture.

## Test the app

1. Install the debug APK from the GitHub Actions artifact.
2. Open MCPE Structure Extractor and select the exported `.mcworld`.
3. Confirm that the database scan finds the saved template. A typical default-namespace key is `mystructure:testhouse`, stored under the LevelDB key prefix `structuretemplate_`.
4. Export the structure as a single `.mcstructure`.
5. Open the same world or a separate test world in Bedrock and load the exported structure with a Structure Block or `/structure load`.

## Acceptance criteria

- The scanner finds the known saved template.
- The exported file is non-empty.
- The exported bytes match the source LevelDB value exactly.
- The exported structure loads in Bedrock with the expected blocks and block entities.
- A world without saved templates produces a clear empty result, not a crash.
- A world with multiple namespaces exports all selected structures without filename collisions.

Record the Minecraft version, Android version, source archive size, number of found structures, and whether the exported structure loaded successfully.

## Known testing gap

CI can verify JavaScript helper tests, bundle the offline reader, and compile the APK. CI does not currently have a real Bedrock world fixture, so it cannot prove Minecraft compatibility by itself.
