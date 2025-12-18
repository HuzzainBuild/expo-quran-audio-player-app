// musicContolService.ts
import { artwork } from "@/constant/images";
import { Platform } from "react-native";
import MusicControl, { Command } from "react-native-music-control";

interface MusicControlConfig {
  title: string;
  artist: string;
  artwork: string;
  duration: number;
  isPlaying: boolean;
  elapsedTime?: number;
}

class MusicControlService {
  private isInitialized = false;
  private storeRef: any = null;

  setStoreRef(storeRef: any) {
    this.storeRef = storeRef;
    console.log("✅ Store reference set for music control");
  }

  initialize() {
    if (this.isInitialized) {
      console.log("⚠️ Music Control already initialized");
      return;
    }

    try {
      MusicControl.enableControl("play", true);
      MusicControl.enableControl("pause", true);
      MusicControl.enableControl("nextTrack", true);
      MusicControl.enableControl("previousTrack", true);
      MusicControl.enableControl("seek", true);
      MusicControl.enableControl("skipForward", false);
      MusicControl.enableControl("skipBackward", false);

      if (Platform.OS === "android") {
        MusicControl.enableControl("closeNotification", true, {
          when: "paused",
        });
      }

      MusicControl.on(Command.play, async () => {
        console.log("🎵 Music Control: Play command");
        if (this.storeRef) {
          const { player, setIsPlaying } = this.storeRef.getState();
          if (player) {
            try {
              await player.play();
              setIsPlaying(true);
              console.log("✅ Play successful");
            } catch (err) {
              console.error("❌ Error playing:", err);
            }
          }
        }
      });

      MusicControl.on(Command.pause, async () => {
        console.log("⏸️ Music Control: Pause command");
        if (this.storeRef) {
          const { player, setIsPlaying } = this.storeRef.getState();
          if (player) {
            try {
              await player.pause();
              setIsPlaying(false);
              console.log("✅ Pause successful");
            } catch (err) {
              console.error("❌ Error pausing:", err);
            }
          }
        }
      });

      MusicControl.on(Command.nextTrack, async () => {
        console.log("⏭️ Music Control: Next track command");
        if (this.storeRef) {
          const state = this.storeRef.getState();
          await this.handleNext(state);
        }
      });

      MusicControl.on(Command.previousTrack, async () => {
        console.log("⏮️ Music Control: Previous track command");
        if (this.storeRef) {
          const state = this.storeRef.getState();
          await this.handlePrevious(state);
        }
      });

      MusicControl.on(Command.seek, async (position: number) => {
        console.log("🔍 Music Control: Seek to", position);
        if (this.storeRef) {
          const { player } = this.storeRef.getState();
          if (player) {
            try {
              await player.seekTo(position);
              console.log("✅ Seek successful");
            } catch (err) {
              console.error("❌ Error seeking:", err);
            }
          }
        }
      });

      if (Platform.OS === "ios") {
        MusicControl.on(Command.closeNotification, () => {
          console.log("❌ Close notification");
          this.resetControls();
        });
      }

      this.isInitialized = true;
      console.log("✅ Music Control initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing Music Control:", error);
    }
  }

  /**
   * Handle next track based on active screen
   */
  private async handleNext(state: any) {
    const {
      audioItem,
      player,
      isPlaying,
      activeScreen,
      favorites,
      setAudioItem,
      setCurrentAudioUrl,
      setIsPlaying,
      setShouldAutoPlay,
      getCachedAudioUrl,
    } = state;

    if (!audioItem) return;

    let list: any[] = [];

    if (activeScreen === "favorites") {
      list = [...favorites].sort((a: any, b: any) =>
        a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        })
      );
    } else {
      const { quranAudioList } = require("@/constant/quranAudioList");
      list = quranAudioList;
    }

    const currentIndex = list.findIndex(
      (item: any) => item.id === audioItem.id
    );

    if (currentIndex === -1 || currentIndex === list.length - 1) {
      console.log("✅ End of list reached");
      return;
    }

    const nextAudio = list[currentIndex + 1];

    if (player && isPlaying) {
      await player.pause();
      await player.seekTo(0);
      setIsPlaying(false);
    }

    setAudioItem(nextAudio);

    try {
      const nextAudioUri = await getCachedAudioUrl(
        nextAudio.id,
        nextAudio.url
      );
      setCurrentAudioUrl(nextAudioUri);
      setShouldAutoPlay(true);
      console.log(`✅ Switched to: ${nextAudio.title}`);
    } catch (error) {
      console.error("❌ Error switching track:", error);
      setCurrentAudioUrl(nextAudio.url);
      setShouldAutoPlay(true);
    }
  }

  /**
   * Handle previous track based on active screen
   */
  private async handlePrevious(state: any) {
    const {
      audioItem,
      player,
      isPlaying,
      activeScreen,
      favorites,
      setAudioItem,
      setCurrentAudioUrl,
      setIsPlaying,
      setShouldAutoPlay,
      getCachedAudioUrl,
    } = state;

    if (!audioItem) return;

    let list: any[] = [];

    if (activeScreen === "favorites") {
      list = [...favorites].sort((a: any, b: any) =>
        a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        })
      );
    } else {
      const { quranAudioList } = require("@/constant/quranAudioList");
      list = quranAudioList;
    }

    const currentIndex = list.findIndex(
      (item: any) => item.id === audioItem.id
    );

    if (currentIndex === -1 || currentIndex === 0) {
      console.log("✅ Start of list reached");
      return;
    }

    const prevAudio = list[currentIndex - 1];

    if (player && isPlaying) {
      await player.pause();
      await player.seekTo(0);
      setIsPlaying(false);
    }

    setAudioItem(prevAudio);

    try {
      const prevAudioUri = await getCachedAudioUrl(
        prevAudio.id,
        prevAudio.url
      );
      setCurrentAudioUrl(prevAudioUri);
      setShouldAutoPlay(true);
      console.log(`✅ Switched to: ${prevAudio.title}`);
    } catch (error) {
      console.error("❌ Error switching track:", error);
      setCurrentAudioUrl(prevAudio.url);
      setShouldAutoPlay(true);
    }
  }

  updateNowPlaying(config: MusicControlConfig) {
    try {
      MusicControl.setNowPlaying({
        title: config.title,
        artist: config.artist,
        duration: config.duration,
        artwork: artwork,
        elapsedTime: config.elapsedTime || 0,

        ...(Platform.OS === "ios" && {
          color: 0x22946e,
        }),

        ...(Platform.OS === "android" && {
          isLiveStream: false,
          notificationIcon: "ic_notification",
        }),
      });

      MusicControl.updatePlayback({
        state: config.isPlaying
          ? MusicControl.STATE_PLAYING
          : MusicControl.STATE_PAUSED,
        elapsedTime: config.elapsedTime || 0,
      });
    } catch (error) {
      console.error("❌ Error updating now playing:", error);
    }
  }

  /**
   * Update playback state only
   */
  updatePlaybackState(isPlaying: boolean, elapsedTime: number = 0) {
    try {
      MusicControl.updatePlayback({
        state: isPlaying
          ? MusicControl.STATE_PLAYING
          : MusicControl.STATE_PAUSED,
        elapsedTime,
      });
    } catch (error) {
      console.error("❌ Error updating playback state:", error);
    }
  }

  /**
   * Reset controls when audio finishes
   */
  resetControls() {
    try {
      MusicControl.resetNowPlaying();
    } catch (error) {
      console.error("❌ Error resetting controls:", error);
    }
  }

  /**
   * Stop and cleanup music control
   */
  stopControl() {
    try {
      MusicControl.stopControl();
      this.isInitialized = false;
      console.log("✅ Music Control stopped");
    } catch (error) {
      console.error("❌ Error stopping Music Control:", error);
    }
  }

  /**
   * Remove all event listeners
   */
  removeListeners() {
    try {
      MusicControl.off(Command.play);
      MusicControl.off(Command.pause);
      MusicControl.off(Command.nextTrack);
      MusicControl.off(Command.previousTrack);
      MusicControl.off(Command.seek);
      MusicControl.off(Command.closeNotification);

      console.log("✅ Music Control listeners removed");
    } catch (error) {
      console.error("❌ Error removing listeners:", error);
    }
  }
}

export const musicControlService = new MusicControlService();
export type { MusicControlConfig };
