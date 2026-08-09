# Spotify Integration Setup

This guide walks you through connecting Music Player to your Spotify account. Audio is streamed via YouTube (using yt-dlp), so **Spotify Premium is not required** — your Spotify account is only used to browse playlists and fetch track metadata.

## 1. Create a Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in the app details (name, description — anything is fine)
4. Under **Which API/SDKs are you planning to use?**, select:
   - **Web API**
5. Click **Create**

## 2. Configure the Redirect URI

1. In your app's dashboard, go to **Settings**
2. Under **Redirect URIs**, add:
   ```
   http://127.0.0.1:5173/callback
   ```
3. Click **Save**

### Important notes

- Use `127.0.0.1`, not `localhost`. Spotify treats them differently.
- Use `http`, not `https`.
- Do **not** add a trailing slash.

## 3. Add Your Client ID

1. Copy your **Client ID** from the app's dashboard
2. Create a `.env` file in the project root (use `.env.example` as a template):
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id_here
   ```

## 4. Add Yourself as a User (Development Mode)

Spotify apps start in **Development Mode**, which restricts API access to explicitly added users.

1. In your app's dashboard, go to **Settings** > **User Management**
2. Add the email address associated with your Spotify account
3. Save

## 5. Run the App

```bash
npm install
npm run dev
```

1. Click the settings icon in the player
2. Click **log in** under Spotify
3. Authorize the app when prompted
4. Your playlists will appear — click any playlist to load and play it

## How It Works

Music Player uses the Spotify Web API to fetch your playlists and track metadata (title, artist, album art). Audio is then streamed from YouTube using yt-dlp, which searches for matching tracks automatically.

## Troubleshooting

### `redirect_uri: Not matching configuration`

Make sure your Spotify Dashboard has exactly:
```
http://127.0.0.1:5173/callback
```

### `403 Forbidden` on playlist fetch

1. **Add yourself in User Management.** Go to your app's Settings > User Management and add your Spotify email.
2. **Stale token.** Open DevTools, run `localStorage.clear()`, reload, and log in again.

### `Not authenticated with Spotify`

Log out via the settings panel, then log in again.

### Audio doesn't play

Make sure `yt-dlp` is installed on your system or included via `yt-dlp-exec` in the project dependencies.
