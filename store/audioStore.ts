// // import AsyncStorage from "@react-native-async-storage/async-storage";
// // import { AudioPlayer } from "expo-audio";
// // import { create } from "zustand";

// // // 🎵 Type definitions
// // interface AudioItem {
// //   url: string;
// //   title: string;
// //   id: string;
// //   reciter?: string;
// // }

// // interface AudioState {
// //   // Audio playback states
// //   audioItem: AudioItem | null;
// //   currentAudioUrl: string | null;
// //   isPlaying: boolean;
// //   player: AudioPlayer | null;
// //   isLoading: boolean;
// //   currentTime: number;
// //   duration: number;
// //   didJustFinish: boolean;
// //   shouldAutoPlay: boolean;

// //   // Favorite feature
// //   favorites: AudioItem[];

// //   // Audio control actions
// //   setAudioItem: (item: AudioItem) => void;
// //   setCurrentAudioUrl: (url: string) => void;
// //   setIsPlaying: (state: boolean) => void;
// //   setPlayer: (player: AudioPlayer | null) => void;
// //   setIsLoading: (state: boolean) => void;
// //   setCurrentTime: (time: number) => void;
// //   setDuration: (duration: number) => void;
// //   setDidJustFinish: (finished: boolean) => void;
// //   setShouldAutoPlay: (finished: boolean) => void;

// //   playAudio: () => Promise<void>;
// //   pauseAudio: () => Promise<void>;
// //   stopAndUnloadPlayer: () => Promise<void>;
// //   resetAudioState: () => void;

// //   // Favorite management actions
// //   loadFavorites: () => Promise<void>;
// //   addFavorite: (audio: AudioItem) => Promise<void>;
// //   removeFavorite: (id: string) => Promise<void>;
// //   isFavorite: (id: string) => boolean;
// // }

// // // ✅ Zustand store with both Audio + Favorites logic
// // export const useAudioStore = create<AudioState>((set, get) => ({
// //   // --- AUDIO PLAYER STATES ---
// //   audioItem: null,
// //   currentAudioUrl: null,
// //   isPlaying: false,
// //   player: null,
// //   isLoading: false,
// //   currentTime: 0,
// //   duration: 0,
// //   didJustFinish: false,
// //   shouldAutoPlay: false,

// //   // --- FAVORITES ---
// //   favorites: [],

// //   // --- AUDIO CONTROLS ---
// //   setAudioItem: (item) => set({ audioItem: item }),
// //   setCurrentAudioUrl: (url) => set({ currentAudioUrl: url }),
// //   setIsPlaying: (state) => set({ isPlaying: state }),
// //   setPlayer: (player) => set({ player }),
// //   setIsLoading: (state) => set({ isLoading: state }),
// //   setCurrentTime: (time) => set({ currentTime: time }),
// //   setDuration: (duration) => set({ duration }),
// //   setDidJustFinish: (finished) => set({ didJustFinish: finished }),
// //   setShouldAutoPlay: (value) => set({ shouldAutoPlay: value }),

// //   playAudio: async () => {
// //     const { player } = get();
// //     if (player) {
// //       try {
// //         await player.play();
// //         set({ isPlaying: true });
// //       } catch (err) {
// //         console.error("Error playing audio:", err);
// //         set({ isPlaying: false });
// //       }
// //     }
// //   },

// //   pauseAudio: async () => {
// //     const { player } = get();
// //     if (player) {
// //       try {
// //         await player.pause();
// //         set({ isPlaying: false });
// //       } catch (err) {
// //         console.error("Error pausing audio:", err);
// //       }
// //     }
// //   },

// //   stopAndUnloadPlayer: async () => {
// //     const { player } = get();
// //     if (player) {
// //       try {
// //         await player.pause();
// //         await player.remove();
// //         console.log("Previous audio stopped and removed");
// //       } catch (err) {
// //         console.error("Error stopping previous audio:", err);
// //       }
// //     }
// //     set({
// //       player: null,
// //       isPlaying: false,
// //       currentTime: 0,
// //       duration: 0,
// //     });
// //   },

// //   resetAudioState: () => {
// //     set({
// //       audioItem: null,
// //       currentAudioUrl: null,
// //       isPlaying: false,
// //       isLoading: false,
// //       currentTime: 0,
// //       duration: 0,
// //     });
// //   },

// //   // --- FAVORITES LOGIC USING ASYNC STORAGE ---
// //   loadFavorites: async () => {
// //     try {
// //       const stored = await AsyncStorage.getItem("favorites");
// //       if (stored) {
// //         const favorites = JSON.parse(stored);
// //         set({ favorites });
// //       }
// //     } catch (err) {
// //       console.error("Failed to load favorites", err);
// //     }
// //   },

// //   addFavorite: async (audio) => {
// //     try {
// //       const { favorites } = get();
// //       const exists = favorites.some((a) => a.id === audio.id);
// //       if (!exists) {
// //         const updated = [...favorites, audio];
// //         set({ favorites: updated });
// //         await AsyncStorage.setItem(
// //           "favorites",
// //           JSON.stringify(updated)
// //         );
// //       }
// //     } catch (err) {
// //       console.error("Error adding favorite:", err);
// //     }
// //   },

// //   removeFavorite: async (id) => {
// //     try {
// //       const { favorites } = get();
// //       const updated = favorites.filter((a) => a.id !== id);
// //       set({ favorites: updated });
// //       await AsyncStorage.setItem(
// //         "favorites",
// //         JSON.stringify(updated)
// //       );
// //     } catch (err) {
// //       console.error("Error removing favorite:", err);
// //     }
// //   },

// //   isFavorite: (id) => {
// //     const { favorites } = get();
// //     return favorites.some((a) => a.id === id);
// //   },
// // }));

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { AudioPlayer } from "expo-audio";
// import { create } from "zustand";
// import { audioCacheManager } from "./audioCache";

// // 🎯 Type Definitions
// interface AudioItem {
//   id: string;
//   title: string;
//   url: string;
//   reciter: string;
// }

// interface AudioState {
//   // 🎵 Current Audio Data
//   audioItem: AudioItem | null;
//   currentAudioUrl: string | null;
//   player: AudioPlayer | null;

//   // ⏯️ Playback State
//   isPlaying: boolean;
//   currentTime: number;
//   duration: number;
//   didJustFinish: boolean;
//   shouldAutoPlay: boolean;

//   // ⭐ Favorites
//   favorites: AudioItem[];

//   // 📥 Caching State
//   isCaching: boolean;
//   cachingProgress: { [id: string]: number };

//   // 🔧 Actions - Audio Control
//   setAudioItem: (item: AudioItem | null) => void;
//   setCurrentAudioUrl: (url: string | null) => void;
//   setPlayer: (player: AudioPlayer | null) => void;
//   setIsPlaying: (playing: boolean) => void;
//   setCurrentTime: (time: number) => void;
//   setDuration: (duration: number) => void;
//   setDidJustFinish: (finished: boolean) => void;
//   setShouldAutoPlay: (should: boolean) => void;

//   // 🔧 Actions - Favorites
//   loadFavorites: () => Promise<void>;
//   addFavorite: (item: AudioItem) => Promise<void>;
//   removeFavorite: (id: string) => Promise<void>;
//   isFavorite: (id: string) => boolean;

//   // 🔧 Actions - Caching
//   getCachedAudioUrl: (
//     id: string,
//     remoteUrl: string
//   ) => Promise<string>;
//   cacheAudio: (id: string, remoteUrl: string) => Promise<boolean>;
//   cacheMultipleAudios: (audios: AudioItem[]) => Promise<void>;
//   removeCachedAudio: (id: string) => Promise<boolean>;
//   clearAllCache: () => Promise<boolean>;
//   getCacheStatus: (id: string) => {
//     isCached: boolean;
//     size?: number;
//     cachedAt?: number;
//   };
//   getTotalCacheSize: () => number;
//   isAudioCached: (id: string) => boolean;

//   // 🔧 Actions - Initialization
//   initializeCache: () => Promise<void>;
// }

// // 🗂️ Storage Keys
// const FAVORITES_KEY = "audio_favorites";

// // 🏪 Zustand Store
// export const useAudioStore = create<AudioState>((set, get) => ({
//   // 📊 Initial State
//   audioItem: null,
//   currentAudioUrl: null,
//   player: null,
//   isPlaying: false,
//   currentTime: 0,
//   duration: 0,
//   didJustFinish: false,
//   shouldAutoPlay: false,
//   favorites: [],
//   isCaching: false,
//   cachingProgress: {},

//   // 🎵 Audio Control Actions
//   setAudioItem: (item) => set({ audioItem: item }),

//   setCurrentAudioUrl: (url) => set({ currentAudioUrl: url }),

//   setPlayer: (player) => set({ player }),

//   setIsPlaying: (playing) => set({ isPlaying: playing }),

//   setCurrentTime: (time) => set({ currentTime: time }),

//   setDuration: (duration) => set({ duration }),

//   setDidJustFinish: (finished) => set({ didJustFinish: finished }),

//   setShouldAutoPlay: (should) => set({ shouldAutoPlay: should }),

//   // ⭐ Favorites Actions
//   loadFavorites: async () => {
//     try {
//       const stored = await AsyncStorage.getItem(FAVORITES_KEY);
//       if (stored) {
//         const favorites = JSON.parse(stored);
//         set({ favorites });
//         console.log(`✅ Loaded ${favorites.length} favorites`);
//       }
//     } catch (error) {
//       console.error("❌ Error loading favorites:", error);
//     }
//   },

//   addFavorite: async (item) => {
//     try {
//       const { favorites } = get();

//       // Check if already exists
//       if (favorites.some((fav) => fav.id === item.id)) {
//         console.log("⚠️ Already in favorites");
//         return;
//       }

//       const newFavorites = [...favorites, item];
//       await AsyncStorage.setItem(
//         FAVORITES_KEY,
//         JSON.stringify(newFavorites)
//       );
//       set({ favorites: newFavorites });
//       console.log(`✅ Added to favorites: ${item.title}`);
//     } catch (error) {
//       console.error("❌ Error adding favorite:", error);
//     }
//   },

//   removeFavorite: async (id) => {
//     try {
//       const { favorites } = get();
//       const newFavorites = favorites.filter((fav) => fav.id !== id);
//       await AsyncStorage.setItem(
//         FAVORITES_KEY,
//         JSON.stringify(newFavorites)
//       );
//       set({ favorites: newFavorites });
//       console.log(`✅ Removed from favorites: ${id}`);
//     } catch (error) {
//       console.error("❌ Error removing favorite:", error);
//     }
//   },

//   isFavorite: (id) => {
//     const { favorites } = get();
//     return favorites.some((fav) => fav.id === id);
//   },

//   // 📥 Caching Actions
//   initializeCache: async () => {
//     try {
//       await audioCacheManager.initialize();
//       console.log("✅ Cache manager initialized");
//     } catch (error) {
//       console.error("❌ Error initializing cache:", error);
//     }
//   },

//   getCachedAudioUrl: async (id, remoteUrl) => {
//     try {
//       // Check if audio is cached and return local URI if available
//       const cachedUri = await audioCacheManager.getAudioUri(
//         id,
//         remoteUrl
//       );
//       return cachedUri;
//     } catch (error) {
//       console.error(`❌ Error getting cached audio ${id}:`, error);
//       return remoteUrl; // Fallback to remote URL
//     }
//   },

//   cacheAudio: async (id, remoteUrl) => {
//     try {
//       set((state) => ({
//         cachingProgress: { ...state.cachingProgress, [id]: 0 },
//       }));

//       const success = await audioCacheManager.cacheAudio(
//         id,
//         remoteUrl
//       );

//       if (success) {
//         set((state) => ({
//           cachingProgress: { ...state.cachingProgress, [id]: 100 },
//         }));
//         console.log(`✅ Successfully cached: ${id}`);
//       } else {
//         set((state) => {
//           const { [id]: _, ...rest } = state.cachingProgress;
//           return { cachingProgress: rest };
//         });
//       }

//       return success;
//     } catch (error) {
//       console.error(`❌ Error caching audio ${id}:`, error);
//       set((state) => {
//         const { [id]: _, ...rest } = state.cachingProgress;
//         return { cachingProgress: rest };
//       });
//       return false;
//     }
//   },

//   cacheMultipleAudios: async (audios) => {
//     set({ isCaching: true });

//     try {
//       const isOnline = await audioCacheManager.isOnline();
//       if (!isOnline) {
//         console.log("⚠️ Device is offline, cannot cache audios");
//         set({ isCaching: false });
//         return;
//       }

//       console.log(`📥 Starting batch cache: ${audios.length} audios`);

//       for (const audio of audios) {
//         if (!audioCacheManager.isCached(audio.id)) {
//           await get().cacheAudio(audio.id, audio.url);
//         }
//       }

//       console.log("✅ Batch caching complete");
//     } catch (error) {
//       console.error("❌ Error in batch caching:", error);
//     } finally {
//       set({ isCaching: false });
//     }
//   },

//   removeCachedAudio: async (id) => {
//     try {
//       const success = await audioCacheManager.removeCacheEntry(id);
//       if (success) {
//         set((state) => {
//           const { [id]: _, ...rest } = state.cachingProgress;
//           return { cachingProgress: rest };
//         });
//       }
//       return success;
//     } catch (error) {
//       console.error(`❌ Error removing cached audio ${id}:`, error);
//       return false;
//     }
//   },

//   clearAllCache: async () => {
//     try {
//       const success = await audioCacheManager.clearAllCache();
//       if (success) {
//         set({ cachingProgress: {} });
//       }
//       return success;
//     } catch (error) {
//       console.error("❌ Error clearing cache:", error);
//       return false;
//     }
//   },

//   getCacheStatus: (id) => {
//     const info = audioCacheManager.getCacheInfo(id);
//     return {
//       isCached: !!info,
//       size: info?.size,
//       cachedAt: info?.cachedAt,
//     };
//   },

//   getTotalCacheSize: () => {
//     return audioCacheManager.getTotalCacheSize();
//   },

//   isAudioCached: (id) => {
//     return audioCacheManager.isCached(id);
//   },
// }));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AudioPlayer } from "expo-audio";
import { create } from "zustand";
import { audioCacheManager } from "./audioCache";

// 🎯 Type Definitions
interface AudioItem {
  id: string;
  title: string;
  url: string;
  reciter: string;
}

interface AudioState {
  // 🎵 Current Audio Data
  audioItem: AudioItem | null;
  currentAudioUrl: string | null;
  player: AudioPlayer | null;

  // ⏯️ Playback State
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  didJustFinish: boolean;
  shouldAutoPlay: boolean;

  // ⭐ Favorites
  favorites: AudioItem[];

  // 📥 Caching State
  isCaching: boolean;
  cachingProgress: { [id: string]: number };
  isCacheInitialized: boolean;

  // 🔧 Actions - Audio Control
  setAudioItem: (item: AudioItem | null) => void;
  setCurrentAudioUrl: (url: string | null) => void;
  setPlayer: (player: AudioPlayer | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setDidJustFinish: (finished: boolean) => void;
  setShouldAutoPlay: (should: boolean) => void;

  // 🔧 Actions - Favorites
  loadFavorites: () => Promise<void>;
  addFavorite: (item: AudioItem) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;

  // 🔧 Actions - Caching
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

  // 🔧 Actions - Initialization
  initializeCache: () => Promise<void>;
  getCacheStats: () => Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
  }>;
}

// 🗂️ Storage Keys
const FAVORITES_KEY = "audio_favorites";

// 🏪 Zustand Store
export const useAudioStore = create<AudioState>((set, get) => ({
  // 📊 Initial State
  audioItem: null,
  currentAudioUrl: null,
  player: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  didJustFinish: false,
  shouldAutoPlay: false,
  favorites: [],
  isCaching: false,
  cachingProgress: {},
  isCacheInitialized: false,

  // 🎵 Audio Control Actions
  setAudioItem: (item) => set({ audioItem: item }),

  setCurrentAudioUrl: (url) => set({ currentAudioUrl: url }),

  setPlayer: (player) => set({ player }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  setDidJustFinish: (finished) => set({ didJustFinish: finished }),

  setShouldAutoPlay: (should) => set({ shouldAutoPlay: should }),

  // ⭐ Favorites Actions
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

      // Check if already exists
      if (favorites.some((fav) => fav.id === item.id)) {
        console.log("⚠️ Already in favorites");
        return;
      }

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

  isFavorite: (id) => {
    const { favorites } = get();
    return favorites.some((fav) => fav.id === id);
  },

  // 📥 Caching Actions
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
      const { isCacheInitialized } = get();

      if (!isCacheInitialized) {
        console.log("⚠️ Cache not initialized, using remote URL");
        return remoteUrl;
      }

      // Check if audio is cached and return local URI if available
      const cachedUri = await audioCacheManager.getAudioUri(
        id,
        remoteUrl
      );

      // Log cache usage
      if (cachedUri !== remoteUrl) {
        console.log(`🎯 Using cached URL for: ${id}`);
      } else {
        console.log(`🌐 Using remote URL for: ${id}`);
      }

      return cachedUri;
    } catch (error) {
      console.error(`❌ Error getting cached audio ${id}:`, error);
      return remoteUrl; // Fallback to remote URL
    }
  },

  cacheAudio: async (id, remoteUrl) => {
    try {
      const { isCacheInitialized } = get();

      if (!isCacheInitialized) {
        console.warn("⚠️ Cache not initialized, cannot cache audio");
        return false;
      }

      // Check if already cached before starting download
      const isAlreadyCached = await get().isAudioCached(id);
      if (isAlreadyCached) {
        console.log(`⏭️ Already cached, skipping: ${id}`);
        return true;
      }

      set((state) => ({
        cachingProgress: { ...state.cachingProgress, [id]: 0 },
      }));

      const success = await audioCacheManager.cacheAudio(
        id,
        remoteUrl
      );

      if (success) {
        set((state) => ({
          cachingProgress: { ...state.cachingProgress, [id]: 100 },
        }));
        console.log(`✅ Successfully cached: ${id}`);
      } else {
        set((state) => {
          const { [id]: _, ...rest } = state.cachingProgress;
          return { cachingProgress: rest };
        });
      }

      return success;
    } catch (error) {
      console.error(`❌ Error caching audio ${id}:`, error);
      set((state) => {
        const { [id]: _, ...rest } = state.cachingProgress;
        return { cachingProgress: rest };
      });
      return false;
    }
  },

  cacheMultipleAudios: async (audios) => {
    set({ isCaching: true });

    try {
      const isOnline = await audioCacheManager.isOnline();
      if (!isOnline) {
        console.log("⚠️ Device is offline, cannot cache audios");
        set({ isCaching: false });
        return;
      }

      console.log(`📥 Starting batch cache: ${audios.length} audios`);

      let cachedCount = 0;
      for (const audio of audios) {
        // Use async check to avoid duplicate downloads
        if (!(await get().isAudioCached(audio.id))) {
          const success = await get().cacheAudio(audio.id, audio.url);
          if (success) cachedCount++;
        } else {
          cachedCount++;
        }
      }

      console.log(
        `✅ Batch caching complete: ${cachedCount}/${audios.length} audios cached`
      );
    } catch (error) {
      console.error("❌ Error in batch caching:", error);
    } finally {
      set({ isCaching: false });
    }
  },

  removeCachedAudio: async (id) => {
    try {
      const success = await audioCacheManager.removeCacheEntry(id);
      if (success) {
        set((state) => {
          const { [id]: _, ...rest } = state.cachingProgress;
          return { cachingProgress: rest };
        });
      }
      return success;
    } catch (error) {
      console.error(`❌ Error removing cached audio ${id}:`, error);
      return false;
    }
  },

  clearAllCache: async () => {
    try {
      const success = await audioCacheManager.clearAllCache();
      if (success) {
        set({ cachingProgress: {} });
      }
      return success;
    } catch (error) {
      console.error("❌ Error clearing cache:", error);
      return false;
    }
  },

  getCacheStatus: (id) => {
    const info = audioCacheManager.getCacheInfo(id);
    return {
      isCached: !!info,
      size: info?.size,
      cachedAt: info?.cachedAt,
    };
  },

  getTotalCacheSize: () => {
    return audioCacheManager.getTotalCacheSize();
  },

  // Async version that properly checks file existence
  isAudioCached: async (id) => {
    return await audioCacheManager.isCachedAndValid(id);
  },

  // Sync version for quick checks (metadata only)
  isAudioCachedSync: (id) => {
    return audioCacheManager.isCached(id);
  },

  // Get cache statistics
  getCacheStats: async () => {
    return await audioCacheManager.getCacheStats();
  },
}));
