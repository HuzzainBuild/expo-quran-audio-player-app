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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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

  const { from } = params as { from?: string };

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
    getCachedAudioUrl,
    cacheAudio,
    isAudioCachedSync,
    initializeCache,
    setActiveScreen,
  } = useAudioStore();

  useEffect(() => {
    if (from === "favorites") {
      setActiveScreen("favorites");
    } else {
      setActiveScreen("audio");
    }
    return () => setActiveScreen(null);
  }, [from]);

  const currentTimeDisplay = useMemo(
    () => formatTime(currentTime),
    [currentTime]
  );
  const durationDisplay = useMemo(
    () => formatTime(duration),
    [duration]
  );

  const isFavoriteAudio = useMemo(
    () => audioItem?.id && isFavorite(audioItem.id),
    [audioItem?.id, isFavorite]
  );

  useEffect(() => {
    initializeCache();
  }, []);

  const loadAudioWithCaching = useCallback(
    async (audioId: string) => {
      const selectedAudio = quranAudioList.find(
        (item) => item.id === audioId
      );

      if (!selectedAudio) {
        console.error("❌ Audio not found for ID:", audioId);
        return;
      }

      if (selectedAudio.id === audioItem?.id) return;

      console.log(`🎯 Loading audio: ${selectedAudio.title}`);
      setAudioItem(selectedAudio);

      try {
        const cachedUrl = await getCachedAudioUrl(
          selectedAudio.id,
          selectedAudio.url
        );
        setCurrentAudioUrl(cachedUrl);
        setShouldAutoPlay(true);

        if (!isAudioCachedSync(selectedAudio.id)) {
          cacheAudio(selectedAudio.id, selectedAudio.url).catch(
            console.error
          );
        }
      } catch (error) {
        console.error("❌ Error getting cached URL:", error);
        setCurrentAudioUrl(selectedAudio.url);
        setShouldAutoPlay(true);
      }
    },
    [
      audioItem?.id,
      setAudioItem,
      setCurrentAudioUrl,
      setShouldAutoPlay,
      getCachedAudioUrl,
      cacheAudio,
      isAudioCachedSync,
    ]
  );

  useEffect(() => {
    if (params.id && typeof params.id === "string") {
      loadAudioWithCaching(params.id);
    }
  }, [params.id]);

  useEffect(() => {
    if (audioItem?.id) {
      preCacheAdjacentTracks();
    }
  }, [audioItem?.id]);

  useEffect(() => {
    if (didJustFinish && player && !isLoop) {
      (async () => {
        try {
          await player.pause();
          await player.seekTo(0);
          setIsPlaying(false);
        } catch (error) {
          console.error("❌ Error resetting player:", error);
        }
      })();
    }
  }, [didJustFinish, isLoop, player, setIsPlaying]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const preCacheAdjacentTracks = useCallback(() => {
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

    if (!isAudioCachedSync(nextAudio.id)) {
      cacheAudio(nextAudio.id, nextAudio.url).catch(console.error);
    }

    if (!isAudioCachedSync(prevAudio.id)) {
      cacheAudio(prevAudio.id, prevAudio.url).catch(console.error);
    }
  }, [audioItem?.id, cacheAudio, isAudioCachedSync]);

  const handlePausePlay = useCallback(async () => {
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
  }, [player, isPlaying, setIsPlaying]);

  const handlePrevious = useCallback(async () => {
    if (!audioItem) return;

    const { favorites } = useAudioStore.getState();

    const sortedFavorites = [...favorites].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, {
        sensitivity: "base",
      })
    );
    const list =
      from === "favorites" ? sortedFavorites : quranAudioList;

    if (!list || list.length === 0) return;

    const currentIndex = list.findIndex(
      (item) => item.id === audioItem.id
    );
    if (currentIndex <= 0) {
      console.log(
        "Reached the beginning of the list. No previous track."
      );
      return;
    }

    const prevAudio = list[currentIndex - 1];

    if (player) {
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

      router.setParams({
        id: prevAudio.id,
        title: prevAudio.title,
        url: prevAudio.url,
        reciter: prevAudio.reciter,
        from,
      });
    } catch (error) {
      console.error("❌ Error switching to previous track:", error);
      setCurrentAudioUrl(prevAudio.url);
      setShouldAutoPlay(true);
    }
  }, [
    from,
    audioItem,
    player,
    setIsPlaying,
    setAudioItem,
    getCachedAudioUrl,
    setCurrentAudioUrl,
    setShouldAutoPlay,
    router,
  ]);

  const handleNext = useCallback(async () => {
    if (!audioItem) return;

    const { favorites } = useAudioStore.getState(); // get latest favorites from store

    const sortedFavorites = [...favorites].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, {
        sensitivity: "base",
      })
    );

    // Determine which list to use
    const list =
      from === "favorites" ? sortedFavorites : quranAudioList;
    if (!list || list.length === 0) return;

    // Find current index in the selected list
    const currentIndex = list.findIndex(
      (item) => item.id === audioItem.id
    );
    if (currentIndex === -1 || currentIndex === list.length - 1) {
      console.log("Reached the end of the list. No next track.");
      return;
    }

    // Get next track
    const nextAudio = list[currentIndex + 1];

    // Reset player before switching
    if (player) {
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

      router.setParams({
        id: nextAudio.id,
        title: nextAudio.title,
        url: nextAudio.url,
        reciter: nextAudio.reciter,
        from,
      });
    } catch (error) {
      console.error("❌ Error switching to next track:", error);
      setCurrentAudioUrl(nextAudio.url);
      setShouldAutoPlay(true);
    }
  }, [
    from,
    audioItem,
    player,
    setIsPlaying,
    setAudioItem,
    getCachedAudioUrl,
    setCurrentAudioUrl,
    setShouldAutoPlay,
    router,
  ]);

  const handleToggleFavorite = useCallback(async () => {
    if (!audioItem?.id) return;
    if (isFavorite(audioItem.id)) {
      await removeFavorite(audioItem.id);
    } else {
      await addFavorite(audioItem);
    }
  }, [audioItem, isFavorite, removeFavorite, addFavorite]);

  const handleSliderValueChange = useCallback(
    async (value: number) => {
      if (player) {
        try {
          await player.seekTo(value);
        } catch (err) {
          console.error("Error seeking audio:", err);
        }
      }
    },
    [player]
  );

  const handleSliderComplete = useCallback(
    async (value: number) => {
      if (!player) return;
      try {
        await player.seekTo(value);
      } catch (err) {
        console.error("Error seeking:", err);
      }
    },
    [player]
  );

  const handleLoop = useCallback(async () => {
    if (!player) return;
    try {
      const newLoopState = !isLoop;
      player.loop = newLoopState;
      setIsLoop(newLoopState);
    } catch (error) {
      console.error("Error enabling loop:", error);
    }
  }, [player, isLoop]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

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

  const controlButtonStyle = useMemo(
    () => ({
      padding: 15,
      borderRadius: 9999,
      backgroundColor: isDark
        ? themeColors.dark.card
        : themeColors.light.card,
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
      {}
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

      {}
      <View className="flex items-center justify-center mt-10">
        <View style={artworkContainerStyle}>
          <Image
            source={icon}
            style={{ width: "100%", height: "100%" }}
            className="rounded-xl shadow-2xl"
          />
        </View>
      </View>

      {}
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
              source={isFavoriteAudio ? loveActiveIcon : loveIcon}
              className="w-6 h-5"
              resizeMode="contain"
              tintColor={
                isDark ? themeColors.dark.textLight : "#82B098"
              }
            />
          </TouchableOpacity>
        </View>

        {}
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

        {}
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
                      ? themeColors.light.primary
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
            style={controlButtonStyle}
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

export default React.memo(PlayScreen);
