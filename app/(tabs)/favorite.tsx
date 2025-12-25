import AudioBtn from "@/components/AudioBtn";
import BottomControl from "@/components/BottomControl";
import SearchBar from "@/components/SearchBar";
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
import { SafeAreaView } from "react-native-safe-area-context";

const FavoriteScreen = () => {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const {
    favorites,
    audioItem,
    isPlaying,
    setAudioItem,
    playNext,
    playPrevious,
    toggleLooping,
    isFavorite,
    addFavorite,
    removeFavorite,
    setPlaylist,
  } = useAudioStore();

  const sortedFavorites = useMemo(() => {
    return [...favorites].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [favorites]);

  const filteredFavorites = useMemo(() => {
    if (!search) return sortedFavorites;
    return sortedFavorites.filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [sortedFavorites, search]);

  useEffect(() => {
    setPlaylist(sortedFavorites);
  }, [setPlaylist]);

  const handlePress = useCallback(
    (item: any) => {
      setAudioItem(item);
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
        )}&from=favorites`
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
          Favorites
        </Text>
        <SearchBar
          placeholder="Search favorites"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredFavorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Text style={{ color: isDark ? "white" : "black" }}>
              No favorites yet.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 280 }}
        showsVerticalScrollIndicator={false}
        className="flex-1 mt-10 w-full min-h-screen"
      />

      {audioItem && (
        <BottomControl
          title={audioItem.title}
          isPlaying={isPlaying}
          onPressPlayPauseBtn={toggleLooping}
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

export default FavoriteScreen;
