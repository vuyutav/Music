export default function YoutubeSettings({
  isLoggedIn,
  isLoading,
  playlists,
  loginAndFetch,
  loadingPlaylist,
  loadPlaylist,
  onLogout,
}) {
  if (!isLoggedIn) {
    return (
      <button
        className="settings-theme-btn"
        onClick={loginAndFetch}
        disabled={isLoading}
      >
        {isLoading ? 'connecting...' : 'log in'}
      </button>
    );
  }

  return (
    <>
      <div className="settings-playlist-list">
        {playlists.length === 0 ? (
          <div className="settings-label">No playlists found on this account.</div>
        ) : (
          playlists.map((p) => (
            <button
              key={p.playlistId}
              className={`settings-playlist-item ${loadingPlaylist ? 'disabled' : ''}`}
              onClick={() => loadPlaylist(p.playlistId, 'youtube')}
              disabled={loadingPlaylist}
            >
              {p.title}
            </button>
          ))
        )}
      </div>
      <div className="settings-theme-row">
        <button className="settings-theme-btn" onClick={onLogout}>
          logout
        </button>
      </div>
    </>
  );
}
