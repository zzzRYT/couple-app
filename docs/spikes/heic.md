# HEIC cover upload spike

The cover endpoints re-encode JPEG and PNG inputs on the server with ImageScript, which decodes pixel data and writes a new JPEG without carrying image metadata forward.

The owner selected server re-encoding first and requested a HEIC proof of concept before choosing the client fallback.

This worktree must not start Supabase or Edge Function runtimes, so the HEIC decode and re-encode could not be executed or proven here.

ImageScript documents JPEG, PNG, and TIFF decoding, but does not list HEIC support in its decoder contract ([ImageScript API](https://github.com/matmen/ImageScript/blob/master/ImageScript.d.ts)).

The app therefore uses the native picker crop and converts a picker result that still reports HEIC/HEIF to JPEG with `expo-image-manipulator` before upload; the Edge Function then re-encodes that JPEG again and strips metadata.

The picker and conversion path still needs iOS and Android device verification with actual HEIC assets before launch.

The server permits at most 20 MB and 20 million decoded pixels per image; the pixel limit bounds decode memory for compressed image bombs.

Signed download URLs last five minutes, and the server refuses to issue new ones after the space ends.

Storage cannot revoke an individual signed URL already issued, so a link created just before an end or removal can remain usable until its five-minute expiry.
