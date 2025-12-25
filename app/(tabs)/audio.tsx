import AudioBtn from "@/components/AudioBtn";
import BottomControl from "@/components/BottomControl";
import SearchBar from "@/components/SearchBar";
import { quranAudioList } from "@/constant/quranAudioList";
import { useAudioStore } from "@/store/audioStore";
import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
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
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const {
    audioItem,
    isPlaying,
    setAudioItem,
    setPlaylist,
    playNext,
    playPrevious,
    togglePlayPause,
    toggleLooping,
    toggleShuffling,
    isFavorite,
    addFavorite,
    removeFavorite,
    seekTo,
  } = useAudioStore();

  useEffect(() => {
    setPlaylist(quranAudioList);
  }, [setPlaylist]);

  const handleSearch = useCallback(
    (text: string) => setSearch(text),
    []
  );

  const filteredAudios = useMemo(() => {
    if (search.length === 0) return quranAudioList;
    return quranAudioList.filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handlePress = useCallback(
    async (item: any) => {
      await setAudioItem(item);
    },
    [setAudioItem]
  );

  const navigateToPlay = useCallback(
    (id: string, title: string, url: string, reciter: string) => {
      router.push(
        `/play/${id}?title=${encodeURIComponent(
          title
        )}&url=${encodeURIComponent(url)}&reciter=${encodeURIComponent(
          reciter
        )}&from=audio`
      );
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <AudioBtn
        id={item.id}
        url={item.url}
        title={item.title}
        reciter={item.reciter}
        onPress={() => handlePress(item)}
        isFav={isFavorite(item.id)}
        onToggleFavorite={() =>
          isFavorite(item.id)
            ? removeFavorite(item.id)
            : addFavorite(item)
        }
      />
    ),
    [handlePress, isFavorite, removeFavorite, addFavorite]
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
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 280 }}
        showsVerticalScrollIndicator={false}
        className="flex-1 mt-10 w-full min-h-screen"
      />

      {audioItem && (
        <BottomControl
          title={audioItem.title}
          isPlaying={isPlaying}
          onPressPlayPauseBtn={togglePlayPause}
          onPressNextBtn={playNext}
          onPressPrevBtn={playPrevious}
          onNavigate={() =>
            navigateToPlay(
              audioItem.id,
              audioItem.title,
              audioItem.url,
              audioItem.reciter
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

export default AudioScreen;

