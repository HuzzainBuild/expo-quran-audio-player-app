import AudioBtn from "@/components/AudioBtn";
import BottomControl from "@/components/BottomControl";
import SearchBar from "@/components/SearchBar";
import { useAudioStore } from "@/store/audioStore";
import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FovoriteScreen = () => {
  const [search, setSearch] = useState("");
  const handleSearch = (text: string) => setSearch(text);

  const { theme, toggleTheme } = useThemeStore();

  const isDark = theme === "dark";

  const {
    favorites,
    audioItem,
    player,
    isPlaying,
    shouldAutoPlay,
    setShouldAutoPlay,
    setIsPlaying,
    loadFavorites,
    removeFavorite,
    addFavorite,
    isFavorite,
    setAudioItem,
    setCurrentAudioUrl,
    // 🔄 Caching functions
    initializeCache,
    getCachedAudioUrl,
    cacheAudio,
    isAudioCached,
  } = useAudioStore();

  const router = useRouter();

  // Load favorites from AsyncStorage and initialize cache
  useEffect(() => {
    loadFavorites();
    initializeCache(); // 🎯 Initialize caching system
  }, []);

  // Filter favorites based on search
  const filteredFavorites = favorites.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  /**
   * 🎯 Handles audio playback with caching integration
   */
  const handlePlay = async (item: any) => {
    setAudioItem(item);

    try {
      // 🎯 Get cached URL (returns remote URL if not cached)
      const cachedUrl = await getCachedAudioUrl(item.id, item.url);
      console.log(
        `🎯 Using ${cachedUrl === item.url ? "REMOTE" : "CACHED"} URL for: ${item.title}`
      );

      if (cachedUrl !== audioItem?.url) {
        setCurrentAudioUrl(cachedUrl);
        setShouldAutoPlay(true);

        // 🎯 Cache audio in background if not already cached
        const isCached = await isAudioCached(item.id);
        if (!isCached) {
          console.log(
            `📥 Starting background cache for: ${item.title}`
          );
          cacheAudio(item.id, item.url).then((success) => {
            if (success) {
              console.log(`✅ Successfully cached: ${item.title}`);
            } else {
              console.log(`❌ Failed to cache: ${item.title}`);
            }
          });
        }
      } else if (!isPlaying) {
        setShouldAutoPlay(true);
      }
    } catch (error) {
      console.error(
        `❌ Error handling audio playback for ${item.id}:`,
        error
      );
      // 🎯 Fallback to remote URL on error
      setCurrentAudioUrl(item.url);
      setShouldAutoPlay(true);
    }
  };

  const handlePausePlay = async () => {
    if (!player) {
      console.error("Player not initialized");
      return;
    }

    try {
      if (player && isPlaying) {
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

  /**
   * ⏭️ Handles next track using favorites array with caching
   */
  const handleNext = async () => {
    // Use favorites array instead of quranAudioList
    const currentIndex = favorites.findIndex(
      (item) => item.id === audioItem?.id
    );

    if (currentIndex === -1) {
      console.log("❌ Current audio not found in favorites");
      return;
    }

    const nextIndex =
      currentIndex === favorites.length - 1 ? 0 : currentIndex + 1;
    const nextAudio = favorites[nextIndex];

    if (player && isPlaying) {
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
        `🎯 Now playing next favorite: ${nextAudio.title} (${nextAudioUri === nextAudio.url ? "REMOTE" : "CACHED"})`
      );
    } catch (error) {
      console.error("❌ Error switching to next favorite:", error);
      // Fallback to remote URL
      setCurrentAudioUrl(nextAudio.url);
      setShouldAutoPlay(true);
    }
  };

  /**
   * ⏮️ Handles previous track using favorites array with caching
   */
  const handlePrevious = async () => {
    // Use favorites array instead of quranAudioList
    const currentIndex = favorites.findIndex(
      (item) => item.id === audioItem?.id
    );

    if (currentIndex === -1) {
      console.log("❌ Current audio not found in favorites");
      return;
    }

    const prevIndex =
      currentIndex === 0 ? favorites.length - 1 : currentIndex - 1;
    const prevAudio = favorites[prevIndex];

    if (player && isPlaying) {
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
        `🎯 Now playing previous favorite: ${prevAudio.title} (${prevAudioUri === prevAudio.url ? "REMOTE" : "CACHED"})`
      );
    } catch (error) {
      console.error(
        "❌ Error switching to previous favorite:",
        error
      );
      // Fallback to remote URL
      setCurrentAudioUrl(prevAudio.url);
      setShouldAutoPlay(true);
    }
  };

  /**
   * 🎯 Pre-caches adjacent favorite tracks for smoother navigation
   */
  const preCacheAdjacentFavorites = () => {
    if (!audioItem?.id || favorites.length === 0) return;

    const currentIndex = favorites.findIndex(
      (item) => item.id === audioItem.id
    );
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % favorites.length;
    const prevIndex =
      (currentIndex - 1 + favorites.length) % favorites.length;

    const nextAudio = favorites[nextIndex];
    const prevAudio = favorites[prevIndex];

    console.log(
      `🎯 Pre-caching adjacent favorites: ${prevAudio.title} ← | → ${nextAudio.title}`
    );

    // 🎯 Cache adjacent favorite tracks in background
    cacheAudio(nextAudio.id, nextAudio.url).then((success) => {
      if (success)
        console.log(
          `✅ Pre-cached next favorite: ${nextAudio.title}`
        );
    });

    cacheAudio(prevAudio.id, prevAudio.url).then((success) => {
      if (success)
        console.log(
          `✅ Pre-cached previous favorite: ${prevAudio.title}`
        );
    });
  };

  // 🎯 Pre-cache adjacent favorites when audio item changes
  useEffect(() => {
    if (audioItem?.id && favorites.length > 0) {
      preCacheAdjacentFavorites();
    }
  }, [audioItem?.id, favorites]);

  const navigateToPlay = (
    id: string,
    title: string,
    url: string,
    reciter: string
  ) => {
    router.push(
      `/play/${id}?title=${encodeURIComponent(title)}&url=${encodeURIComponent(
        url
      )}&reciter=${encodeURIComponent(reciter)}`
    );
  };

  return (
    <SafeAreaView
      className="flex-1 w-full px-5 h-screen overflow-hidden"
      style={{
        backgroundColor: isDark
          ? themeColors.dark.background
          : themeColors.light.background,
      }}
    >
      <View className="flex flex-col gap-5">
        <Text
          style={{
            fontSize: 30,
            fontFamily: "NunitoSans-Bold",
            marginTop: 10,
            color: isDark
              ? themeColors.dark.text
              : themeColors.light.primary,
          }}
        >
          Favorites ({favorites.length})
        </Text>
        <SearchBar
          placeholder="Search favorites"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={search.length > 0 ? filteredFavorites : favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AudioBtn
            title={item.title}
            reciter={
              item.reciter
                ? item.reciter
                : "Hafiz Yahya Ibrahim Muhammad"
            }
            url={item.url}
            id={item.id}
            onPress={() => handlePlay(item)}
            isFav={isFavorite(item.id)}
            onToggleFavorite={() => {
              if (isFavorite(item.id)) {
                removeFavorite(item.id);
              } else {
                addFavorite(item);
              }
            }}
          />
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center mt-10">
            <Text
              className="text-base"
              style={{
                color: isDark
                  ? themeColors.dark.textLight
                  : themeColors.light.textLight,
              }}
            >
              No favorite audios yet ❤️
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
        className="flex-1 mt-10 w-full min-h-screen"
      />

      {audioItem && audioItem.url && (
        <BottomControl
          title={audioItem.title}
          isPlaying={isPlaying}
          onPressPlayPauseBtn={handlePausePlay}
          onPressNextBtn={handleNext}
          onPressPrevBtn={handlePrevious}
          onNavigate={() => {
            navigateToPlay(
              audioItem.id,
              audioItem.title,
              audioItem.url,
              audioItem.reciter
                ? audioItem.reciter
                : "Hafiz Yahya Ibrahim Muhammad"
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default FovoriteScreen;
