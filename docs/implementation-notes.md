# Implementation notes

- T002: Expo SDK 58 recommends Skia 2.14.0; 3.7.4 is not available in the package registry. The SDK-compatible version is used until the compatibility matrix is revisited.
- The machine's pnpm shim has no configured version; use `corepack pnpm`, pinned by `packageManager` in the root package.
- T012 mentions four schemas, but the contracts directory contains five and T009 requires byte identity for all `*.schema.json` files. The sync copies all five, including the later-phase generated-object contract.
- The original scene schema required a mascot in every scene, conflicting with FR-018c and T064's removal and recall flow. The contract now permits zero or one in existing scenes; initial scenes separately require exactly one. §11 gives no numeric initial placement, so a centered lower-room placeholder is used pending layout verification.
- T023 requires nonempty translations, but the design copy left three English date-wheel labels empty. The source now uses draft Year/Month/Day labels, subject to the planned native-language review (G4).
- T022 precedes the room-theme table (T067), yet needs the room timezone. The space holds the timezone from creation; room initialization and later room-mode changes must keep it synchronized. Quota RPCs are restricted to the service role so clients cannot finalize failures themselves or increase the limit.
- T028/T029: the source CSV has inconsistent trailing columns on some placeholder rows, so the importer tolerates extra columns while selecting IDs and variants. There are 24 catalog entries and 25 image files because the lamp has a night variant.
- T027 conflicts with handoff's removal of Inter; the task explicitly asks for Inter, so it is retained. The nine static Google Fonts files total about 40 MB uncompressed, larger than the design estimate; EAS artifact measurement and font selection remain G6.
- T034 references a loader `WINDOW_SVG` in `design/boards S03`, but that file or symbol is absent in this checkout. A small loader-only window sketch using the design palette is supplied and kept out of the catalog.
