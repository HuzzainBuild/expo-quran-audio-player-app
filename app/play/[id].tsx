import { formatTime } from "@/constant/contant";
import {
  audiosIcon,
  loopActiveIcon,
  loopIcon,
  loveActiveIcon,
  loveIcon,
  nextIcon,
  pauseIcon,
  playIcon,
  previousIcon,
} from "@/constant/icons";
import { icon } from "@/constant/images";
import { quranAudioList } from "@/constant/quranAudioList";
import { useAudioStore } from "@/store/audioStore";
import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const { width } = Dimensions.get("window");

const PlayScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [isLoop, setIsLoop] = useState(false);

  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const {
    audioItem,
    currentAudioUrl,
    shouldAutoPlay,
    isPlaying,
    currentTime,
    duration,
    player,
    didJustFinish,
    loadFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    setAudioItem,
    setCurrentAudioUrl,
    setIsPlaying,
    setShouldAutoPlay,
    // 🔄 Caching functions
    getCachedAudioUrl,
    cacheAudio,
    isAudioCached,
    initializeCache,
  } = useAudioStore();

  // ✅ Initialize cache system on component mount
  useEffect(() => {
    initializeCache().then(() => {
      console.log("🎯 Cache system initialized in play screen");
    });
  }, []);

  // ✅ Load audio if opened via deep link with caching
  useEffect(() => {
    const loadAudioWithCaching = async () => {
      if (params.id && typeof params.id === "string") {
        const selectedAudio = quranAudioList.find(
          (item) => item.id === params.id
        );

        if (!selectedAudio) {
          console.error("❌ Audio not found for ID:", params.id);
          return;
        }

        // ✅ Only reload if the selected audio is different
        if (selectedAudio && selectedAudio.id !== audioItem?.id) {
          console.log(`🎯 Loading audio: ${selectedAudio.title}`);
          setAudioItem(selectedAudio);

          try {
            // 🎯 Get cached URL or remote URL
            const cachedUrl = await getCachedAudioUrl(
              selectedAudio.id,
              selectedAudio.url
            );
            console.log(
              `🎯 Using ${cachedUrl === selectedAudio.url ? "REMOTE" : "CACHED"} URL for playback`
            );

            setCurrentAudioUrl(cachedUrl);
            setShouldAutoPlay(true);

            // 🎯 Cache in background if not already cached
            await cacheAudioInBackground(
              selectedAudio.id,
              selectedAudio.url
            );
          } catch (error) {
            console.error("❌ Error getting cached URL:", error);
            // 🎯 Fallback to remote URL
            setCurrentAudioUrl(selectedAudio.url);
            setShouldAutoPlay(true);
          }
        }
      }
    };

    loadAudioWithCaching();
  }, [params.id]);

  // ✅ Update cache status when audio item changes and pre-cache adjacent tracks
  useEffect(() => {
    if (audioItem?.id) {
      preCacheAdjacentTracks();
    }
  }, [audioItem?.id]);

  // ✅ Reset player after finish (only if not looping)
  useEffect(() => {
    if (didJustFinish && player && !isLoop) {
      (async () => {
        try {
          await player.pause();
          await player.seekTo(0);
          setIsPlaying(false);
          console.log("⏹️ Player reset after finish");
        } catch (error) {
          console.error("❌ Error resetting player:", error);
        }
      })();
    }
  }, [didJustFinish, isLoop]);

  // ✅ Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  /**
   * 🎯 Caches audio in background if not already cached
   */
  const cacheAudioInBackground = async (
    audioId: string,
    remoteUrl: string
  ) => {
    try {
      const alreadyCached = await isAudioCached(audioId);
      if (!alreadyCached) {
        console.log(`📥 Starting background caching for: ${audioId}`);

        cacheAudio(audioId, remoteUrl)
          .then((success) => {
            if (success) {
              console.log(`✅ Background cache complete: ${audioId}`);
            } else {
              console.log(`❌ Background cache failed: ${audioId}`);
            }
          })
          .catch((error) => {
            console.error(
              `❌ Background cache error for ${audioId}:`,
              error
            );
          });
      } else {
        console.log(`⏭️ Audio already cached, skipping: ${audioId}`);
      }
    } catch (error) {
      console.error("❌ Error in background caching:", error);
    }
  };

  /**
   * 🎯 Pre-caches adjacent tracks for smoother navigation
   */
  const preCacheAdjacentTracks = () => {
    if (!audioItem?.id) return;

    const currentIndex = quranAudioList.findIndex(
      (item) => item.id === audioItem.id
    );
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % quranAudioList.length;
    const prevIndex =
      (currentIndex - 1 + quranAudioList.length) %
      quranAudioList.length;

    const nextAudio = quranAudioList[nextIndex];
    const prevAudio = quranAudioList[prevIndex];

    console.log(
      `🎯 Pre-caching adjacent tracks: ${prevAudio.title} ← | → ${nextAudio.title}`
    );

    // 🎯 Cache adjacent tracks in background
    cacheAudioInBackground(nextAudio.id, nextAudio.url);
    cacheAudioInBackground(prevAudio.id, prevAudio.url);
  };

  const currentTimeDisplay = formatTime(currentTime);
  const durationDisplay = formatTime(duration);

  // ---- HANDLERS ----

  const handlePausePlay = async () => {
    if (!player) return;
    try {
      if (isPlaying) {
        await player.pause();
        setIsPlaying(false);
      } else {
        await player.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Error toggling playback:", err);
    }
  };

  const handlePrevious = async () => {
    if (!audioItem) return;
    const currentIndex = quranAudioList.findIndex(
      (item) => item.id === audioItem.id
    );
    const prevIndex =
      (currentIndex - 1 + quranAudioList.length) %
      quranAudioList.length;
    const prevAudio = quranAudioList[prevIndex];

    if (player) {
      await player.pause();
      await player.seekTo(0);
      setIsPlaying(false);
    }

    setAudioItem(prevAudio);

    try {
      // 🎯 Get cached URL for previous audio
      const prevAudioUri = await getCachedAudioUrl(
        prevAudio.id,
        prevAudio.url
      );
      setCurrentAudioUrl(prevAudioUri);
      setShouldAutoPlay(true);

      console.log(
        `🎯 Now playing: ${prevAudio.title} (${prevAudioUri === prevAudio.url ? "REMOTE" : "CACHED"})`
      );

      router.setParams({
        id: prevAudio.id,
        title: prevAudio.title,
        url: prevAudio.url,
        reciter: prevAudio.reciter,
      });
    } catch (error) {
      console.error("❌ Error switching to previous track:", error);
      // Fallback to remote URL
      setCurrentAudioUrl(prevAudio.url);
      setShouldAutoPlay(true);
    }
  };

  const handleNext = async () => {
    if (!audioItem) return;
    const currentIndex = quranAudioList.findIndex(
      (item) => item.id === audioItem.id
    );
    const nextIndex = (currentIndex + 1) % quranAudioList.length;
    const nextAudio = quranAudioList[nextIndex];

    if (player) {
      await player.pause();
      await player.seekTo(0);
      setIsPlaying(false);
    }

    setAudioItem(nextAudio);

    try {
      // 🎯 Get cached URL for next audio
      const nextAudioUri = await getCachedAudioUrl(
        nextAudio.id,
        nextAudio.url
      );
      setCurrentAudioUrl(nextAudioUri);
      setShouldAutoPlay(true);

      console.log(
        `🎯 Now playing: ${nextAudio.title} (${nextAudioUri === nextAudio.url ? "REMOTE" : "CACHED"})`
      );

      router.setParams({
        id: nextAudio.id,
        title: nextAudio.title,
        url: nextAudio.url,
        reciter: nextAudio.reciter,
      });
    } catch (error) {
      console.error("❌ Error switching to next track:", error);
      // Fallback to remote URL
      setCurrentAudioUrl(nextAudio.url);
      setShouldAutoPlay(true);
    }
  };

  const handleToggleFavorite = async () => {
    if (!audioItem?.id) return;
    if (isFavorite(audioItem.id)) {
      await removeFavorite(audioItem.id);
    } else {
      await addFavorite(audioItem);
    }
  };

  const handleSliderValueChange = async (value: number) => {
    if (player) {
      try {
        await player.seekTo(value);
      } catch (err) {
        console.error("Error seeking audio:", err);
      }
    }
  };

  const handleSliderComplete = async (value: number) => {
    if (!player) return;

    try {
      await player.seekTo(value);
    } catch (err) {
      console.error("Error seeking:", err);
    }
  };

  const handleLoop = async () => {
    if (!player) return;
    try {
      const newLoopState = !isLoop;
      player.loop = newLoopState;
      setIsLoop(newLoopState);
    } catch (error) {
      console.error("Error enabling loop:", error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // ---- RENDER ----
  return (
    <SafeAreaView
      className="flex-1 w-full h-screen flex-col gap-8"
      style={{
        backgroundColor: isDark
          ? themeColors.dark.background
          : themeColors.light.background,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity
          onPress={handleBack}
          style={styles.iconButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={
              isDark
                ? themeColors.dark.text
                : themeColors.light.primary
            }
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontFamily: "NunitoSans-Bold",
            color: isDark
              ? themeColors.dark.text
              : themeColors.light.text,
          }}
        >
          Now Playing
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Artwork */}
      <View className="flex items-center justify-center mt-10">
        <View
          style={{
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: 20,
            backgroundColor: isDark
              ? themeColors.dark.card
              : themeColors.light.card,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={icon}
            style={{ width: "100%", height: "100%" }}
            className="rounded-xl shadow-2xl"
          />
        </View>
      </View>

      {/* Track info + favorite */}
      <View className="flex flex-col gap-8 mt-5 px-10">
        <View className="flex flex-row justify-between items-center px-4">
          <View className="flex flex-col gap-2">
            <Text
              className="text-base font-semibold"
              style={{
                fontFamily: "NunitoSans-Bold",
                color: isDark
                  ? themeColors.dark.text
                  : themeColors.light.text,
              }}
            >
              {audioItem?.title || "Untitled Audio"}
            </Text>
            <Text
              className="text-sm"
              style={{
                fontFamily: "NunitoSans-SemiBold",
                color: isDark
                  ? themeColors.dark.textLight
                  : themeColors.light.textLight,
              }}
            >
              {audioItem?.reciter || "Unknown"}
            </Text>
          </View>

          <TouchableOpacity
            className="p-2"
            onPress={handleToggleFavorite}
          >
            <Image
              source={
                audioItem?.id && isFavorite(audioItem.id)
                  ? loveActiveIcon
                  : loveIcon
              }
              className="w-6 h-5"
              resizeMode="contain"
              tintColor={
                isDark ? themeColors.dark.textLight : "#82B098"
              }
            />
          </TouchableOpacity>
        </View>

        {/* Slider */}
        <View className="flex flex-col mt-5 w-full">
          <Slider
            minimumTrackTintColor={isDark ? "#d7ac61" : "#22946e"}
            maximumTrackTintColor={isDark ? "#ecd7b2" : "#9ae8ce"}
            thumbTintColor={isDark ? "#d7ac61" : "#95b49f"}
            value={didJustFinish ? 0 : currentTime}
            maximumValue={duration || 1}
            minimumValue={0}
            onValueChange={handleSliderValueChange}
            onSlidingComplete={handleSliderComplete}
            className="w-full h-10"
            disabled={!player || duration === 0}
          />
          <View className="w-full flex flex-row justify-between items-center px-4">
            <Text
              className="text-sm font-medium"
              style={{
                color: isDark
                  ? themeColors.dark.textLight
                  : themeColors.light.textLight,
              }}
            >
              {currentTimeDisplay}
            </Text>
            <Text
              className="text-sm font-medium"
              style={{
                color: isDark
                  ? themeColors.dark.textLight
                  : themeColors.light.textLight,
              }}
            >
              {durationDisplay}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View
          className="mt-5 flex flex-row items-center justify-center"
          style={{ gap: 8 }}
        >
          <TouchableOpacity
            onPress={handleLoop}
            style={{ padding: 15 }}
          >
            <Image
              source={isLoop ? loopActiveIcon : loopIcon}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
              tintColor={
                isDark && isLoop
                  ? themeColors.dark.text
                  : isDark && !isLoop
                    ? themeColors.dark.textLight
                    : !isDark && isLoop
                      ? themeColors.dark.text
                      : "#82B098"
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePrevious}
            style={{ padding: 15 }}
          >
            <Image
              source={previousIcon}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
              tintColor={
                isDark ? themeColors.dark.textLight : "#82B098"
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePausePlay}
            style={{
              padding: 15,
              borderRadius: 9999,
              backgroundColor: isDark
                ? themeColors.dark.card
                : themeColors.light.card,
            }}
          >
            <Image
              source={isPlaying ? pauseIcon : playIcon}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
              tintColor={isDark ? themeColors.dark.text : "#0c5b34"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            style={{ padding: 15 }}
          >
            <Image
              source={nextIcon}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
              tintColor={
                isDark ? themeColors.dark.textLight : "#82B098"
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBack}
            style={{ padding: 15 }}
          >
            <Image
              source={audiosIcon}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
              tintColor={
                isDark ? themeColors.dark.textLight : "#82B098"
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PlayScreen;
