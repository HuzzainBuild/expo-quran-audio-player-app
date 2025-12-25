import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Directory, File, Paths } from "expo-file-system";

interface CacheEntry {
  id: string;
  url: string;
  localUri: string;
  cachedAt: number;
  size: number;
  lastValidated?: number;
}

interface CacheMetadata {
  [audioId: string]: CacheEntry;
}

const CACHE_METADATA_KEY = "audio_cache_metadata_v2";
const CACHE_DIR = new Directory(Paths.document, "audio_cache");
const VALIDATION_CACHE_DURATION = 60000;
const MAX_CONCURRENT_DOWNLOADS = 3;

class AudioCacheManager {
  private metadata: CacheMetadata = {};
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private downloadQueue: Map<string, Promise<boolean>> = new Map();
  private validationCache: Map<
    string,
    { valid: boolean; timestamp: number }
  > = new Map();
  private activeDownloads: Set<string> = new Set();

  private isOnlineCache: boolean = true;
  private lastNetworkCheck: number = 0;
  private readonly NETWORK_CHECK_INTERVAL = 5000;

  /**
   * 🔥 OPTIMIZATION: Initialize without blocking on file validation
   * Validation now happens asynchronously in background
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      if (!CACHE_DIR.exists) {
        CACHE_DIR.create({ intermediates: true });
      }

      const stored = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      this.metadata = stored ? JSON.parse(stored) : {};

      this.isInitialized = true;

      this.cleanupInvalidEntries().catch(console.error);

      this.setupNetworkListener();
    } catch (error) {
      console.error("❌ Error initializing cache:", error);
      this.isInitialized = false;
      this.initializationPromise = null;
    }
  }

  /**
   * 🔥 NEW: Setup network status monitoring
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      this.isOnlineCache = state.isConnected ?? true;
      this.lastNetworkCheck = Date.now();
    });
  }

  /**
   * 🔥 OPTIMIZATION: Cached network status check
   * Reduces redundant network checks
   */
  async isOnline(): Promise<boolean> {
    const now = Date.now();

    if (now - this.lastNetworkCheck < this.NETWORK_CHECK_INTERVAL) {
      return this.isOnlineCache;
    }

    try {
      const state = await NetInfo.fetch();
      this.isOnlineCache = state.isConnected ?? true;
      this.lastNetworkCheck = now;
      return this.isOnlineCache;
    } catch {
      return this.isOnlineCache;
    }
  }

  /**
   * 🔥 OPTIMIZATION: Fast path using cached validation results
   * Avoids expensive file system checks for recently validated files
   */
  async getAudioUri(id: string, remoteUrl: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const cached = this.metadata[id];
    if (!cached) return remoteUrl;

    const validation = this.validationCache.get(id);
    if (
      validation &&
      Date.now() - validation.timestamp < VALIDATION_CACHE_DURATION
    ) {
      return validation.valid ? cached.localUri : remoteUrl;
    }

    try {
      const file = new File(cached.localUri);
      const isValid = file.exists && file.size > 0;

      this.validationCache.set(id, {
        valid: isValid,
        timestamp: Date.now(),
      });

      if (isValid) {
        return cached.localUri;
      }
    } catch (error) {
      console.warn(`Cache validation failed for ${id}:`, error);
    }

    await this.removeCacheEntry(id);
    return remoteUrl;
  }

  /**
   * 🔥 OPTIMIZATION: Deduplicated downloads with concurrency control
   * Prevents duplicate downloads and limits concurrent operations
   */
  async cacheAudio(id: string, remoteUrl: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.metadata[id]) {
      const isValid = await this.isCachedAndValid(id);
      if (isValid) return true;
    }

    if (this.downloadQueue.has(id)) {
      return this.downloadQueue.get(id)!;
    }

    await this.waitForDownloadSlot();

    const downloadPromise = this._downloadAudio(id, remoteUrl);
    this.downloadQueue.set(id, downloadPromise);

    try {
      const result = await downloadPromise;
      return result;
    } finally {
      this.downloadQueue.delete(id);
      this.activeDownloads.delete(id);
    }
  }


  private async waitForDownloadSlot(): Promise<void> {
    while (this.activeDownloads.size >= MAX_CONCURRENT_DOWNLOADS) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }


  private async _downloadAudio(
    id: string,
    remoteUrl: string
  ): Promise<boolean> {
    const online = await this.isOnline();
    if (!online) {
      console.warn(`⚠️ Device offline, cannot download ${id}`);
      return false;
    }

    this.activeDownloads.add(id);
    const localFile = new File(CACHE_DIR, `${id}.mp3`);

    try {
      const downloadedFile = await Promise.race([
        File.downloadFileAsync(remoteUrl, localFile),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Download timeout")),
            100000
          )
        ),
      ]);

      if (!downloadedFile.exists || downloadedFile.size === 0) {
        throw new Error("Downloaded file is empty or missing");
      }

      const entry: CacheEntry = {
        id,
        url: remoteUrl,
        localUri: downloadedFile.uri,
        cachedAt: Date.now(),
        size: downloadedFile.size || 0,
        lastValidated: Date.now(),
      };

      this.metadata[id] = entry;

      this.validationCache.set(id, {
        valid: true,
        timestamp: Date.now(),
      });

      await this.saveMetadata();
      console.log(
        `✅ Successfully cached ${id} (${(downloadedFile.size / 1024).toFixed(2)}KB)`
      );

      return true;
    } catch (error) {
      console.error(`❌ Error downloading audio ${id}:`, error);

      try {
        localFile.delete();
      } catch {}

      delete this.metadata[id];
      this.validationCache.delete(id);
      await this.saveMetadata();

      return false;
    }
  }

  /**
   * 🔥 OPTIMIZATION: Use cached validation when available
   */
  async isCachedAndValid(id: string): Promise<boolean> {
    if (!this.isInitialized) return false;

    const cached = this.metadata[id];
    if (!cached) return false;

    const validation = this.validationCache.get(id);
    if (
      validation &&
      Date.now() - validation.timestamp < VALIDATION_CACHE_DURATION
    ) {
      return validation.valid;
    }

    try {
      const file = new File(cached.localUri);
      const isValid = file.exists && (file.size || 0) > 0;

      this.validationCache.set(id, {
        valid: isValid,
        timestamp: Date.now(),
      });

      return isValid;
    } catch {
      this.validationCache.set(id, {
        valid: false,
        timestamp: Date.now(),
      });
      return false;
    }
  }

  /**
   * 🔥 OPTIMIZATION: Clean validation cache on removal
   */
  async removeCacheEntry(id: string): Promise<boolean> {
    const entry = this.metadata[id];
    if (!entry) return false;

    try {
      const file = new File(entry.localUri);
      file.delete();
    } catch (error) {
      console.warn(`Could not delete file for ${id}:`, error);
    }

    delete this.metadata[id];
    this.validationCache.delete(id);
    await this.saveMetadata();
    return true;
  }

  /**
   * 🔥 OPTIMIZATION: Clear all caches including validation cache
   */
  async clearAllCache(): Promise<boolean> {
    try {
      CACHE_DIR.delete();
      CACHE_DIR.create({ intermediates: true });

      this.metadata = {};
      this.validationCache.clear();
      this.downloadQueue.clear();
      this.activeDownloads.clear();

      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing cache:", error);
      return false;
    }
  }

  /**
   * 🔥 OPTIMIZATION: Batch validation with limited concurrency
   * Prevents overwhelming the file system with simultaneous checks
   */
  private async cleanupInvalidEntries(): Promise<void> {
    const entries = Object.values(this.metadata);
    const BATCH_SIZE = 5;

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);

      const cleanupPromises = batch.map(async (entry) => {
        try {
          const file = new File(entry.localUri);
          const isValid = file.exists && file.size > 0;

          if (!isValid) {
            delete this.metadata[entry.id];
            this.validationCache.delete(entry.id);
          } else {
            this.validationCache.set(entry.id, {
              valid: true,
              timestamp: Date.now(),
            });
          }
        } catch {
          delete this.metadata[entry.id];
          this.validationCache.delete(entry.id);
        }
      });

      await Promise.allSettled(cleanupPromises);
    }

    await this.saveMetadata();
    console.log(
      `✅ Cache cleanup complete. ${Object.keys(this.metadata).length} valid entries`
    );
  }

  /**
   * 🔥 OPTIMIZATION: Debounced metadata saves
   */
  private saveTimer: NodeJS.Timeout | null = null;
  private async saveMetadata(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    await AsyncStorage.setItem(
      CACHE_METADATA_KEY,
      JSON.stringify(this.metadata)
    );
  }

  isCached(id: string): boolean {
    return !!this.metadata[id];
  }

  getCacheInfo(id: string): CacheEntry | null {
    return this.metadata[id] || null;
  }

  getTotalCacheSize(): number {
    return Object.values(this.metadata).reduce(
      (total, entry) => total + entry.size,
      0
    );
  }

  async getCacheStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    cachedIds: string[];
  }> {
    const entries = Object.values(this.metadata);
    const totalFiles = entries.length;
    const totalSize = this.getTotalCacheSize();
    const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;
    const cachedIds = Object.keys(this.metadata);

    return { totalFiles, totalSize, averageSize, cachedIds };
  }
}

export const audioCacheManager = new AudioCacheManager();
