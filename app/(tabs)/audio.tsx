import AudioBtn from "@/components/AudioBtn";
import BottomControl from "@/components/BottomControl";
import SearchBar from "@/components/SearchBar";
import { quranAudioList } from "@/constant/quranAudioList";
import { useAudioStore } from "@/store/audioStore";
import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FlatList, Text, View } from "react-native";
import {
  OrientationLocker,
  PORTRAIT,
} from "react-native-orientation-locker";
import { SafeAreaView } from "react-native-safe-area-context";

const AudioScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = useCallback(
    (text: string) => setSearch(text),
    []
  );

  const filteredAudios = useMemo(() => {
    if (search.length === 0) return quranAudioList;
    const lowerSearch = search.toLowerCase();
    return quranAudioList.filter((item) =>
      item.title.toLowerCase().includes(lowerSearch)
    );
  }, [search]);

  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const {
    audioItem,
    currentAudioUrl,
    isPlaying,
    shouldAutoPlay,
    setShouldAutoPlay,
    setAudioItem,
    setCurrentAudioUrl,
    setIsPlaying,
    setPlayer,
    setCurrentTime,
    setDuration,
    setDidJustFinish,
    loadFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    initializeCache,
    getCachedAudioUrl,
    cacheAudio,
    isAudioCachedSync,
    activeScreen,
    setActiveScreen,
  } = useAudioStore();

  useEffect(() => {
    setActiveScreen("audio");
  }, []);

  const player = useAudioPlayer(currentAudioUrl || "");
  const audioStatus = useAudioPlayerStatus(player);

  const { currentTime, duration, didJustFinish } = audioStatus;

  useEffect(() => {
    if (player) setPlayer(player);

    Promise.all([loadFavorites(), initializeCache()]).catch(
      console.error
    );

    const setAudioModeSetUp = async () => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionModeAndroid: "doNotMix",
        interruptionMode: "doNotMix",
      });
    };
    setAudioModeSetUp();
  }, [player]);

  useEffect(() => {
    if (audioStatus?.isLoaded) {
      setCurrentTime(currentTime);
      setDuration(duration);
      setIsPlaying(audioStatus.playing);
      setDidJustFinish(didJustFinish || false);
    }
  }, [
    audioStatus?.isLoaded,
    currentTime,
    duration,
    audioStatus?.playing,
    didJustFinish,
  ]);

  useEffect(() => {
    if (currentAudioUrl && shouldAutoPlay) {
      const playAudio = async () => {
        try {
          await player.seekTo(0);
          await player.play();
          setIsPlaying(true);
        } catch (err) {
          console.error("Error playing audio:", err);
        } finally {
          setShouldAutoPlay(false);
        }
      };
      playAudio();
    }
  }, [currentAudioUrl, shouldAutoPlay]);

  useEffect(() => {
    if (didJustFinish && activeScreen === "audio") {
      player.pause();
      player.seekTo(0);
      setIsPlaying(false);
      handleNext(true);
    }
  }, [didJustFinish, activeScreen]);

  const handlePress = useCallback(
    async (
      url: string,
      title: string,
      id: string,
      reciter: string
    ) => {
      const newAudio = { url, title, id, reciter };
      setAudioItem(newAudio);

      try {
        const audioUri = await getCachedAudioUrl(id, url);

        if (audioUri !== currentAudioUrl) {
          setCurrentAudioUrl(audioUri);
          setShouldAutoPlay(true);

          if (!isAudioCachedSync(id)) {
            cacheAudio(id, url).catch(console.error);
          }
        } else if (!isPlaying) {
          await player.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error(
          `❌ Error handling audio playback for ${id}:`,
          error
        );
        setCurrentAudioUrl(url);
        setShouldAutoPlay(true);
      }
    },
    [
      currentAudioUrl,
      isPlaying,
      player,
      setAudioItem,
      setCurrentAudioUrl,
      setShouldAutoPlay,
      setIsPlaying,
      getCachedAudioUrl,
      cacheAudio,
      isAudioCachedSync,
    ]
  );

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

  const handleNext = useCallback(
    async (autoTriggered = false) => {
      const currentIndex = quranAudioList.findIndex(
        (item) => item.id === audioItem?.id
      );

      if (
        currentIndex === -1 ||
        currentIndex === quranAudioList.length - 1
      ) {
        console.log(
          "Reached the end of the Quran audio list. No next track."
        );
        return;
      }

      const nextIndex = currentIndex + 1;
      const nextAudio = quranAudioList[nextIndex];

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

        preCacheAdjacentTracks(nextIndex);

        setShouldAutoPlay(true);
      } catch (error) {
        console.error("❌ Error switching to next track:", error);
        setCurrentAudioUrl(nextAudio.url);
        setShouldAutoPlay(autoTriggered);
      }
    },
    [
      audioItem,
      player,
      isPlaying,
      setAudioItem,
      setCurrentAudioUrl,
      setIsPlaying,
      setShouldAutoPlay,
      getCachedAudioUrl,
      quranAudioList,
    ]
  );

  const handlePrevious = useCallback(async () => {
    const currentIndex = quranAudioList.findIndex(
      (item) => item.id === audioItem?.id
    );

    if (currentIndex === -1 || currentIndex === 0) {
      console.log(
        "Reached the beginning of the Quran audio list. No previous track."
      );
      return;
    }

    const prevIndex = currentIndex - 1;
    const prevAudio = quranAudioList[prevIndex];

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

      preCacheAdjacentTracks(prevIndex);

      setShouldAutoPlay(true);
    } catch (error) {
      console.error("❌ Error switching to previous track:", error);
      setCurrentAudioUrl(prevAudio.url);
      setShouldAutoPlay(true);
    }
  }, [
    audioItem,
    player,
    isPlaying,
    setAudioItem,
    setCurrentAudioUrl,
    setIsPlaying,
    setShouldAutoPlay,
    getCachedAudioUrl,
    quranAudioList,
  ]);

  const preCacheAdjacentTracks = useCallback(
    (currentIndex: number) => {
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
    },
    [cacheAudio, isAudioCachedSync]
  );

  console.log("Audio: ", activeScreen);

  const navigateToPlay = useCallback(
    (id: string, title: string, url: string, reciter: string) => {
      router.push(
        `/play/${id}?title=${encodeURIComponent(title)}&url=${encodeURIComponent(
          url
        )}&reciter=${encodeURIComponent(reciter)}&from=${encodeURIComponent("audio")}`
      );
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof quranAudioList)[0] }) => {
      const itemIsFavorite = isFavorite(item.id);
      const itemIsCached = isAudioCachedSync(item.id);

      return (
        <AudioBtn
          title={item.title}
          reciter={item.reciter}
          url={item.url}
          id={item.id}
          onPress={() =>
            handlePress(item.url, item.title, item.id, item.reciter)
          }
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
      handlePress,
      removeFavorite,
      addFavorite,
    ]
  );

  const keyExtractor = useCallback(
    (item: (typeof quranAudioList)[0]) => item.id,
    []
  );

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
      <View className="flex-1 justify-center items-center">
        <Text
          className="text-base"
          style={{
            color: isDark
              ? themeColors.dark.text
              : themeColors.light.text,
          }}
        >
          No results found
        </Text>
      </View>
    ),
    [isDark]
  );

  return (
    <SafeAreaView
      className="flex-1 w-full px-5 h-screen overflow-hidden relative"
      style={{
        backgroundColor: isDark
          ? themeColors.dark.background
          : themeColors.light.background,
      }}
    >
      <OrientationLocker orientation={PORTRAIT} />
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
          Audios
        </Text>

        <SearchBar
          placeholder="Search"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={filteredAudios}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={() => ItemSeparator}
        renderItem={renderItem}
        ListEmptyComponent={EmptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 280 }}
        className="flex-1 mt-10 w-full min-h-screen"
      />

      {audioItem?.url && (
        <BottomControl
          title={audioItem.title}
          isPlaying={isPlaying}
          onPressPlayPauseBtn={handlePausePlay}
          onPressNextBtn={() => handleNext(false)}
          onPressPrevBtn={handlePrevious}
          onNavigate={() =>
            navigateToPlay(
              audioItem.id,
              audioItem.title,
              audioItem.url,
              audioItem.reciter || "Hafiz Yahya Ibrahim Muhammad"
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

export default AudioScreen;
