// Big thanks to cupidbity on Github for the original Electron boilerplate and Spotify integration code that I heavily modified and built upon:
import { useCallback, useRef, useEffect, useState } from 'react';
import './App.css';
import useAudioPlayer from './useAudioPlayer';
import useSpotifyPlayer from './useSpotifyPlayer';
import useTheme from './useTheme';
import useVolume from './useVolume';
import VolumeControl from './VolumeControl';
import { login as spotifyLogin, handleCallback, isLoggedIn as isSpotifyLoggedIn, logout as spotifyLogout } from './spotify/auth.js';
import { fetchPlaylistTracks as fetchSpotifyTracks, fetchMyPlaylists as fetchSpotifyPlaylists } from './spotify/api.js';
import { login as appleLogin, logout as appleLogout, isLoggedIn as isAppleLoggedIn, initMusicKit } from './apple/auth.js';
import { fetchMyPlaylists as fetchApplePlaylists, fetchPlaylistTracks as fetchAppleTracks } from './apple/api.js';
import { useYoutubePlayer } from './useYoutubePlayer.js';

import LocalSettings from './LocalSettings';
import YoutubeSettings from './YoutubeSettings';
import SpotifySettings from './SpotifySettings';
import AppleSettings from './AppleSettings';

import progressBarStars from '../assets/progress_bar_stars.png';
import star from '../assets/star.png';
import starSelected from '../assets/star_selected.png';
import defaultAlbumIcon from '../assets/music_album.png';

function useResize(corner) {
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    let lastX = e.screenX;
    let lastY = e.screenY;

    const onMouseMove = (e) => {
      const dx = e.screenX - lastX;
      const dy = e.screenY - lastY;
      lastX = e.screenX;
      lastY = e.screenY;
      window.cupid?.resize({ dx, dy, corner });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [corner]);

  return onMouseDown;
}

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function MarqueeText({ className, text }) {
  const outerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const outer = outerRef.current;
    const textEl = textRef.current;
    if (!outer || !textEl) return;
    setShouldScroll(textEl.offsetWidth > outer.clientWidth);
  }, [text]);

  return (
    <div className={`${className} marquee-container`} ref={outerRef}>
      {/* Hidden span to measure true text width */}
      <span ref={textRef} className="marquee-measure">{text}</span>
      <span className={shouldScroll ? 'marquee-scroll' : ''}>
        {text}
        {shouldScroll && <span className="marquee-gap">{text}</span>}
      </span>
    </div>
  );
}

export default function App() {
  // ── Source state ─────────────────────────────────────────
  const [source, setSource] = useState('local'); // 'local' | 'streaming'
  const [spotifyConnected, setSpotifyConnected] = useState(isSpotifyLoggedIn());
  const [appleConnected, setAppleConnected] = useState(isAppleLoggedIn());
  const [streamTracks, setStreamTracks] = useState([]);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [applePlaylists, setApplePlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [musicService, setMusicService] = useState('local');
  const [shuffle, setShuffle] = useState(false);
  const { volume, setVolume } = useVolume();

  const localEnabled = source === 'local';
  const streamingEnabled = source === 'streaming';
  const local = useAudioPlayer(shuffle, localEnabled, volume);
  const streaming = useSpotifyPlayer(streamTracks, shuffle, streamingEnabled, volume);
  const player = streamingEnabled ? streaming : local;
  const {
    isLoggedIn: isYoutubeLoggedIn,
    isLoading: isYoutubeLoading,
    playlists: youtubePlaylists,
    loginAndFetch: youtubeLoginAndFetch,
    logout: youtubeLogout,
  } = useYoutubePlayer();

  const {
    track,
    isPlaying,
    progress,
    duration,
    currentTime,
    togglePlay,
    next,
    prev,
    seek,
  } = player;
  const streamLoading = streaming.loading;

  // ── Fetch Spotify playlists ────────────────────────────
  const loadSpotifyPlaylists = useCallback((silent = false) => {
    setLoadingPlaylists(true);
    if (!silent) setSettingsError(null);
    fetchSpotifyPlaylists()
      .then((p) => { setSpotifyPlaylists(p); setSettingsError(null); })
      .catch((err) => { if (!silent) setSettingsError(err.message); })
      .finally(() => setLoadingPlaylists(false));
  }, []);

  // ── Fetch Apple Music playlists ────────────────────────
  const loadApplePlaylists = useCallback(() => {
    setLoadingPlaylists(true);
    setSettingsError(null);
    fetchApplePlaylists()
      .then(setApplePlaylists)
      .catch((err) => setSettingsError(err.message))
      .finally(() => setLoadingPlaylists(false));
  }, []);

  // ── Handle Spotify OAuth callback on mount ─────────────
  useEffect(() => {
    async function checkCallback() {
      const params = new URLSearchParams(window.location.search);
      if (params.has('code')) {
        try {
          await handleCallback();
          setSpotifyConnected(true);
          // Small delay to let token settle before fetching
          setTimeout(() => loadSpotifyPlaylists(true), 500);
        } catch (err) {
          setSettingsError(err.message);
        }
      } else {
        if (isSpotifyLoggedIn()) loadSpotifyPlaylists(true);
        if (isAppleLoggedIn()) loadApplePlaylists();
      }
    }
    checkCallback();
  }, []);

  // ── MASTER SWITCH: Stop streaming before going local ──
  const handleSwitchToLocal = useCallback(() => {
    streaming.stop?.();
    setStreamTracks([]);
    setSource('local');
    setMusicService('local');
  }, [streaming]);

  // ── Load a playlist by ID (Robust track-length validation) ───
  const loadPlaylist = useCallback(async (id, service) => {
    setLoadingPlaylist(true);
    setSettingsError(null); // Clear previous errors cleanly
    
    try {
      let tracks = [];
      
      if (service === 'apple') {
        tracks = await fetchAppleTracks(id);
      } else if (service === 'spotify') {
        tracks = await fetchSpotifyTracks(id);
      } else if (service === 'youtube') {
        tracks = await window.cupid.getYoutubePlaylistTracks(id);
      }

      if (!tracks || tracks.length === 0) {
        setSettingsError('This playlist is empty or could not be loaded. Try another playlist.');
        return;
      }

      local.stop?.();
      setStreamTracks(tracks);
      setSource('streaming');
      setMusicService(service === 'youtube' ? 'youtube' : service);
    } catch (err) {
      console.error('Playlist load error:', err);
      setSettingsError('Could not load this playlist. Check your connection and try again.');
    } finally {
      setLoadingPlaylist(false);
    }
  }, [local]);

  const { theme, toggleTheme, assets } = useTheme();

  const [recordFrame, setRecordFrame] = useState(0);
  const [needleFrame, setNeedleFrame] = useState(0);
  const [isPink, setIsPink] = useState(theme === 'pink');
  const [swapping, setSwapping] = useState(false);
  const [needleLifted, setNeedleLifted] = useState(false);
  const [starHovered, setStarHovered] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(null);
  const seekRef = useRef(null);

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e) => {
      const rect = seekRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverProgress(pct);
      seek(pct);
    };
    const onMouseUp = () => {
      setDragging(false);
      setStarHovered(false);
      setHoverProgress(null);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, seek]);
  const [needleChangeFrame, setNeedleChangeFrame] = useState(0);
  const trackKey = track.id || `${track.title}::${track.artist}`;
  const prevTrackRef = useRef(trackKey);

  const currentFrames = isPink ? assets.recordFramesA : assets.recordFramesB;
  const incomingFrames = isPink ? assets.recordFramesB : assets.recordFramesA;

  // Spin animation while playing
  useEffect(() => {
    if (!isPlaying || swapping) return;
    const interval = setInterval(() => {
      setRecordFrame((f) => (f + 1) % currentFrames.length);
      setNeedleFrame((f) => (f + 1) % assets.needlePlayFrames.length);
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying, swapping, currentFrames.length]);

  // Detect song change and trigger swap
  // Sequence: needle lifts → records swap → needle lowers
  useEffect(() => {
    if (prevTrackRef.current === trackKey) return;
    prevTrackRef.current = trackKey;

    setNeedleLifted(true);
    setNeedleChangeFrame(0);

    const timers = [
      setTimeout(() => setNeedleChangeFrame(1), 200),
      setTimeout(() => setSwapping(true), 400),
      setTimeout(() => {
        setIsPink((p) => !p);
        setRecordFrame(0);
        setSwapping(false);
      }, 1000),
      setTimeout(() => {
        setNeedleChangeFrame(0);
        setNeedleLifted(false);
        setNeedleFrame(0);
      }, 1100),
    ];

    return () => timers.forEach(clearTimeout);
  }, [trackKey]);

  const resizeTL = useResize('top-left');
  const resizeTR = useResize('top-right');
  const resizeBL = useResize('bottom-left');
  const resizeBR = useResize('bottom-right');

  return (
    <div className={`player ${theme === 'blue' ? 'theme-blue' : ''}`}>
      {/* Base frame */}
      <img src={assets.frame} className="layer" alt="" draggable={false} />

      {/* Window title */}
      <div className="window-title">Music Player Ø</div>

      {/* Record player centered in frame */}
      <img src={assets.recordPlayer} className="record-player" alt="" draggable={false} />
      <img
        src={currentFrames[recordFrame]}
        className={`record-player ${swapping ? 'record-slide-out' : ''}`}
        alt=""
        draggable={false}
      />
      {swapping && (
        <img
          src={incomingFrames[0]}
          className="record-player record-slide-in"
          alt=""
          draggable={false}
        />
      )}
      <img
        src={needleLifted ? assets.needleChangeFrames[needleChangeFrame] : assets.needlePlayFrames[needleFrame]}
        className="record-player"
        alt=""
        draggable={false}
      />

      {/* Frame overlay (no background) to clip sliding records */}
      <img src={assets.frameNoBg} className="layer frame-overlay" alt="" draggable={false} />

      {/* Decorative */}
      <img src={assets.plant} className="layer layer-ui" alt="" draggable={false} />

      {/* Progress bar layers */}
      <img src={assets.progressBar} className="layer layer-ui" alt="" draggable={false} />
      <img
        src={progressBarStars}
        className="layer layer-ui"
        alt=""
        draggable={false}
        style={{
          clipPath: `inset(0 ${(1 - (131 + (hoverProgress ?? progress) * 226 + 10) / 512) * 100}% 0 0)`,
        }}
      />
      <img
        src={starHovered ? starSelected : star}
        className={`layer layer-ui star-indicator ${starHovered ? 'star-hovered' : ''}`}
        alt=""
        draggable={false}
        style={{
          transform: `translateX(calc(-3 / 306 * 100vw + ${(hoverProgress ?? progress) * (226 / 512) * 171.9}vw))`,
        }}
      />

      {/* Playback control layers (visual only) */}
      <img src={assets.backwardsButton} className="layer layer-ui" alt="" draggable={false} />
      <img src={isPlaying? assets.pauseButton : assets.playButton} className="layer layer-ui" alt="" draggable={false} />
      <img src={assets.forwardsButton} className="layer layer-ui" alt="" draggable={false} />

      {/* Window control layers (visual only) */}
      <img src={assets.minimizerButton} className="layer layer-ui" alt="" draggable={false} />
      <img src={assets.windowButton} className="layer layer-ui" alt="" draggable={false} />
      <img src={assets.exitButton} className="layer layer-ui" alt="" draggable={false} />

      {/* Settings button layer */}
      <img src={assets.settings} className="layer layer-ui settings-layer" alt="" draggable={false} />

      {/* SVG clip-path for pixel-art album mask */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="album-mask" clipPathUnits="objectBoundingBox">
            {/* 35x41 centered vertically */}
            <rect x="0.07317" y="0" width="0.85366" height="1" />
            {/* 37x39 */}
            <rect x="0.04878" y="0.02439" width="0.90244" height="0.95122" />
            {/* 39x37 */}
            <rect x="0.02439" y="0.04878" width="0.95122" height="0.90244" />
            {/* 41x35 */}
            <rect x="0" y="0.07317" width="1" height="0.85366" />
          </clipPath>
        </defs>
      </svg>

      {/* Album art clipped to pixel mask */}
      <div className="album-mask">
        <img 
          src={track.art || defaultAlbumIcon} 
          className="album-art" 
          alt="Album Art" 
          draggable={false} 
        />
      </div>

      {/* Album frame overlay */}
      <img src={assets.albumFrame} className="layer album-frame-layer" alt="" draggable={false} />

      {/* Now playing section */}
      <div className="now-playing">
        <div className="track-info">
          <div className="now-playing-label">
            {/* Dynamically switch labels based on loading status */}
            {loadingPlaylist || streamLoading ? 'loading song...' : 'now playing...'}
          </div>
          
          {loadingPlaylist || streamLoading ? (
            <MarqueeText className="track-title" text="..." />
          ) : (
            <MarqueeText className="track-title" text={track.title || 'No Track Selected'} />
          )}
          
          <div className="track-artist">
            {loadingPlaylist || streamLoading ? 'please wait' : `by ${track.artist || 'Unknown'}`}
          </div>
        </div>
      </div>

      {/* Time display */}
      <div className="time-display">
        <span className="time-current">{formatTime(currentTime)}</span>
        <span className="time-remaining">{formatTime(duration - currentTime)}</span>
      </div>

      {/* Drag region for moving the window */}
      <div className="drag-region" />

      {/* Custom resize handles at frame corners */}
      <div className="resize-handle top-left" onMouseDown={resizeTL} />
      <div className="resize-handle top-right" onMouseDown={resizeTR} />
      <div className="resize-handle bottom-left" onMouseDown={resizeBL} />
      <div className="resize-handle bottom-right" onMouseDown={resizeBR} />

      {/* Progress bar seek target */}
      <div
        className="progress-seek"
        ref={seekRef}
        onMouseEnter={() => setStarHovered(true)}
        onMouseLeave={() => { if (!dragging) { setStarHovered(false); } }}
        onMouseDown={(e) => {
          e.preventDefault();
          setDragging(true);
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          setHoverProgress(pct);
          seek(pct);
        }}
      />

      {/* Playback control click targets */}
      <div className="btn btn-prev" onClick={prev} />
      <div className="btn btn-play" onClick={togglePlay} />
      <div className="btn btn-next" onClick={next} />

      <VolumeControl volume={volume} onChange={setVolume} />

      {/* Window control click targets */}
      <div className="btn btn-minimize" onClick={() => window.cupid?.minimize()} />
      <div className="btn btn-window" onClick={() => window.cupid?.maximize()} />
      <div className="btn btn-exit" onClick={() => window.cupid?.close()} />

      {/* Settings button */}
      <div className="btn btn-settings" onClick={() => setShowSettings((v) => !v)} />

      {/* Settings panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-panel-inner">
            <div className="settings-label">theme</div>
            <div className="settings-theme-row">
              <button
                className={`settings-theme-btn ${theme === 'pink' ? 'active' : ''}`}
                onClick={() => { if (theme !== 'pink') toggleTheme(); }}
              >
                pink
              </button>
              <button
                className={`settings-theme-btn ${theme === 'blue' ? 'active' : ''}`}
                onClick={() => { if (theme !== 'blue') toggleTheme(); }}
              >
                blue
              </button>
            </div>
            <div className="settings-label">music</div>
            <div className="settings-theme-row">
              <button
                className={`settings-theme-btn ${musicService === 'youtube' ? 'active' : ''}`}
                onClick={() => setMusicService('youtube')}
              >
                Yt
              </button>
              <button
                className={`settings-theme-btn ${musicService === 'local' ? 'active' : ''}`}
                onClick={handleSwitchToLocal}
              >
                Local
              </button>
            {/* Commented out Spotify and Apple buttons for now, until we can give them easy login flows without requiring a web server or redirect URI.
              <button
                className={`settings-theme-btn ${musicService === 'spotify' ? 'active' : ''}`}
                onClick={() => setMusicService('spotify')}
              >
                Spotify
              </button>
              <button
                className={`settings-theme-btn ${musicService === 'apple' ? 'active' : ''}`}
                onClick={() => setMusicService('apple')}
              >
                Apple
              </button>
            */}
              <button
                className={`settings-theme-btn settings-shuffle ${shuffle ? 'active' : ''}`}
                onClick={() => setShuffle((s) => !s)}
                title="Shuffle"
              >
                &#8645;
              </button>
            </div>

            {musicService === 'youtube' && (
              <YoutubeSettings 
                isLoggedIn={isYoutubeLoggedIn}
                isLoading={isYoutubeLoading}
                playlists={youtubePlaylists}
                loginAndFetch={youtubeLoginAndFetch}
                loadingPlaylist={loadingPlaylist}
                loadPlaylist={loadPlaylist}
                source={source}
                handleSwitchToLocal={handleSwitchToLocal}
                onLogout={() => {
                  youtubeLogout();
                  if (source === 'streaming') handleSwitchToLocal();
                }}
              />
            )}

            {musicService === 'local' && (
              <LocalSettings
                onRefresh={local.refreshPlaylist}
                onOpenFolder={() => window.cupid?.openLocalFolder()}
              />
            )}

            {musicService === 'spotify' && (
              <SpotifySettings 
                connected={spotifyConnected}
                loadingPlaylists={loadingPlaylists}
                playlists={spotifyPlaylists}
                loadingPlaylist={loadingPlaylist}
                loadPlaylist={loadPlaylist}
                source={source}
                handleSwitchToLocal={handleSwitchToLocal}
                onLogin={() => spotifyLogin()}
                onLogout={() => {
                  spotifyLogout();
                  setSpotifyConnected(false);
                  setSpotifyPlaylists([]);
                  if (source === 'streaming') handleSwitchToLocal();
                }}
              />
            )}

            {musicService === 'apple' && (
              <AppleSettings 
                connected={appleConnected}
                playlists={applePlaylists}
                loadingPlaylist={loadingPlaylist}
                loadPlaylist={loadPlaylist}
                source={source}
                handleSwitchToLocal={handleSwitchToLocal}
                onLogin={async () => {
                  try {
                    await appleLogin();
                    setAppleConnected(true);
                    loadApplePlaylists();
                  } catch (err) {
                    setSettingsError(err.message);
                  }
                }}
                onLogout={() => {
                  appleLogout();
                  setAppleConnected(false);
                  setApplePlaylists([]);
                  if (source === 'streaming') handleSwitchToLocal();
                }}
              />
            )}
            {settingsError && <div className="settings-error">{settingsError}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
