export default function AppleSettings({
  connected, 
  playlists, 
  loadingPlaylist, 
  loadPlaylist,
  source, 
  handleSwitchToLocal,
  onLogin, 
  onLogout
}) {
  if (!connected) {
    return (
      <button className="settings-theme-btn" onClick={onLogin}>
        log in
      </button>
    );
  }

  return (
    <>
      <div className="settings-playlist-list">
        {playlists.map((p) => (
          <button
            key={p.id}
            className={`settings-playlist-item ${loadingPlaylist ? 'disabled' : ''}`}
            onClick={() => loadPlaylist(p.id, 'apple')}
            disabled={loadingPlaylist}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="settings-theme-row">
        {source === 'streaming' && (
          <button className="settings-theme-btn" onClick={handleSwitchToLocal}>
            local
          </button>
        )}
        <button className="settings-theme-btn" onClick={onLogout}>
          logout
        </button>
      </div>
    </>
  );
}