// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Directory, File, Paths } from "expo-file-system";
// import * as Network from "expo-network";

// // 🎯 Type Definitions
// interface CacheEntry {
//   id: string;
//   url: string;
//   localUri: string;
//   cachedAt: number;
//   size: number;
// }

// interface CacheMetadata {
//   [audioId: string]: CacheEntry;
// }

// interface DownloadProgress {
//   id: string;
//   progress: number; // 0-100
//   isDownloading: boolean;
// }

// // 🗂️ Storage Keys
// const CACHE_METADATA_KEY = "audio_cache_metadata";
// const CACHE_DIR = new Directory(Paths.document, "audio_cache");

// // 📦 Audio Cache Manager Class
// class AudioCacheManager {
//   private metadata: CacheMetadata = {};
//   private downloadCallbacks: Map<
//     string,
//     (progress: DownloadProgress) => void
//   > = new Map();

//   async initialize(): Promise<void> {
//     try {
//       if (!CACHE_DIR.exists) {
//         CACHE_DIR.create();
//         console.log("✅ Cache directory created");
//       }

//       const stored = await AsyncStorage.getItem(CACHE_METADATA_KEY);
//       if (stored) {
//         this.metadata = JSON.parse(stored);
//         console.log(
//           `✅ Loaded cache metadata: ${Object.keys(this.metadata).length} files`
//         );
//       }
//     } catch (error) {
//       console.error("❌ Error initializing cache:", error);
//     }
//   }

//   async getAudioUri(id: string, remoteUrl: string): Promise<string> {
//     const cached = this.metadata[id];

//     if (cached) {
//       const file = new File(cached.localUri);
//       if (file.exists) {
//         console.log(`✅ Using cached audio: ${id}`);
//         return cached.localUri;
//       } else {
//         console.warn(`⚠️ Cached file missing: ${id}`);
//         await this.removeCacheEntry(id);
//       }
//     }

//     console.log(`🌐 Using remote audio: ${id}`);
//     return remoteUrl;
//   }

//   async cacheAudio(id: string, remoteUrl: string): Promise<boolean> {
//     if (this.isCached(id)) {
//       console.log(`⏭️ Already cached: ${id}`);
//       return true;
//     }

//     try {
//       const file = new File(CACHE_DIR, `${id}.mp3`);

//       // Download file (no progress tracking in latest API)
//       const output = await File.downloadFileAsync(remoteUrl, file);

//       if (!output.exists) {
//         throw new Error("Download failed");
//       }

//       const size = output.size ?? 0;

//       const entry: CacheEntry = {
//         id,
//         url: remoteUrl,
//         localUri: output.uri,
//         cachedAt: Date.now(),
//         size,
//       };

//       this.metadata[id] = entry;
//       await this.saveMetadata();

//       console.log(
//         `✅ Cached audio: ${id} (${(size / 1024 / 1024).toFixed(2)}MB)`
//       );
//       return true;
//     } catch (error) {
//       console.error(`❌ Error caching audio ${id}:`, error);
//       return false;
//     }
//   }

//   isCached(id: string): boolean {
//     return !!this.metadata[id];
//   }

//   getCacheInfo(id: string): CacheEntry | null {
//     return this.metadata[id] || null;
//   }

//   getCachedAudioIds(): string[] {
//     return Object.keys(this.metadata);
//   }

//   getTotalCacheSize(): number {
//     return Object.values(this.metadata).reduce(
//       (total, entry) => total + entry.size,
//       0
//     );
//   }

//   async removeCacheEntry(id: string): Promise<boolean> {
//     try {
//       const entry = this.metadata[id];
//       if (!entry) return false;

//       const file = new File(entry.localUri);
//       if (file.exists) {
//         file.delete();
//       }

//       delete this.metadata[id];
//       await this.saveMetadata();

//       console.log(`✅ Removed cached audio: ${id}`);
//       return true;
//     } catch (error) {
//       console.error(`❌ Error removing cache ${id}:`, error);
//       return false;
//     }
//   }

//   async clearAllCache(): Promise<boolean> {
//     try {
//       if (CACHE_DIR.exists) {
//         CACHE_DIR.delete();
//         CACHE_DIR.create();
//       }

//       this.metadata = {};
//       await AsyncStorage.removeItem(CACHE_METADATA_KEY);

//       console.log("✅ All cache cleared");
//       return true;
//     } catch (error) {
//       console.error("❌ Error clearing cache:", error);
//       return false;
//     }
//   }

//   async isOnline(): Promise<boolean> {
//     try {
//       const networkState = await Network.getNetworkStateAsync();
//       return networkState.isConnected === true;
//     } catch (error) {
//       console.error("Error checking network:", error);
//       return false;
//     }
//   }

//   private async saveMetadata(): Promise<void> {
//     try {
//       await AsyncStorage.setItem(
//         CACHE_METADATA_KEY,
//         JSON.stringify(this.metadata)
//       );
//     } catch (error) {
//       console.error("Error saving cache metadata:", error);
//     }
//   }

//   async preloadAudios(
//     audios: Array<{ id: string; url: string }>
//   ): Promise<void> {
//     const isOnline = await this.isOnline();
//     if (!isOnline) {
//       console.log("⚠️ Offline, skipping preload");
//       return;
//     }

//     console.log(`📥 Preloading ${audios.length} audios...`);

//     for (const audio of audios) {
//       if (!this.isCached(audio.id)) {
//         await this.cacheAudio(audio.id, audio.url);
//       }
//     }

//     console.log("✅ Preload complete");
//   }
// }

// // 🌐 Export singleton instance
// export const audioCacheManager = new AudioCacheManager();

// // Export types
// export type { CacheEntry, CacheMetadata, DownloadProgress };

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";

// Type Definitions
interface CacheEntry {
  id: string;
  url: string;
  localUri: string;
  cachedAt: number;
  size: number;
}

interface CacheMetadata {
  [audioId: string]: CacheEntry;
}

// Storage Keys
const CACHE_METADATA_KEY = "audio_cache_metadata";
const CACHE_DIR = new Directory(Paths.document, "audio_cache");

class AudioCacheManager {
  private metadata: CacheMetadata = {};
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      if (!CACHE_DIR.exists) {
        CACHE_DIR.create();
        console.log("✅ Cache directory created");
      }
      const stored = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      this.metadata = stored ? JSON.parse(stored) : {};
      this.isInitialized = true;
      console.log("🎯 Audio Cache Manager initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing cache:", error);
      this.isInitialized = false;
    }
  }

  async getAudioUri(id: string, remoteUrl: string): Promise<string> {
    if (!this.isInitialized) return remoteUrl;
    const cached = this.metadata[id];
    if (cached) {
      const file = new File(cached.localUri);
      if (file.exists && file.size > 0) {
        return cached.localUri;
      } else {
        await this.removeCacheEntry(id);
      }
    }
    return remoteUrl;
  }

  async cacheAudio(id: string, remoteUrl: string): Promise<boolean> {
    if (!this.isInitialized) return false;
    if (await this.isCachedAndValid(id)) return true;
    try {
      const file = new File(CACHE_DIR, `${id}.mp3`);
      if (file.exists) file.delete();
      const output = await File.downloadFileAsync(remoteUrl, file);
      if (!output.exists || output.size === 0)
        throw new Error("Download failed");
      const entry: CacheEntry = {
        id,
        url: remoteUrl,
        localUri: output.uri,
        cachedAt: Date.now(),
        size: output.size,
      };
      this.metadata[id] = entry;
      await this.saveMetadata();
      return true;
    } catch (error) {
      const file = new File(CACHE_DIR, `${id}.mp3`);
      if (file.exists) file.delete();
      delete this.metadata[id];
      await this.saveMetadata();
      return false;
    }
  }

  async isCachedAndValid(id: string): Promise<boolean> {
    if (!this.isInitialized) return false;
    const cached = this.metadata[id];
    if (!cached) return false;
    const file = new File(cached.localUri);
    return file.exists && file.size > 0;
  }

  async removeCacheEntry(id: string): Promise<boolean> {
    const entry = this.metadata[id];
    if (!entry) return false;
    const file = new File(entry.localUri);
    if (file.exists) file.delete();
    delete this.metadata[id];
    await this.saveMetadata();
    return true;
  }

  async clearAllCache(): Promise<boolean> {
    if (CACHE_DIR.exists) {
      CACHE_DIR.delete();
      CACHE_DIR.create();
    }
    this.metadata = {};
    await AsyncStorage.removeItem(CACHE_METADATA_KEY);
    return true;
  }

  private async saveMetadata(): Promise<void> {
    await AsyncStorage.setItem(
      CACHE_METADATA_KEY,
      JSON.stringify(this.metadata)
    );
  }
}

export const audioCacheManager = new AudioCacheManager();
export type { CacheEntry, CacheMetadata };
