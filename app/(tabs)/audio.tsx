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
import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AudioScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = (text: string) => setSearch(text);
  const filteredAudios = quranAudioList.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

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
    // 🔄 Caching functions
    initializeCache,
    getCachedAudioUrl,
    cacheAudio,
    isAudioCached,
  } = useAudioStore();

  const player = useAudioPlayer(currentAudioUrl || "");
  const audioStatus = useAudioPlayerStatus(player);

  const { currentTime, duration, didJustFinish } = audioStatus;

  // ⏳ Setup player, load favorites, and initialize cache
  useEffect(() => {
    if (player) setPlayer(player);
    loadFavorites();
    initializeCache(); // 🎯 Initialize caching system

    const setAudioModeSetUp = async () => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionModeAndroid: "duckOthers",
        interruptionMode: "doNotMix",
      });
    };
    setAudioModeSetUp();
  }, [player]);

  // 🕒 Update store with audio progress
  useEffect(() => {
    if (audioStatus?.isLoaded) {
      setCurrentTime(currentTime);
      setDuration(duration);
      setIsPlaying(audioStatus.playing);
      setDidJustFinish(didJustFinish || false);
    }
  }, [audioStatus]);

  // ▶️ Auto-play when shouldAutoPlay changes
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

  // ⏭️ Auto-next when current finishes
  useEffect(() => {
    if (didJustFinish) {
      (async () => {
        try {
          await handleNext(true); // true = triggered automatically
        } catch (error) {
          console.error("Error during auto-next:", error);
        }
      })();
    }
  }, [didJustFinish]);

  const handlePress = async (
    url: string,
    title: string,
    id: string,
    reciter: string
  ) => {
    const newAudio = { url, title, id, reciter };
    setAudioItem(newAudio);

    try {
      // 🎯 Get cached URL (returns remote URL if not cached)
      const audioUri = await getCachedAudioUrl(id, url);

      console.log(
        `🎯 Audio ${id} - Using URI: ${audioUri === url ? "REMOTE" : "CACHED"}`
      );

      // 🎯 If URL changes, update and auto-play
      if (audioUri !== currentAudioUrl) {
        setCurrentAudioUrl(audioUri);
        setShouldAutoPlay(true);

        // 🎯 Cache audio in background if not already cached
        const isCached = await isAudioCached(id);
        if (!isCached) {
          console.log(`📥 Starting background cache for: ${title}`);
          cacheAudio(id, url).then((success) => {
            if (success) {
              console.log(`✅ Successfully cached: ${title}`);
            } else {
              console.log(`❌ Failed to cache: ${title}`);
            }
          });
        }
      } else if (!isPlaying) {
        // 🎯 Resume playback if same URL and not playing
        await player.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error(
        `❌ Error handling audio playback for ${id}:`,
        error
      );
      // 🎯 Fallback to remote URL on error
      setCurrentAudioUrl(url);
      setShouldAutoPlay(true);
    }
  };

  /**
   * ⏸️ Handles play/pause toggle
   */
  const handlePausePlay = async () => {
    if (!player) return console.error("Player not initialized");

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

  const handleNext = async (autoTriggered = false) => {
    const currentIndex = quranAudioList.findIndex(
      (item) => item.id === audioItem?.id
    );
    if (currentIndex === -1) return;

    const nextIndex =
      currentIndex === quranAudioList.length - 1
        ? 0
        : currentIndex + 1;
    const nextAudio = quranAudioList[nextIndex];

    if (player && isPlaying) {
      await player.pause();
      await player.seekTo(0);
      setIsPlaying(false);
    }

    setAudioItem(nextAudio);

    // 🎯 Get cached URL for next audio
    const nextAudioUri = await getCachedAudioUrl(
      nextAudio.id,
      nextAudio.url
    );
    setCurrentAudioUrl(nextAudioUri);

    // 🎯 Pre-cache adjacent tracks in background
    preCacheAdjacentTracks(nextIndex);

    // If auto-triggered by finish event, start immediately
    if (autoTriggered) {
      setShouldAutoPlay(true);
    }
  };

  const handlePrevious = async () => {
    const currentIndex = quranAudioList.findIndex(
      (item) => item.id === audioItem?.id
    );
    if (currentIndex === -1) return;

    const prevIndex =
      currentIndex === 0
        ? quranAudioList.length - 1
        : currentIndex - 1;
    const prevAudio = quranAudioList[prevIndex];

    if (player && isPlaying) {
      await player.pause();
      await player.seekTo(0);
      setIsPlaying(false);
    }

    setAudioItem(prevAudio);

    // 🎯 Get cached URL for previous audio
    const prevAudioUri = await getCachedAudioUrl(
      prevAudio.id,
      prevAudio.url
    );
    setCurrentAudioUrl(prevAudioUri);

    // 🎯 Pre-cache adjacent tracks in background
    preCacheAdjacentTracks(prevIndex);

    setShouldAutoPlay(true);
  };

  const preCacheAdjacentTracks = (currentIndex: number) => {
    const nextIndex = (currentIndex + 1) % quranAudioList.length;
    const prevIndex =
      (currentIndex - 1 + quranAudioList.length) %
      quranAudioList.length;

    const nextAudio = quranAudioList[nextIndex];
    const prevAudio = quranAudioList[prevIndex];

    // 🎯 Cache adjacent tracks in background
    cacheAudio(nextAudio.id, nextAudio.url).then((success) => {
      if (success)
        console.log(`✅ Pre-cached next: ${nextAudio.title}`);
    });

    cacheAudio(prevAudio.id, prevAudio.url).then((success) => {
      if (success)
        console.log(`✅ Pre-cached previous: ${prevAudio.title}`);
    });
  };

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
      className="flex-1 w-full px-5 h-screen overflow-hidden relative"
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
          Audios
        </Text>

        <SearchBar
          placeholder="Search"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={search.length > 0 ? filteredAudios : quranAudioList}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 0.5,
              backgroundColor: isDark
                ? themeColors.dark.card
                : themeColors.light.card,
            }}
          />
        )}
        renderItem={({ item }) => (
          <AudioBtn
            title={item.title}
            reciter={item.reciter}
            url={item.url}
            id={item.id}
            onPress={() =>
              handlePress(item.url, item.title, item.id, item.reciter)
            }
            isFav={isFavorite(item.id)}
            onToggleFavorite={() =>
              isFavorite(item.id)
                ? removeFavorite(item.id)
                : addFavorite(item)
            }
            isCached={false}
          />
        )}
        ListEmptyComponent={() => (
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
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
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
