import AsyncStorage from "@react-native-async-storage/async-storage";
import { AudioPlayer } from "expo-audio";
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
  currentAudioUrl: string | null;
  player: AudioPlayer | null;

  isPlaying: boolean;
  currentTime: number;
  duration: number;
  didJustFinish: boolean;
  shouldAutoPlay: boolean;

  activeScreen: "audio" | "favorites" | "player";

  favorites: AudioItem[];

  isCaching: boolean;
  cachingProgress: { [id: string]: number };
  isCacheInitialized: boolean;

  setAudioItem: (item: AudioItem | null) => void;
  setCurrentAudioUrl: (url: string | null) => void;
  setPlayer: (player: AudioPlayer | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setDidJustFinish: (finished: boolean) => void;
  setShouldAutoPlay: (should: boolean) => void;
  setActiveScreen: (screen: "audio" | "favorites" | "player") => void;

  loadFavorites: () => Promise<void>;
  addFavorite: (item: AudioItem) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;

  getCachedAudioUrl: (
    id: string,
    remoteUrl: string
  ) => Promise<string>;
  cacheAudio: (id: string, remoteUrl: string) => Promise<boolean>;
  cacheMultipleAudios: (audios: AudioItem[]) => Promise<void>;
  removeCachedAudio: (id: string) => Promise<boolean>;
  clearAllCache: () => Promise<boolean>;
  getCacheStatus: (id: string) => {
    isCached: boolean;
    size?: number;
    cachedAt?: number;
  };
  getTotalCacheSize: () => number;
  isAudioCached: (id: string) => Promise<boolean>;
  isAudioCachedSync: (id: string) => boolean;

  initializeCache: () => Promise<void>;
  getCacheStats: () => Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
  }>;
}

const FAVORITES_KEY = "audio_favorites";

export const useAudioStore = create<AudioState>((set, get) => ({
  audioItem: null,
  currentAudioUrl: null,
  player: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  didJustFinish: false,
  shouldAutoPlay: false,
  activeScreen: "audio",
  favorites: [],
  isCaching: false,
  cachingProgress: {},
  isCacheInitialized: false,

  setAudioItem: (item) => set({ audioItem: item }),
  setCurrentAudioUrl: (url) => set({ currentAudioUrl: url }),
  setPlayer: (player) => set({ player }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setDidJustFinish: (finished) => set({ didJustFinish: finished }),
  setShouldAutoPlay: (should) => set({ shouldAutoPlay: should }),
  setActiveScreen: (screen) => set({ activeScreen: screen }),

  loadFavorites: async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const favorites = JSON.parse(stored);
        set({ favorites });
        console.log(`✅ Loaded ${favorites.length} favorites`);
      }
    } catch (error) {
      console.error("❌ Error loading favorites:", error);
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
      console.log(`✅ Added to favorites: ${item.title}`);
    } catch (error) {
      console.error("❌ Error adding favorite:", error);
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
      console.log(`✅ Removed from favorites: ${id}`);
    } catch (error) {
      console.error("❌ Error removing favorite:", error);
    }
  },

  isFavorite: (id) => get().favorites.some((fav) => fav.id === id),

  initializeCache: async () => {
    try {
      await audioCacheManager.initialize();
      set({ isCacheInitialized: true });
      console.log("✅ Cache manager initialized");
    } catch (error) {
      console.error("❌ Error initializing cache:", error);
      set({ isCacheInitialized: false });
    }
  },

  getCachedAudioUrl: async (id, remoteUrl) => {
    try {
      if (!get().isCacheInitialized) return remoteUrl;
      const cachedUri = await audioCacheManager.getAudioUri(
        id,
        remoteUrl
      );
      return cachedUri;
    } catch {
      return remoteUrl;
    }
  },

  cacheAudio: async (id, remoteUrl) => {
    try {
      if (!get().isCacheInitialized) return false;
      if (await get().isAudioCached(id)) return true;
      const success = await audioCacheManager.cacheAudio(
        id,
        remoteUrl
      );
      if (success) console.log(`✅ Cached: ${id}`);
      return success;
    } catch {
      return false;
    }
  },

  cacheMultipleAudios: async (audios) => {
    set({ isCaching: true });
    try {
      for (const a of audios) await get().cacheAudio(a.id, a.url);
    } finally {
      set({ isCaching: false });
    }
  },

  removeCachedAudio: async (id) =>
    audioCacheManager.removeCacheEntry(id),
  clearAllCache: async () => audioCacheManager.clearAllCache(),
  getCacheStatus: (id) =>
    audioCacheManager.getCacheInfo(id) || { isCached: false },
  getTotalCacheSize: () => audioCacheManager.getTotalCacheSize(),
  isAudioCached: (id) => audioCacheManager.isCachedAndValid(id),
  isAudioCachedSync: (id) => audioCacheManager.isCached(id),
  getCacheStats: async () => audioCacheManager.getCacheStats(),
}));
