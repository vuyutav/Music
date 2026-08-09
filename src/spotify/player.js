/**
 * Spotify Web Playback SDK wrapper
 *
 * Loads the SDK script dynamically and exposes a thin control layer
 * that the useSpotifyPlayer hook can drive.
 */

let sdkReady = null; // resolved once window.Spotify is available
let playerInstance = null;
let deviceId = null;

/**
 * Load the Spotify Web Playback SDK script into the page.
 * Safe to call multiple times — it only loads once.
 *
 * @returns {Promise<void>} resolves when window.Spotify.Player is available
 */
export function loadSDK() {
  if (sdkReady) return sdkReady;

  sdkReady = new Promise((resolve) => {
    // The SDK calls this global callback when it's ready
    window.onSpotifyWebPlaybackSDKReady = () => resolve();

    if (window.Spotify) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
  });

  return sdkReady;
}

/**
 * Initialise and connect a Spotify.Player instance.
 *
 * @param {string} accessToken
 * @param {function} onStateChange — called with the Spotify player state on every change
 * @param {function} onReady — called with { device_id } when the player is connected
 * @returns {Promise<Spotify.Player>}
 */
export async function initPlayer(accessToken, { onStateChange, onReady, onTokenRefresh }) {
  await loadSDK();

  // Disconnect any existing player before creating a new one
  if (playerInstance) {
    playerInstance.disconnect();
    playerInstance = null;
    deviceId = null;
  }

  const player = new window.Spotify.Player({
    name: 'Cupid Player',
    getOAuthToken: async (cb) => {
      // If the caller provided a refresh helper, use it to get a fresh token
      if (onTokenRefresh) {
        const freshToken = await onTokenRefresh();
        cb(freshToken);
      } else {
        cb(accessToken);
      }
    },
    volume: 0.5,
  });

  // Listeners
  player.addListener('ready', ({ device_id }) => {
    deviceId = device_id;
    onReady?.({ device_id });
  });

  player.addListener('not_ready', () => {
    deviceId = null;
  });

  player.addListener('player_state_changed', (state) => {
    onStateChange?.(state);
  });

  player.addListener('initialization_error', ({ message }) => {
    console.error('[Spotify SDK] Initialization error:', message);
  });
  player.addListener('authentication_error', ({ message }) => {
    console.error('[Spotify SDK] Authentication error:', message);
  });
  player.addListener('account_error', ({ message }) => {
    console.error('[Spotify SDK] Account error (Premium required):', message);
  });

  const connected = await player.connect();
  if (!connected) {
    throw new Error('Failed to connect Spotify Web Playback SDK');
  }

  playerInstance = player;
  return player;
}

/**
 * Disconnect the current player if any.
 */
export function disconnectPlayer() {
  if (playerInstance) {
    playerInstance.disconnect();
    playerInstance = null;
    deviceId = null;
  }
}

/**
 * Get the current device ID (needed for the Web API transfer-playback call).
 */
export function getDeviceId() {
  return deviceId;
}

/**
 * Play a Spotify URI on the connected device.
 *
 * @param {string} token
 * @param {string[]} uris — array of track URIs
 * @param {number} [offset=0] — index within the array to start from
 */
export async function playTracks(token, uris, offset = 0) {
  const id = getDeviceId();
  if (!id) throw new Error('No Spotify device connected');

  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris, offset: { position: offset } }),
  });
}

/**
 * Resume playback.
 */
export async function resume() {
  if (playerInstance) await playerInstance.resume();
}

/**
 * Pause playback.
 */
export async function pause() {
  if (playerInstance) await playerInstance.pause();
}

/**
 * Seek to a position in the current track.
 * @param {number} ms — position in milliseconds
 */
export async function seek(ms) {
  if (playerInstance) await playerInstance.seek(ms);
}

/**
 * Skip to the next track.
 */
export async function nextTrack() {
  if (playerInstance) await playerInstance.nextTrack();
}

/**
 * Skip to the previous track.
 */
export async function previousTrack() {
  if (playerInstance) await playerInstance.previousTrack();
}

/**
 * Get the current playback state from the SDK.
 * @returns {Promise<object|null>}
 */
export async function getCurrentState() {
  if (!playerInstance) return null;
  return playerInstance.getCurrentState();
}
