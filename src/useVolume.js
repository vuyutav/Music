import { useState, useCallback } from 'react';

const STORAGE_KEY = 'cupid-player-volume';
const DEFAULT_VOLUME = 0.8;

function getStoredVolume() {
  try {
    const stored = parseFloat(localStorage.getItem(STORAGE_KEY));
    if (!Number.isNaN(stored) && stored >= 0 && stored <= 1) return stored;
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_VOLUME;
}

export default function useVolume() {
  const [volume, setVolumeState] = useState(getStoredVolume);

  const setVolume = useCallback((value) => {
    const clamped = Math.max(0, Math.min(1, value));
    setVolumeState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // ignore
    }
  }, []);

  return { volume, setVolume };
}
