/**
 * Streaming player hook — Spotify, Apple Music, and YouTube playlists via yt-dlp.
 * Exposes the same interface as useAudioPlayer.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

function tracksSignature(tracks) {
  if (!tracks.length) return '';
  const first = tracks[0]?.id || tracks[0]?.title || '';
  const last = tracks[tracks.length - 1]?.id || tracks[tracks.length - 1]?.title || '';
  return `${tracks.length}:${first}:${last}`;
}

export default function useSpotifyPlayer(tracks, shuffle = false, enabled = true, volume = 1) {
  const audioRef = useRef(new Audio());
  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);

  const audio = audioRef.current;

  useEffect(() => {
    audio.volume = volume;
  }, [volume, audio]);

  useEffect(() => {
    if (enabled) return;
    audio.pause();
    setIsPlaying(false);
  }, [enabled, audio]);

  // Reset playback when the playlist changes.
  useEffect(() => {
    setTrackIndex(0);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setLoading(false);
    audio.pause();
    audio.removeAttribute('src');
  }, [tracksSignature(tracks)]); // eslint-disable-line react-hooks/exhaustive-deps

  const track = tracks[trackIndex] ?? {
    id: 'stream-empty',
    title: tracks.length === 0 ? 'No playlist loaded' : 'No track',
    artist: '',
    art: null,
    uri: null,
  };

  useEffect(() => {
    if (!enabled || tracks.length === 0) return;
    const t = tracks[trackIndex];
    if (!t) return;

    let cancelled = false;
    setLoading(true);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    async function loadStream() {
      try {
        const url = await window.cupid.getStreamUrl(t.title, t.artist);
        if (cancelled) return;
        audio.src = url;
        if (isPlayingRef.current) {
          await audio.play().catch(() => {});
        }
      } catch (err) {
        console.error('[yt-dlp] Failed to get stream:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStream();

    return () => { cancelled = true; };
  }, [trackIndex, tracksSignature(tracks), enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled || tracks.length === 0) return;
    const nextIdx = (trackIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIdx];
    if (nextTrack) {
      window.cupid.getStreamUrl(nextTrack.title, nextTrack.artist).catch(() => {});
    }
  }, [trackIndex, tracksSignature(tracks), enabled]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (!enabled) return;
      const list = tracksRef.current;
      if (list.length === 0) return;
      setTrackIndex((prev) => {
        if (shuffleRef.current && list.length > 1) {
          let next;
          do { next = Math.floor(Math.random() * list.length); } while (next === prev);
          return next;
        }
        return (prev + 1) % list.length;
      });
      setIsPlaying(true);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [tracks.length, enabled, audio]);

  const pause = useCallback(() => {
    audio.pause();
    setIsPlaying(false);
  }, [audio]);

  const stop = useCallback(() => {
    audio.pause();
    audio.removeAttribute('src');
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setLoading(false);
  }, [audio]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, pause, audio]);

  const next = useCallback(() => {
    if (!enabled || tracks.length === 0) return;
    setTrackIndex((prev) => {
      if (shuffleRef.current && tracks.length > 1) {
        let n;
        do { n = Math.floor(Math.random() * tracks.length); } while (n === prev);
        return n;
      }
      return (prev + 1) % tracks.length;
    });
    setIsPlaying(true);
  }, [enabled, tracks.length]);

  const prev = useCallback(() => {
    if (!enabled || tracks.length === 0) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      setTrackIndex((prevIdx) => (prevIdx - 1 + tracks.length) % tracks.length);
    }
    setIsPlaying(true);
  }, [enabled, tracks.length, audio]);

  const seek = useCallback((fraction) => {
    if (audio.duration) {
      audio.currentTime = Math.min(fraction, 1) * audio.duration;
    }
  }, [audio]);

  return {
    track,
    trackIndex,
    isPlaying,
    progress,
    duration,
    currentTime,
    togglePlay,
    pause,
    stop,
    next,
    prev,
    seek,
    loading,
  };
}
