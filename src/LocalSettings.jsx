export default function LocalSettings({ onRefresh, onOpenFolder }) {
  return (
    <div className="settings-playlist-list">
      <div className="settings-label local-help">
        Put MP3, WAV, OGG, or M4A files in your Music Tracks folder, then refresh.
      </div>
      <div className="settings-theme-row">
        <button
          className="settings-theme-btn"
          onClick={onOpenFolder}
        >
          open folder
        </button>
        <button
          className="settings-theme-btn"
          onClick={onRefresh}
        >
          refresh
        </button>
      </div>
    </div>
  );
}
