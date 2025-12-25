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
import { useAudioStore } from "@/store/audioStore";
import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
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
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const {
    audioItem,
    isPlaying,
    currentTime,
    duration,
    isLooping,
    isShuffling,
    isFavorite,
    setAudioItem,
    playNext,
    playPrevious,
    togglePlayPause,
    toggleLooping,
    toggleShuffling,
    addFavorite,
    removeFavorite,
    seekTo,
  } = useAudioStore();

  // Only set audio item if navigating to a different audio
  useEffect(() => {
    if (params.id && typeof params.id === "string") {
      // Only set if the audio is different from currently playing
      if (!audioItem || audioItem.id !== params.id) {
        const selectedAudio =
          useAudioStore
            .getState()
            .playlist.find((item) => item.id === params.id) || null;
        setAudioItem(selectedAudio);
      }
    }
  }, [params.id]); // Removed setAudioItem and audioItem from dependencies

  const handleToggleFavorite = useCallback(() => {
    if (audioItem) {
      isFavorite(audioItem.id)
        ? removeFavorite(audioItem.id)
        : addFavorite(audioItem);
    }
  }, [audioItem, isFavorite, removeFavorite, addFavorite]);

  const artworkContainerStyle = useMemo(
    () => ({
      width: width * 0.8,
      height: width * 0.8,
      borderRadius: 20,
      backgroundColor: isDark
        ? themeColors.dark.card
        : themeColors.light.card,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    }),
    [isDark]
  );

  return (
    <SafeAreaView
      className="flex-1 w-full h-screen flex-col gap-8"
      style={{
        backgroundColor: isDark
          ? themeColors.dark.background
          : themeColors.light.background,
      }}
    >
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={28}
            color={isDark ? "white" : "black"}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerText,
            { color: isDark ? "white" : "black" },
          ]}
        >
          Now Playing
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View className="flex items-center justify-center mt-10">
        <View style={artworkContainerStyle}>
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
                audioItem && isFavorite(audioItem.id)
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
      </View>

      <View className="flex flex-col mt-5 w-ful px-10">
        <Slider
          value={currentTime}
          maximumValue={duration}
          onSlidingComplete={seekTo}
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
            {formatTime(currentTime)}
          </Text>
          <Text
            className="text-sm font-medium"
            style={{
              color: isDark
                ? themeColors.dark.textLight
                : themeColors.light.textLight,
            }}
          >
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      <View
        className="mt-5 flex flex-row items-center justify-center"
        style={{ gap: 8 }}
      >
        <TouchableOpacity
          onPress={toggleLooping}
          style={{ padding: 15 }}
        >
          <Image
            source={isLooping ? loopActiveIcon : loopIcon}
            style={{ width: 22, height: 22 }}
            resizeMode="contain"
            tintColor={
              isDark && isLooping
                ? themeColors.dark.text
                : isDark && !isLooping
                  ? themeColors.dark.textLight
                  : !isDark && isLooping
                    ? themeColors.light.primary
                    : "#82B098"
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={playPrevious}
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

        <TouchableOpacity onPress={togglePlayPause}>
          <Image
            source={isPlaying ? pauseIcon : playIcon}
            style={{ width: 22, height: 22 }}
            resizeMode="contain"
            tintColor={isDark ? themeColors.dark.text : "#0c5b34"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext} style={{ padding: 15 }}>
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
          onPress={() => router.back()}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  artworkContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  artwork: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
  },
  detailsContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  reciter: {
    fontSize: 16,
    color: "gray",
  },
  favoriteIcon: {
    width: 24,
    height: 24,
    marginTop: 10,
  },
  sliderContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    color: "gray",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
  },
  controlIcon: {
    width: 24,
    height: 24,
  },
  playPauseIcon: {
    width: 48,
    height: 48,
  },
});

export default PlayScreen;