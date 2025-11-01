import { toArabicNumber } from "@/constant/contant";
import { borderGreen } from "@/constant/images";
import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Verses = () => {
  const { name, surahNumber } = useLocalSearchParams();
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);

  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  useEffect(() => {
    const fetchSurahVerses = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.alquran.cloud/v1/surah/${surahNumber}`
        );
        const data = await response.json();
        if (data.status === "OK") {
          setVerses(data.data.ayahs);
        }
      } catch (error) {
        console.error("Error fetching verses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (surahNumber) fetchSurahVerses();
  }, [surahNumber]);

  const shouldShowBismillah =
    name !== "سُورَةُ التَّوۡبَةِ" && name !== "سُورَةُ ٱلْفَاتِحَةِ";

  return (
    <SafeAreaView
      className="flex-1 w-full overflow-hidden"
      style={{
        backgroundColor: isDark
          ? themeColors.dark.background
          : themeColors.light.background,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Surah Header */}
        <View className="items-center mb-8">
          <ImageBackground
            source={borderGreen}
            resizeMode="stretch"
            className="py-2 w-full items-center justify-center"
            style={{ height: 90 }}
          >
            <Text
              style={{
                fontFamily: "AmiriQuran-Regular",
                fontSize: 26,
                color: "#1C1C1C",
              }}
            >
              {name}
            </Text>
          </ImageBackground>
        </View>

        {/* Bismillah */}
        {shouldShowBismillah && (
          <Text
            style={{
              textAlign: "center",
              fontFamily: "AmiriQuran-Regular",
              fontSize: 24,
              marginBottom: 25,

              color: isDark
                ? themeColors.dark.text
                : themeColors.light.primary,
            }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        )}

        {/* Verses */}
        {loading ? (
          <ActivityIndicator size="large" color="#0c5b34" />
        ) : (
          <Text
            style={{
              fontFamily: "AmiriQuran-Regular",
              fontSize: 28,
              lineHeight: 60,
              textAlign: "justify",
              direction: "rtl",
              writingDirection: "rtl",
              flexWrap: "wrap",
              color: isDark
                ? themeColors.dark.text
                : themeColors.light.text,
            }}
            className={`${shouldShowBismillah ? "mt-0" : "mt-10"}`}
          >
            {verses
              .map((ayah) => {
                const isBismillahVerse =
                  ayah.numberInSurah === 1 &&
                  ayah.text.startsWith(
                    "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ"
                  );

                const ayahText =
                  isBismillahVerse && shouldShowBismillah
                    ? ayah.text
                        .replace(
                          "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ",
                          ""
                        )
                        .trim()
                    : ayah.text.trim();

                return `${ayahText} ﴿${toArabicNumber(ayah.numberInSurah)}﴾`;
              })
              .join(" ")}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Verses;
