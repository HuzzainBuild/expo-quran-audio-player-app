// import MusicControl, { Command } from "react-native-music-control";

// interface AudioMetadata {
//   title: string;
//   artist: string;
//   artwork?: string;
//   duration: number;
//   elapsedTime: number;
// }

// class MusicControlService {
//   private isInitialized = false;

//   async initialize() {
//     if (this.isInitialized) return;

//     try {
//       MusicControl.enableBackgroundMode(true);

//       MusicControl.enableControl("play", true);
//       MusicControl.enableControl("pause", true);
//       MusicControl.enableControl("nextTrack", true);
//       MusicControl.enableControl("previousTrack", true);
//       MusicControl.enableControl("seekForward", false);
//       MusicControl.enableControl("seekBackward", false);
//       MusicControl.enableControl("seek", true);
//       MusicControl.enableControl("skipForward", false);
//       MusicControl.enableControl("skipBackward", false);
//       MusicControl.enableControl("closeNotification", true, {
//         when: "paused",
//       });

//       this.isInitialized = true;
//       console.log("✅ Music Control initialized");
//     } catch (error) {
//       console.error("❌ Error initializing Music Control:", error);
//     }
//   }

//   updateNowPlaying(metadata: AudioMetadata) {
//     if (!this.isInitialized) return;

//     try {
//       MusicControl.setNowPlaying({
//         title: metadata.title,
//         artwork: metadata.artwork || "",
//         artist: metadata.artist,
//         duration: metadata.duration,
//         elapsedTime: metadata.elapsedTime,
//         color: 0x22946e,
//         notificationIcon: "ic_launcher",
//       });
//     } catch (error) {
//       console.error("❌ Error updating now playing:", error);
//     }
//   }

//   updatePlayback(
//     isPlaying: boolean,
//     currentTime: number,
//     playbackRate: number = 1.0
//   ) {
//     if (!this.isInitialized) return;

//     try {
//       MusicControl.updatePlayback({
//         state: isPlaying
//           ? MusicControl.STATE_PLAYING
//           : MusicControl.STATE_PAUSED,
//         elapsedTime: currentTime,
//         speed: playbackRate,
//       });
//     } catch (error) {
//       console.error("❌ Error updating playback:", error);
//     }
//   }

//   resetNowPlaying() {
//     if (!this.isInitialized) return;

//     try {
//       MusicControl.resetNowPlaying();
//       MusicControl.stopControl();
//     } catch (error) {
//       console.error("❌ Error resetting now playing:", error);
//     }
//   }

//   destroy() {
//     if (!this.isInitialized) return;

//     try {
//       MusicControl.stopControl();
//       this.isInitialized = false;
//       console.log("✅ Music Control destroyed");
//     } catch (error) {
//       console.error("❌ Error destroying Music Control:", error);
//     }
//   }

//   on(command: Command, handler: () => void) {
//     if (!this.isInitialized) return;
//     MusicControl.on(command, handler);
//   }

//   off(command: Command, handler: () => void) {
//     if (!this.isInitialized) return;
//     MusicControl.off(command, handler);
//   }
// }

// export const musicControlService = new MusicControlService();

import MusicControl, { Command } from "react-native-music-control";

interface AudioMetadata {
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  elapsedTime: number;
}

class MusicControlService {
  private isInitialized = false;
  private currentMetadata: AudioMetadata | null = null;
  private currentPlaybackState: {
    isPlaying: boolean;
    currentTime: number;
  } | null = null;
  private initializationPromise: Promise<void> | null = null;
  private commandHandlers: Map<Command, Set<() => void>> = new Map();

  async initialize(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.isInitialized) {
      return Promise.resolve();
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      // Enable background mode first
      await MusicControl.enableBackgroundMode(true);

      // Configure controls
      MusicControl.enableControl("play", true);
      MusicControl.enableControl("pause", true);
      MusicControl.enableControl("nextTrack", true);
      MusicControl.enableControl("previousTrack", true);
      MusicControl.enableControl("seek", true);
      MusicControl.enableControl("skipForward", false);
      MusicControl.enableControl("skipBackward", false);
      MusicControl.enableControl("closeNotification", true, {
        when: "paused",
      });

      this.isInitialized = true;
      console.log("✅ Music Control initialized");
    } catch (error) {
      console.error("❌ Error initializing Music Control:", error);
      this.isInitialized = false;
      throw error;
    } finally {
      this.initializationPromise = null;
    }
  }

  updateNowPlaying(metadata: AudioMetadata): void {
    if (!this.isInitialized) {
      console.warn(
        "⚠️ Music Control not initialized, queuing metadata update"
      );
      this.initialize().then(() => this.updateNowPlaying(metadata));
      return;
    }

    // Skip if metadata hasn't changed
    if (
      this.currentMetadata &&
      this.currentMetadata.title === metadata.title &&
      this.currentMetadata.artist === metadata.artist &&
      Math.abs(this.currentMetadata.duration - metadata.duration) < 1
    ) {
      return;
    }

    try {
      MusicControl.setNowPlaying({
        title: metadata.title,
        artwork: metadata.artwork || "",
        artist: metadata.artist,
        duration: metadata.duration,
        elapsedTime: metadata.elapsedTime,
        color: 0x22946e,
        notificationIcon: "ic_launcher",
      });

      this.currentMetadata = { ...metadata };
      console.log(`🎵 Updated Now Playing: ${metadata.title}`);
    } catch (error) {
      console.error("❌ Error updating now playing:", error);
      // Attempt to reinitialize on error
      this.handleError();
    }
  }

  updatePlayback(
    isPlaying: boolean,
    currentTime: number,
    playbackRate: number = 1.0
  ): void {
    if (!this.isInitialized) {
      console.warn(
        "⚠️ Music Control not initialized, skipping playback update"
      );
      return;
    }

    // Skip redundant updates
    if (
      this.currentPlaybackState &&
      this.currentPlaybackState.isPlaying === isPlaying &&
      Math.abs(this.currentPlaybackState.currentTime - currentTime) <
        1
    ) {
      return;
    }

    try {
      MusicControl.updatePlayback({
        state: isPlaying
          ? MusicControl.STATE_PLAYING
          : MusicControl.STATE_PAUSED,
        elapsedTime: currentTime,
        speed: playbackRate,
      });

      this.currentPlaybackState = { isPlaying, currentTime };
    } catch (error) {
      console.error("❌ Error updating playback:", error);
      this.handleError();
    }
  }

  resetNowPlaying(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      MusicControl.resetNowPlaying();
      this.currentMetadata = null;
      this.currentPlaybackState = null;
      console.log("🔄 Reset Now Playing");
    } catch (error) {
      console.error("❌ Error resetting now playing:", error);
    }
  }

  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Remove all command handlers
      this.commandHandlers.forEach((handlers, command) => {
        handlers.forEach((handler) => {
          MusicControl.off(command, handler);
        });
      });
      this.commandHandlers.clear();

      MusicControl.stopControl();
      this.isInitialized = false;
      1;
      this.currentMetadata = null;
      this.currentPlaybackState = null;
      console.log("✅ Music Control destroyed");
    } catch (error) {
      console.error("❌ Error destroying Music Control:", error);
    }
  }

  on(command: Command, handler: () => void): void {
    if (!this.isInitialized) {
      console.warn(
        "⚠️ Music Control not initialized, handler will be registered after init"
      );
      this.initialize().then(() => this.on(command, handler));
      return;
    }

    try {
      MusicControl.on(command, handler);

      // Track handlers for cleanup
      if (!this.commandHandlers.has(command)) {
        this.commandHandlers.set(command, new Set());
      }
      this.commandHandlers.get(command)!.add(handler);
    } catch (error) {
      console.error(
        `❌ Error registering handler for ${command}:`,
        error
      );
    }
  }

  off(command: Command, handler: () => void): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      MusicControl.off(command, handler);

      // Remove from tracked handlers
      const handlers = this.commandHandlers.get(command);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.commandHandlers.delete(command);
        }
      }
    } catch (error) {
      console.error(
        `❌ Error removing handler for ${command}:`,
        error
      );
    }
  }

  private handleError(): void {
    // Reset state and attempt to reinitialize
    this.isInitialized = false;
    this.currentMetadata = null;
    this.currentPlaybackState = null;

    console.log("🔄 Attempting to reinitialize Music Control...");
    this.initialize().catch((err) => {
      console.error("❌ Failed to reinitialize Music Control:", err);
    });
  }

  // Get current state for debugging
  getState() {
    return {
      isInitialized: this.isInitialized,
      currentMetadata: this.currentMetadata,
      currentPlaybackState: this.currentPlaybackState,
      activeHandlers: Array.from(this.commandHandlers.entries()).map(
        ([command, handlers]) => ({
          command,
          count: handlers.size,
        })
      ),
    };
  }
}

export const musicControlService = new MusicControlService();
