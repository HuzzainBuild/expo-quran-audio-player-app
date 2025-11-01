import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface SurahProps {
  number: number;
  englishName: string;
  name: string;
  revelationType: string;
  numberOfAyahs: string;
  englishNameTranslation: string;

  handlePressBtn?: () => void;
}

const SurahCard = ({
  number,
  englishName,
  name,
  revelationType,
  numberOfAyahs,
  englishNameTranslation,
  handlePressBtn,
}: SurahProps) => {
  const { theme, toggleTheme } = useThemeStore();

  const isDark = theme === "dark";

  return (
    <View className="flex-row items-center">
      <TouchableOpacity
        onPress={handlePressBtn}
        className="py-3 px-2 w-full flex flex-row gap-4 items-center"
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark
              ? themeColors.dark.card
              : themeColors.light.card,
          }}
        >
          <Text
            style={{
              color: isDark
                ? themeColors.dark.text
                : themeColors.light.text,
            }}
          >
            {number}
          </Text>
        </View>

        <View className="flex flex-col w-full">
          <View className="flex flex-row gap-2 items-center">
            <Text
              className="text-2xl  text-black py-2 "
              style={{
                fontSize: 16,
                fontFamily: "NunitoSans-SemiBold",
                color: isDark
                  ? themeColors.dark.text
                  : themeColors.light.text,
              }}
            >
              {englishName} -
            </Text>

            <Text
              className="text-2xl font-semibold text-black "
              style={{
                fontSize: 16,
                fontFamily: "AmiriQuran-Regular",
                color: isDark
                  ? themeColors.dark.text
                  : themeColors.light.text,
              }}
            >
              {name}
            </Text>
          </View>

          <View className="flex flex-row justify-between w-full">
            <Text
              className="text-gray-600 text-base "
              style={{
                fontFamily: "NunitoSans-Regular",
                color: isDark
                  ? themeColors.dark.textLight
                  : themeColors.light.textLight,
              }}
            >
              {englishNameTranslation}
            </Text>
            <Text
              className="text-gray-600 text-base "
              style={{
                fontFamily: "NunitoSans-Regular",
                marginRight: 50,
                color: isDark
                  ? themeColors.dark.textLight
                  : themeColors.light.textLight,
              }}
            >
              {revelationType === "Meccan" ? "Makki" : "Madani"} -{" "}
              {numberOfAyahs} Ayahs
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default SurahCard;
