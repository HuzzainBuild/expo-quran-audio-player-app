import SearchBar from "@/components/SearchBar";
import SurahCard from "@/components/SurahCard";
import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
} from "react-native";
import {
  OrientationLocker,
  PORTRAIT,
} from "react-native-orientation-locker";
import { SafeAreaView } from "react-native-safe-area-context";

const Quran = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const handleSearch = (text: string) => setSearch(text);
  const [loading, setLoading] = useState(true);

  const { theme } = useThemeStore();

  const isDark = theme === "dark";

  const [surahData, setSurahData] = useState<any[]>([]);

  useEffect(() => {
    const fetchSurah = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://api.alquran.cloud/v1/surah",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (data.status === "OK") {
          setSurahData(data.data);
        } else {
          console.warn("Error fetching surahs:", data);
        }
      } catch (error) {
        console.error("Network error fetching surahs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurah();
  }, []);

  const handlePress = (name: string, number: number) => {
    router.push(
      `/quran/[verse]?name=${encodeURIComponent(name)}&surahNumber=${encodeURIComponent(
        number
      )}`
    );
  };

  const filteredSurah = surahData.filter((item) => {
    const title = item?.englishName?.toLowerCase() || "";
    const query = search?.toLowerCase().trim() || "";

    if (!query) return true;

    return title.includes(query);
  });

  return (
    <SafeAreaView
      className="flex-1 w-full bg-white px-5 m-h-screen overflow-hidden"
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
          Read Qur'an
        </Text>

        <SearchBar
          placeholder="Search"
          value={search}
          onChangeText={handleSearch}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#0c5b34" />
        ) : (
          <FlatList
            data={search.length > 0 ? filteredSurah : surahData}
            keyExtractor={(item) => item.name}
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
              <SurahCard
                name={item.name}
                englishName={item.englishName}
                number={item.number}
                numberOfAyahs={item.numberOfAyahs}
                revelationType={item.revelationType}
                englishNameTranslation={item.englishNameTranslation}
                handlePressBtn={() =>
                  handlePress(item.name, item.number)
                }
              />
            )}
            ListEmptyComponent={() => (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-600 text-base">
                  No results found
                </Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 220 }}
            className="mt-8 w-full"
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default Quran;
