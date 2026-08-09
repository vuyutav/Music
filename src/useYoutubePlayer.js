import { useState } from 'react';

export function useYoutubePlayer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loginAndFetch = async () => {
    setIsLoading(true);
    try {
      const cookie = await window.cupid.youtubeLogin();

      if (cookie) {
        setIsLoggedIn(true);
        const userPlaylists = await window.cupid.getYoutubePlaylists();
        setPlaylists(userPlaylists);
      }
    } catch (error) {
      console.error('Failed to login to YouTube Music', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoggedIn(false);
    setPlaylists([]);
    await window.cupid.youtubeLogout?.();
  };

  return {
    isLoggedIn,
    isLoading,
    playlists,
    loginAndFetch,
    logout,
  };
}
