import AudioBtn from "@/components/AudioBtn";
import BottomControl from "@/components/BottomControl";
import SearchBar from "@/components/SearchBar";
import { quranAudioList } from "@/constant/quranAudioList";
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
  } = useAudioStore();

  const router = useRouter();

  // Load favorites from AsyncStorage
  useEffect(() => {
    loadFavorites();
  }, []);

  // Handle play — navigate to play screen
  const handlePlay = (item: any) => {
    setAudioItem(item);
    setCurrentAudioUrl(item.url);
    setShouldAutoPlay(true);
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

    setAudioItem(nextAudio);
    setCurrentAudioUrl(nextAudio.url);
    setShouldAutoPlay(true);
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

    // stop old player
    if (player && isPlaying) {
      await player.pause();
      await player.seekTo(0);
      setIsPlaying(false);
    }

    // update new audio info
    setAudioItem(prevAudio);
    setCurrentAudioUrl(prevAudio.url);
    setShouldAutoPlay(true);
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
          Favorites
        </Text>
        <SearchBar
          placeholder="Search"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={favorites}
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
            <Text className="text-gray-600 text-base">
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
