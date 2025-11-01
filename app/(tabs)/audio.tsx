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

  const { theme, toggleTheme } = useThemeStore();

  const isDark = theme === "dark";

  // ✅ Zustand global states
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
  } = useAudioStore();

  const player = useAudioPlayer(currentAudioUrl || "");
  const audioStatus = useAudioPlayerStatus(player);

  const currentTime = audioStatus.currentTime;
  const duration = audioStatus.duration;
  const didJustFinish = audioStatus.didJustFinish;

  useEffect(() => {
    if (player) {
      setPlayer(player);
    }
  }, [player]);

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    if (audioStatus?.isLoaded) {
      setCurrentTime(currentTime);
      setDuration(duration);
      setIsPlaying(audioStatus.playing);
      setDidJustFinish(didJustFinish || false);
    }
  }, [currentTime, duration, didJustFinish]);

  useEffect(() => {
    const setAudioModeSetUp = async () => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionModeAndroid: "duckOthers",
        interruptionMode: "mixWithOthers",
      });
    };
    setAudioModeSetUp();
  }, []);

  useEffect(() => {
    if (didJustFinish && player) {
      (async () => {
        try {
          await player.pause();
          await player.seekTo(0);
          setIsPlaying(false);
        } catch (error) {
          console.error(
            "Error resetting audio after completion:",
            error
          );
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

    if (url !== currentAudioUrl) {
      setCurrentAudioUrl(url);
      setShouldAutoPlay(true);
    } else {
      if (!isPlaying) {
        await player.play();
        setIsPlaying(true);
      }
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

  const handleNext = async () => {
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

    setShouldAutoPlay(true);
    setAudioItem(nextAudio);
    setCurrentAudioUrl(nextAudio.url);
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

    setShouldAutoPlay(true);
    setAudioItem(prevAudio);
    setCurrentAudioUrl(prevAudio.url);
  };

  useEffect(() => {
    if (currentAudioUrl && shouldAutoPlay) {
      const playAudio = async () => {
        try {
          await player.seekTo(0);
          await player.play();
          setIsPlaying(true);
          console.log("Playing:");
        } catch (err) {
          console.error("Error playing audio:", err);
        } finally {
          setShouldAutoPlay(false);
        }
      };
      playAudio();
    }
  }, [currentAudioUrl]);

  useEffect(() => {
    if (audioItem?.url) {
      console.log("Global Audio Item Updated:");
    }
  }, [audioItem]);

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
        keyExtractor={(item) => item.title}
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

export default AudioScreen;
