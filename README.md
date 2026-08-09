# Music Player

A pixel-art desktop music player for Windows, macOS, and Linux. No coding required — install the app, add your music, and press play.

## What you can do

- Play local audio files from your **Music Tracks** folder
- Browse and play **YouTube Music** playlists (log in from Settings)
- Switch between pink and blue themes
- Adjust volume with the dropdown slider next to the playback controls
- Drag, resize, minimize, and close the frameless window

## Install (recommended)

### Windows

1. Download **`Music Player Setup.exe`** from the release/build output (`out/` folder)
2. Run the installer and follow the prompts
3. Launch **Music Player** from the Start menu or desktop shortcut

**Portable option:** run **`Music Player.exe`** directly from `out/win-unpacked/` — no installer needed.

> If Windows SmartScreen warns about an unsigned app, click **More info → Run anyway**. The app is not code-signed yet.

### macOS

Copy **`Music Player.app`** from `out/mac-arm64/` into **Applications**, then open it (right-click → Open on first launch if needed).

### Linux

Run the AppImage from `out/`.

## Using local music

1. Open the player and click the **settings** icon (gear)
2. Choose **Local** under music
3. Click **open folder** — this opens your **Music Tracks** folder:
   - Windows: `%USERPROFILE%\Music\Music Tracks`
   - macOS: `~/Music/Music Tracks`
   - Linux: `~/Music/Music Tracks`
4. Copy `.mp3`, `.wav`, `.ogg`, or `.m4a` files into that folder
5. Click **refresh** in settings to rescan your library

Song titles come from the file names.

## Using YouTube Music

1. Open **settings → Yt**
2. Click **log in** and sign in through the browser window
3. Pick a playlist from the list
4. Use the normal play/pause, next, and previous controls

Streaming uses YouTube audio in the background — an internet connection is required.

## Controls

| Control | Action |
|---------|--------|
| Play / Pause | Center button |
| Previous / Next | Side buttons |
| **vol** button | Opens vertical volume slider |
| Star on progress bar | Drag to seek |
| Settings gear | Theme, music source, playlists |
| Title bar area | Drag to move window |
| Corners | Resize window |

## Build from source (developers)

```bash
npm install
npm run dev          # development
npm run package      # build installer + portable exe (Windows)
npm run package:win  # Windows-only build
```

Output goes to the `out/` folder.

### Windows build note

If packaging fails at the NSIS step with a symbolic link error, enable **Developer Mode** in Windows Settings → System → For developers, then run `npm run package` again. The portable build in `out/win-unpacked/` works without the installer.

## Optional integrations

Spotify and Apple Music support exists in the codebase but is hidden in the UI until OAuth setup is complete. See `SPOTIFY_SETUP.md` and `APPLE_MUSIC_SETUP.md` if you are configuring a developer build.

## Tech stack

- Electron + React + Vite
- HTML5 Audio for playback
- yt-dlp for streaming audio lookup
"# Music-Player" 
