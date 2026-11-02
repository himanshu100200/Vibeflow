# VibeFlow — YouTube-powered music discovery website

A Spotify-inspired music discovery and playback interface. Search results are fetched automatically from YouTube using the official YouTube Data API v3. Playback uses the official YouTube IFrame Player.

## Features
- Search YouTube music videos by song, artist, album or mood
- Official YouTube embedded playback
- Play / pause / next / previous
- Liked Songs
- Create playlists and add tracks
- Recently played history (stored locally)
- Mood shortcuts
- Responsive desktop and mobile UI
- API key settings stored in the browser's local storage

## Important: YouTube API key required for automatic search
The project does not include an API key. You must create your own key:
1. Open https://console.cloud.google.com/
2. Create or select a Google Cloud project.
3. Enable **YouTube Data API v3**.
4. Create an API key under APIs & Services → Credentials.
5. Restrict the key to YouTube Data API v3 and your website's HTTP referrers.
6. Open VibeFlow → Settings & API key → paste key → Save key.

Google may require billing/account verification depending on current account and region. YouTube Data API has quota limits. Do not commit your API key to GitHub or share it publicly.

## Run locally
You can open `index.html` directly, or run a local static server from this folder:
```powershell
py -m http.server 5500
```
Then open http://localhost:5500

## Deploy to GitHub Pages
Upload `index.html`, `style.css`, `app.js`, and the `assets` folder to the repository root. In GitHub → Settings → Pages, deploy from `main` and `/ (root)`. Once live, add the API key in the site's Settings.

## Honest limitations
- This is a YouTube search/player interface, not a licensed Spotify replacement.
- YouTube results are videos, not guaranteed official audio-only tracks.
- Playback is subject to YouTube availability, embedding restrictions, ads, regional restrictions, and YouTube's terms.
- Playlists, likes, and history are stored only in the current browser/device. They are not synced across devices and can be lost if browser storage is cleared.
- YouTube Data API search requires your own API key. Without it, search will not return live results.
- The app does not download, extract, or host YouTube audio.
