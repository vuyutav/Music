import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Local audio player hook (HTML5 Audio).
 * Reads tracks from the user's Music Tracks folder.
 */
export default function useAudioPlayer(shuffle = false, enabled = true, volume = 1) {
  const audioRef = useRef(new Audio());
  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;

  const [playlist, setPlaylist] = useState([]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [scanning, setScanning] = useState(true);

  const refreshPlaylist = useCallback(async () => {
    setScanning(true);
    try {
      if (window.cupid?.getLocalTracks) {
        const tracks = await window.cupid.getLocalTracks();
        setPlaylist(tracks || []);
        setTrackIndex(0);
      }
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    refreshPlaylist();
  }, [refreshPlaylist]);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (enabled) return;
    const audio = audioRef.current;
    audio.pause();
    setIsPlaying(false);
  }, [enabled]);

  const track = playlist[trackIndex] || {
    id: 'local-placeholder',
    title: scanning ? 'Scanning folder...' : (playlist.length === 0 ? 'No songs found' : 'No track'),
    artist: scanning ? 'Local Tracks' : (playlist.length === 0 ? 'Add MP3 files to your Music Tracks folder' : 'Local Track'),
    path: null,
  };

  const audio = audioRef.current;

  useEffect(() => {
    if (!enabled || !track.path) return;

    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    audio.src = track.path;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          if (e.name !== 'AbortError') {
            console.error('Playback error:', e);
          }
        });
      }
    }
  }, [track.path, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => {
      if (!enabled || playlist.length === 0) return;
      setTrackIndex((prev) => {
        if (shuffleRef.current && playlist.length > 1) {
          let n;
          do { n = Math.floor(Math.random() * playlist.length); } while (n === prev);
          return n;
        }
        return (prev + 1) % playlist.length;
      });
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [playlist.length, enabled]);

  const play = useCallback(() => {
    if (!enabled || playlist.length === 0) return;
    audio.play().catch((e) => console.error('Play error:', e));
    setIsPlaying(true);
  }, [enabled, playlist.length]);

  const pause = useCallback(() => {
    audio.pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    audio.pause();
    audio.removeAttribute('src');
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const next = useCallback(() => {
    if (!enabled || playlist.length === 0) return;
    setTrackIndex((prev) => {
      if (shuffleRef.current && playlist.length > 1) {
        let n;
        do { n = Math.floor(Math.random() * playlist.length); } while (n === prev);
        return n;
      }
      return (prev + 1) % playlist.length;
    });
    setIsPlaying(true);
  }, [enabled, playlist.length]);

  const prev = useCallback(() => {
    if (!enabled || playlist.length === 0) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      setTrackIndex((prevIdx) => (prevIdx - 1 + playlist.length) % playlist.length);
    }
    setIsPlaying(true);
  }, [enabled, playlist.length]);

  const seek = useCallback((fraction) => {
    if (audio.duration) {
      audio.currentTime = Math.min(fraction, 1) * audio.duration;
    }
  }, []);

  return {
    track,
    isPlaying,
    progress,
    duration,
    currentTime,
    togglePlay,
    play,
    pause,
    stop,
    next,
    prev,
    seek,
    refreshPlaylist,
  };
}
