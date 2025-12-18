import AudioBtn from "@/components/AudioBtn";
import BottomControl from "@/components/BottomControl";
import SearchBar from "@/components/SearchBar";
import { useAudioStore } from "@/store/audioStore";
import { musicControlService } from "@/store/musicControlService";
import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AudioItem {
  id: string;
  title: string;
  url: string;
  reciter: string;
}

const FavoriteScreen = () => {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = useCallback(
    (text: string) => setSearch(text),
    []
  );

  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const {
    favorites,
    audioItem,
    player,
    isPlaying,
    didJustFinish,
    shouldAutoPlay,
    setShouldAutoPlay,
    setIsPlaying,
    loadFavorites,
    removeFavorite,
    addFavorite,
    isFavorite,
    setAudioItem,
    setCurrentAudioUrl,
    initializeCache,
    getCachedAudioUrl,
    cacheAudio,
    isAudioCachedSync,
    activeScreen,
    setActiveScreen,
    updateMusicControl,
    cleanupMusicControl,
  } = useAudioStore();

  const sortedFavorites = useMemo(() => {
    return [...favorites].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, {
        sensitivity: "base",
      })
    );
  }, [favorites]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          updateMusicControl();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [updateMusicControl]);

  useEffect(() => {
    setActiveScreen("favorites");
  }, []);

  useEffect(() => {
    Promise.all([loadFavorites(), initializeCache()]).catch(
      console.error
    );

    musicControlService.initialize();
  }, []);

  useEffect(() => {
    if (didJustFinish && activeScreen === "favorites") {
      player.pause();
      player.seekTo(0);
      setIsPlaying(false);
      handleNext();
    }
  }, [didJustFinish, activeScreen]);

  const filteredFavorites = useMemo(() => {
    if (!search) return sortedFavorites;
    const lowerSearch = search.toLowerCase();
    return sortedFavorites.filter((item) =>
      item.title.toLowerCase().includes(lowerSearch)
    );
  }, [sortedFavorites, search]);

  const handlePlay = useCallback(
    async (item: AudioItem) => {
      setAudioItem(item);

      try {
        const cachedUrl = await getCachedAudioUrl(item.id, item.url);

        if (cachedUrl !== audioItem?.url) {
          setCurrentAudioUrl(cachedUrl);
          setShouldAutoPlay(true);

          if (!isAudioCachedSync(item.id)) {
            cacheAudio(item.id, item.url).catch(console.error);
          }
        } else if (!isPlaying) {
          setShouldAutoPlay(true);
        }
      } catch (error) {
        console.error(
          `❌ Error handling audio playback for ${item.id}:`,
          error
        );
        setCurrentAudioUrl(item.url);
        setShouldAutoPlay(true);
      }
    },
    [
      audioItem?.url,
      isPlaying,
      setAudioItem,
      setCurrentAudioUrl,
      setShouldAutoPlay,
      getCachedAudioUrl,
      cacheAudio,
      isAudioCachedSync,
    ]
  );

  const handlePausePlay = useCallback(async () => {
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
  }, [player, isPlaying, setIsPlaying]);

  const handleNext = useCallback(async () => {
    if (sortedFavorites.length === 0) {
      console.log("❌ No favorites available");
      return;
    }

    const currentIndex = sortedFavorites.findIndex(
      (item) => item.id === audioItem?.id
    );

    if (
      currentIndex === -1 ||
      currentIndex === sortedFavorites.length - 1
    ) {
      console.log(
        "✅ Reached the end of the favorites list. No next track."
      );
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextAudio = sortedFavorites[nextIndex];

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
      preCacheAdjacentFavorites(nextIndex);
    } catch (error) {
      console.error("❌ Error switching to next favorite:", error);
      setCurrentAudioUrl(nextAudio.url);
      setShouldAutoPlay(true);
    }
  }, [
    favorites,
    sortedFavorites,
    audioItem?.id,
    player,
    isPlaying,
    setAudioItem,
    setCurrentAudioUrl,
    setIsPlaying,
    setShouldAutoPlay,
    getCachedAudioUrl,
  ]);

  const handlePrevious = useCallback(async () => {
    if (sortedFavorites.length === 0) {
      console.log("❌ No favorites available");
      return;
    }

    const currentIndex = sortedFavorites.findIndex(
      (item) => item.id === audioItem?.id
    );

    if (currentIndex === -1 || currentIndex === 0) {
      console.log(
        "✅ Reached the beginning of the favorites list. No previous track."
      );
      return;
    }

    const prevIndex = currentIndex - 1;
    const prevAudio = sortedFavorites[prevIndex];

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
      preCacheAdjacentFavorites(prevIndex);
    } catch (error) {
      console.error(
        "❌ Error switching to previous favorite:",
        error
      );
      setCurrentAudioUrl(prevAudio.url);
      setShouldAutoPlay(true);
    }
  }, [
    favorites,
    sortedFavorites,
    audioItem?.id,
    player,
    isPlaying,
    setAudioItem,
    setCurrentAudioUrl,
    setIsPlaying,
    setShouldAutoPlay,
    getCachedAudioUrl,
  ]);

  const preCacheAdjacentFavorites = useCallback(
    (currentIndex?: number) => {
      if (favorites.length === 0) return;

      const index =
        currentIndex ??
        favorites.findIndex((item) => item.id === audioItem?.id);

      if (index === -1) return;

      const nextIndex = (index + 1) % favorites.length;
      const prevIndex =
        (index - 1 + favorites.length) % favorites.length;

      const nextAudio = favorites[nextIndex];
      const prevAudio = favorites[prevIndex];

      if (!isAudioCachedSync(nextAudio.id)) {
        cacheAudio(nextAudio.id, nextAudio.url).catch(console.error);
      }

      if (!isAudioCachedSync(prevAudio.id)) {
        cacheAudio(prevAudio.id, prevAudio.url).catch(console.error);
      }
    },
    [favorites, audioItem?.id, cacheAudio, isAudioCachedSync]
  );

  useEffect(() => {
    if (audioItem?.id && favorites.length > 0) {
      preCacheAdjacentFavorites();
    }
  }, [audioItem?.id, favorites.length]);

  const navigateToPlay = useCallback(
    (id: string, title: string, url: string, reciter: string) => {
      router.push(
        `/play/${id}?title=${encodeURIComponent(
          title
        )}&url=${encodeURIComponent(
          url
        )}&reciter=${encodeURIComponent(
          reciter
        )}&from=${encodeURIComponent("favorites")}`
      );
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: AudioItem }) => {
      const itemIsFavorite = isFavorite(item.id);
      const itemIsCached = isAudioCachedSync(item.id);
      const reciter = item.reciter || "Hafiz Yahya Ibrahim Muhammad";

      return (
        <AudioBtn
          title={item.title}
          reciter={reciter}
          url={item.url}
          id={item.id}
          onPress={() => handlePlay(item)}
          isFav={itemIsFavorite}
          onToggleFavorite={() =>
            itemIsFavorite
              ? removeFavorite(item.id)
              : addFavorite(item)
          }
          isCached={itemIsCached}
        />
      );
    },
    [
      isFavorite,
      isAudioCachedSync,
      handlePlay,
      removeFavorite,
      addFavorite,
    ]
  );

  const keyExtractor = useCallback((item: AudioItem) => item.id, []);

  const ItemSeparator = useMemo(
    () => (
      <View
        style={{
          height: 0.8,
          backgroundColor: isDark
            ? themeColors.dark.card
            : themeColors.light.card,
        }}
      />
    ),
    [isDark]
  );

  const EmptyComponent = useMemo(
    () => (
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
    ),
    [isDark]
  );

  const headerTextStyle = useMemo(
    () => ({
      fontSize: 30,
      fontFamily: "NunitoSans-Bold",
      marginTop: 10,
      color: isDark
        ? themeColors.dark.text
        : themeColors.light.primary,
    }),
    [isDark]
  );

  const containerStyle = useMemo(
    () => ({
      backgroundColor: isDark
        ? themeColors.dark.background
        : themeColors.light.background,
    }),
    [isDark]
  );

  const handleNavigateToPlay = useCallback(() => {
    if (!audioItem) return;

    const reciter =
      audioItem.reciter || "Hafiz Yahya Ibrahim Muhammad";
    navigateToPlay(
      audioItem.id,
      audioItem.title,
      audioItem.url,
      reciter
    );
  }, [audioItem, navigateToPlay]);

  return (
    <SafeAreaView
      className="flex-1 w-full px-5 h-screen overflow-hidden"
      style={containerStyle}
    >
      <View className="flex flex-col gap-5">
        <Text style={headerTextStyle}>Favorites</Text>
        <SearchBar
          placeholder="Search favorites"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={filteredFavorites}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={() => ItemSeparator}
        ListEmptyComponent={EmptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
        className="flex-1 mt-10 w-full min-h-screen"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
      />

      {audioItem && audioItem.url && (
        <BottomControl
          title={audioItem.title}
          isPlaying={isPlaying}
          onPressPlayPauseBtn={handlePausePlay}
          onPressNextBtn={handleNext}
          onPressPrevBtn={handlePrevious}
          onNavigate={handleNavigateToPlay}
        />
      )}
    </SafeAreaView>
  );
};

export default React.memo(FavoriteScreen);
