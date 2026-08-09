const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cupid', {
  version: process.versions.electron,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  resize: (data) => ipcRenderer.send('window-resize', data),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  setTheme: (theme) => ipcRenderer.send('set-theme', theme),
  getStreamUrl: (title, artist) => ipcRenderer.invoke('get-stream-url', title, artist),
  getAppleMusicToken: () => ipcRenderer.invoke('get-apple-music-token'),
  youtubeLogin: () => ipcRenderer.invoke('youtube-login'),
  getYoutubePlaylists: () => ipcRenderer.invoke('youtube-get-playlists'),
  getYoutubePlaylistTracks: (id) => ipcRenderer.invoke('youtube-get-playlist-tracks', id),
  youtubeLogout: () => ipcRenderer.invoke('youtube-logout'),
  openLocalFolder: () => ipcRenderer.send('open-local-folder'),
  getLocalTracks: () => ipcRenderer.invoke('get-local-tracks'),
});
