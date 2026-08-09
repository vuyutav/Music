const { BrowserWindow, session } = require('electron');

let yt = null; // We will store the active YouTube client here

// ── Helper to dynamically load the ESM package ──
async function getInnertube() {
  // This bypasses the require() error!
  const { Innertube } = await import('youtubei.js');
  return Innertube;
}

async function launchYoutubeLoginWindow() {
  return new Promise((resolve, reject) => {
    const authWindow = new BrowserWindow({
      width: 800,
      height: 700,
      title: "Log in to YouTube Music",
      show: true, 
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    authWindow.webContents.setUserAgent(userAgent);
    authWindow.loadURL('https://music.youtube.com');

    // Monitor for successful login
    authWindow.webContents.on('did-finish-load', async () => {
      try {
        const cookies = await session.defaultSession.cookies.get({ domain: '.youtube.com' });
        const isLoggedIn = cookies.some(cookie => cookie.name === 'SAPISID');

        if (isLoggedIn) {
          const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
          
          console.log("Backend: Login detected! Initializing YouTube client...");
          
          // Dynamically load Innertube and initialize it with cookies
          const Innertube = await getInnertube();
          yt = await Innertube.create({ cookie: cookieString });
          
          authWindow.close();
          resolve(cookieString); 
        }
      } catch (error) {
        console.error('Cookie extraction error:', error);
      }
    });

    authWindow.on('closed', () => resolve(null));
  });
}

// ── Fetch the user's playlists (Clean & Filtered) ──
async function getYoutubePlaylists() {
  try {
    console.log("Backend: Attempting to fetch YouTube playlists...");
    if (!yt) throw new Error("YouTube client not initialized.");

    const library = await yt.music.getLibrary();
    let rawPlaylists = [];

    if (library.playlists && library.playlists.length > 0) {
      rawPlaylists = library.playlists;
    } else if (library.contents) {
      library.contents.forEach(section => {
        const items = section.contents || section.items || [];
        rawPlaylists.push(...items);
      });
    }

    // The Bouncer: Format and strictly filter the list
    const formattedPlaylists = rawPlaylists
      .map(p => {
        const id = p.playlist_id || (p.endpoint && p.endpoint.payload && p.endpoint.payload.playlistId) || p.id;
        const title = p.title?.text || p.title || "Unknown Playlist";
        return { playlistId: id, title: title, subtitle: p.subtitle?.text || p.subtitle || "" };
      })
      .filter(p => {
        if (!p.playlistId) return false; // Must have an ID
        if (p.playlistId === 'WL') return false; // Exclude Watch Later
        if (typeof p.playlistId === 'string' && p.playlistId.startsWith('UC')) return false; // Exclude Artists
        if (typeof p.subtitle === 'string' && p.subtitle.toLowerCase().includes('artist')) return false;

        return true; 
      })
      .map(p => ({ playlistId: p.playlistId, title: p.title })); // Format for React

    console.log(`Backend: Loaded ${formattedPlaylists.length} playlists.`);
    return formattedPlaylists;
  } catch (error) {
    console.error("Backend Error fetching YT playlists:", error);
    return [];
  }
}

// ── Fetch tracks inside a specific playlist ──
async function getYoutubePlaylistTracks(playlistId) {
  try {
    console.log(`Backend: Fetching tracks for playlist ${playlistId}...`);
    if (!yt) throw new Error("YouTube client not initialized.");

    const playlist = await yt.music.getPlaylist(playlistId);
    
    const formattedTracks = playlist.items.map(track => ({
      id: track.id,
      title: track.title,
      artist: track.authors ? track.authors.map(a => a.name).join(', ') : 'Unknown Artist',
      art: track.thumbnails && track.thumbnails.length > 0 
        ? track.thumbnails[track.thumbnails.length - 1].url 
        : null
    }));
    
    console.log(`Backend: Found ${formattedTracks.length} tracks.`);
    return formattedTracks;
  } catch (error) {
    console.error("Backend Error fetching tracks:", error);
    return [];
  }
}

async function logoutYoutube() {
  yt = null;
  const cookies = await session.defaultSession.cookies.get({ domain: '.youtube.com' });
  await Promise.all(
    cookies.map((cookie) =>
      session.defaultSession.cookies.remove(`https://${cookie.domain.replace(/^\./, '')}`, cookie.name)
    )
  );
}

module.exports = {
  launchYoutubeLoginWindow,
  getYoutubePlaylists,
  getYoutubePlaylistTracks,
  logoutYoutube,
};