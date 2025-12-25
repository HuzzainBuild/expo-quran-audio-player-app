import { artwork } from "@/constant/images";
import { Platform } from "react-native";
import MusicControl, { Command } from "react-native-music-control";

interface MusicControlConfig {
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  isPlaying: boolean;
  elapsedTime?: number;
}

class MusicControlManager {
  private isInitialized = false;

  initialize(commandHandlers: {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onSeek: (position: number) => void;
  }) {
    if (this.isInitialized) return;

    try {
      MusicControl.enableControl("play", true);
      MusicControl.enableControl("pause", true);
      MusicControl.enableControl("nextTrack", true);
      MusicControl.enableControl("previousTrack", true);
      MusicControl.enableControl("seek", true);

      MusicControl.on(Command.play, commandHandlers.onPlay);
      MusicControl.on(Command.pause, commandHandlers.onPause);
      MusicControl.on(Command.nextTrack, commandHandlers.onNext);
      MusicControl.on(
        Command.previousTrack,
        commandHandlers.onPrevious
      );
      MusicControl.on(Command.seek, commandHandlers.onSeek);

      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing Music Control:", error);
    }
  }

  updateNowPlaying(config: MusicControlConfig) {
    try {
      MusicControl.setNowPlaying({
        title: config.title,
        artist: config.artist,
        duration: config.duration,
        artwork: config.artwork || artwork,
        elapsedTime: config.elapsedTime || 0,
        ...(Platform.OS === "android" && {
          notificationIcon: "ic_notification",
        }),
      });

      this.updatePlaybackState(config.isPlaying, config.elapsedTime);
    } catch (error) {
      console.error("Error updating now playing:", error);
    }
  }

  updatePlaybackState(isPlaying: boolean, elapsedTime: number = 0) {
    try {
      MusicControl.updatePlayback({
        state: isPlaying
          ? MusicControl.STATE_PLAYING
          : MusicControl.STATE_PAUSED,
        elapsedTime,
      });
    } catch (error) {
      console.error("Error updating playback state:", error);
    }
  }

  reset() {
    try {
      MusicControl.resetNowPlaying();
    } catch (error) {
      console.error("Error resetting controls:", error);
    }
  }

  destroy() {
    try {
      MusicControl.stopControl();
      this.isInitialized = false;
    } catch (error) {
      console.error("Error stopping Music Control:", error);
    }
  }
}

export const musicControlManager = new MusicControlManager();
export type { MusicControlConfig };
