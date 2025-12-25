import { musicControlManager } from "@/store/musicControlService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AudioPlayer,
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";
import { create } from "zustand";
import { audioCacheManager } from "./audioCache";

interface AudioItem {
  id: string;
  title: string;
  url: string;
  reciter: string;
}

interface AudioState {
  audioItem: AudioItem | null;
  playlist: AudioItem[];
  player: AudioPlayer | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLooping: boolean;
  isShuffling: boolean;
  activeScreen: "audio" | "favorites" | "player";
  favorites: AudioItem[];
  isCaching: boolean;
  hasFinished: boolean; // Add flag to prevent double-triggering

  setAudioItem: (item: AudioItem | null) => Promise<void>;
  setPlaylist: (playlist: AudioItem[]) => void;
  setPlayer: (player: AudioPlayer | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleLooping: () => void;
  toggleShuffling: () => void;
  togglePlayPause: () => Promise<void>;
  setActiveScreen: (screen: "audio" | "favorites" | "player") => void;

  loadFavorites: () => Promise<void>;
  addFavorite: (item: AudioItem) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;

  playNext: () => void;
  playPrevious: () => void;
  seekTo: (position: number) => void;

  initialize: () => void;
  cleanup: () => void;
  updateMusicControl: () => void;
}

const FAVORITES_KEY = "audio_favorites";

export const useAudioStore = create<AudioState>((set, get) => ({
  audioItem: null,
  playlist: [],
  player: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isLooping: false,
  isShuffling: false,
  activeScreen: "audio",
  favorites: [],
  isCaching: false,
  hasFinished: false,

  setAudioItem: async (item) => {
    const { player: currentPlayer } = get();

    // Cleanup existing player
    if (currentPlayer) {
      try {
        currentPlayer.pause();
        currentPlayer.remove();
      } catch (error) {
        console.error("Error cleaning up player:", error);
      }
    }

    set({
      audioItem: item,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      hasFinished: false, // Reset the finish flag
    });

    if (item) {
      try {
        // Create new player instance using createAudioPlayer
        const newPlayer = createAudioPlayer(item.url, {
          updateInterval: 500,
        });

        // Set looping if enabled
        newPlayer.loop = get().isLooping;

        // Subscribe to playback status updates
        const statusSubscription = newPlayer.addListener(
          "playbackStatusUpdate",
          (status: AudioStatus) => {
            const currentState = get();
            
            set({
              isPlaying: status.playing,
              currentTime: status.currentTime,
              duration: status.duration,
            });

            // Handle when playback finishes - use flag to prevent double-trigger
            if (status.didJustFinish && !currentState.isLooping && !currentState.hasFinished) {
              set({ hasFinished: true });
              // Small delay to ensure state is updated
              setTimeout(() => {
                get().playNext();
              }, 100);
            }

            get().updateMusicControl();
          }
        );

        set({ player: newPlayer });

        // Start playing automatically
        newPlayer.play();
      } catch (error) {
        console.error("Error creating audio player:", error);
      }
    }
  },

  setPlaylist: (playlist) => set({ playlist }),
  setPlayer: (player) => set({ player }),

  setIsPlaying: (playing) => {
    set({ isPlaying: playing });
    get().updateMusicControl();
  },

  togglePlayPause: async () => {
    const { player, isPlaying } = get();
    if (!player) return;

    try {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  },

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => {
    set({ duration });
    get().updateMusicControl();
  },

  toggleLooping: () => {
    const newLooping = !get().isLooping;
    set({ isLooping: newLooping });
    const { player } = get();
    if (player) {
      player.loop = newLooping;
    }
  },

  toggleShuffling: () =>
    set((state) => ({ isShuffling: !state.isShuffling })),

  setActiveScreen: (screen) => set({ activeScreen: screen }),

  loadFavorites: async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) set({ favorites: JSON.parse(stored) });
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  },

  addFavorite: async (item) => {
    try {
      const { favorites } = get();
      if (favorites.some((fav) => fav.id === item.id)) return;
      const newFavorites = [...favorites, item];
      await AsyncStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(newFavorites)
      );
      set({ favorites: newFavorites });
    } catch (error) {
      console.error("Error adding favorite:", error);
    }
  },

  removeFavorite: async (id) => {
    try {
      const { favorites } = get();
      const newFavorites = favorites.filter((fav) => fav.id !== id);
      await AsyncStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(newFavorites)
      );
      set({ favorites: newFavorites });
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  },

  isFavorite: (id) => get().favorites.some((fav) => fav.id === id),

  playNext: () => {
    const { audioItem, playlist, isShuffling } = get();
    if (!audioItem) return;

    if (playlist.length === 0) return;

    let currentIndex = playlist.findIndex(
      (item) => item.id === audioItem.id
    );

    if (currentIndex === -1) return;

    if (!isShuffling && currentIndex === playlist.length - 1) return;

    let nextIndex;
    if (isShuffling) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = currentIndex + 1;
    }

    get().setAudioItem(playlist[nextIndex]);
  },

  playPrevious: () => {
    const { audioItem, playlist } = get();
    if (!audioItem) return;

    if (playlist.length === 0) return;

    let currentIndex = playlist.findIndex(
      (item) => item.id === audioItem.id
    );

    if (currentIndex === 0) return;

    let prevIndex = currentIndex - 1;
    get().setAudioItem(playlist[prevIndex]);
  },

  seekTo: async (position) => {
    const { player } = get();
    if (player) {
      try {
        player.seekTo(position);
      } catch (error) {
        console.error("Error seeking:", error);
      }
    }
  },

  updateMusicControl: () => {
    const { audioItem, duration, currentTime, isPlaying } = get();
    if (audioItem) {
      musicControlManager.updateNowPlaying({
        title: audioItem.title,
        artist: audioItem.reciter,
        duration,
        isPlaying,
        elapsedTime: currentTime,
      });
    }
  },

  initialize: async () => {
    // Configure audio mode for background playback
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      });
      console.log("Audio mode configured for background playback");
    } catch (error) {
      console.error("Error setting audio mode:", error);
    }

    audioCacheManager.initialize();
    musicControlManager.initialize({
      onPlay: () => {
        const { player } = get();
        if (player && !get().isPlaying) {
          player.play();
        }
      },
      onPause: () => {
        const { player } = get();
        if (player && get().isPlaying) {
          player.pause();
        }
      },
      onNext: () => get().playNext(),
      onPrevious: () => get().playPrevious(),
      onSeek: (pos: number) => get().seekTo(pos),
    });
    get().loadFavorites();
  },

  cleanup: async () => {
    const { player } = get();
    if (player) {
      try {
        player.pause();
        player.remove();
      } catch (error) {
        console.error("Error cleaning up player:", error);
      }
    }
    musicControlManager.destroy();
  },
}));



