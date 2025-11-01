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
import React, { useEffect, useRef, useState } from "react";
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
  const [isSliding, setIsSliding] = useState(false);
  const [localSliderValue, setLocalSliderValue] = useState(0);
  const isSeeking = useRef(false);

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
  } = useAudioStore();

  // ✅ Deep-link handler: load audio if opened from URL
  useEffect(() => {
    if (params.id && typeof params.id === "string") {
      const selectedAudio = quranAudioList.find(
        (item) => item.id === params.id
      );
      if (selectedAudio) {
        setAudioItem(selectedAudio);
        setCurrentAudioUrl(selectedAudio.url);
        setShouldAutoPlay(true);
      }
    }
  }, [params.id]);

  // ✅ Keep slider synced with current time
  useEffect(() => {
    if (!isSliding && !isSeeking.current) {
      setLocalSliderValue(currentTime);
    }
  }, [currentTime, isSliding]);

  // ✅ Reset slider on finish
  useEffect(() => {
    if (didJustFinish) {
      setLocalSliderValue(0);
    }
  }, [didJustFinish]);

  // ✅ Reset player after audio finishes
  useEffect(() => {
    if (didJustFinish && player) {
      (async () => {
        try {
          await player.pause();
          await player.seekTo(0);
          setIsPlaying(false);
          console.log("Player reset after finish");
        } catch (error) {
          console.error("Error resetting player:", error);
        }
      })();
    }
  }, [didJustFinish]);

  // ✅ Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const currentTimeDisplay = formatTime(
    isSliding ? localSliderValue : currentTime
  );
  const durationDisplay = formatTime(duration);

  // ---- HANDLERS ----

  const handlePausePlay = async () => {
    if (!player) {
      console.error("Player not initialized");
      return;
    }
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
    setCurrentAudioUrl(prevAudio.url);
    setShouldAutoPlay(true);

    // Optional: Update URL params without rerouting
    router.setParams({
      id: prevAudio.id,
      title: prevAudio.title,
      url: prevAudio.url,
      reciter: prevAudio.reciter,
    });
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
    setCurrentAudioUrl(nextAudio.url);
    setShouldAutoPlay(true);

    // Optional: Update URL params
    router.setParams({
      id: nextAudio.id,
      title: nextAudio.title,
      url: nextAudio.url,
      reciter: nextAudio.reciter,
    });
  };

  const handleToggleFavorite = async () => {
    if (!audioItem?.id) return;

    if (isFavorite(audioItem.id)) {
      await removeFavorite(audioItem.id);
    } else {
      await addFavorite(audioItem);
    }
  };

  const handleSlidingStart = () => {
    setIsSliding(true);
    isSeeking.current = true;
  };

  const handleSliderValueChange = (value: number) => {
    setLocalSliderValue(value);
  };

  const handleSlidingComplete = async (value: number) => {
    if (!player) {
      setIsSliding(false);
      isSeeking.current = false;
      return;
    }

    try {
      await player.seekTo(value);
      setLocalSliderValue(value);
    } catch (err) {
      console.error("Error seeking:", err);
    } finally {
      setTimeout(() => {
        setIsSliding(false);
        isSeeking.current = false;
      }, 100);
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
      {/* 🔙 Header with Back Button */}
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

      <View className="flex items-center justify-center">
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
            marginBottom: 40,
          }}
        >
          <Image
            source={icon}
            style={{ width: "100%", height: "100%" }}
            className="rounded-xl shadow-2xl"
          />
        </View>
      </View>
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

        <View className="flex flex-col mt-10 w-full">
          <Slider
            minimumTrackTintColor={isDark ? "#d7ac61" : "#22946e"}
            maximumTrackTintColor={isDark ? "#ecd7b2" : "#9ae8ce"}
            thumbTintColor={isDark ? "#d7ac61" : "#95b49f"}
            value={localSliderValue}
            maximumValue={duration || 1}
            minimumValue={0}
            onSlidingStart={handleSlidingStart}
            onValueChange={handleSliderValueChange}
            onSlidingComplete={handleSlidingComplete}
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
          className="mt-10 flex flex-row items-center justify-center"
          style={{ gap: 8 }}
        >
          <TouchableOpacity
            onPress={handleLoop}
            style={{
              padding: 15,
            }}
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
            style={{
              padding: 15,
            }}
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
              borderRadius: "100%",
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
            style={{
              padding: 15,
            }}
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
            style={{
              padding: 15,
            }}
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
