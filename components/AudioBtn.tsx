import { loveActiveIcon, loveIcon } from "@/constant/icons";
import { icon } from "@/constant/images";
import { useAudioStore } from "@/store/audioStore";
import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface AudioBtnProps {
  id: string;
  title: string;
  reciter: string;
  url: string;
  isPlaying?: boolean;
  isFav: boolean;

  onPress?: () => void;
  handlePlayPauseBtn?: () => void;
  onToggleFavorite?: () => void;
}

const AudioBtn = ({
  title,
  id,
  url,
  reciter,
  isPlaying,
  isFav,
  handlePlayPauseBtn,
  onPress,
  onToggleFavorite,
}: AudioBtnProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const { audioItem } = useAudioStore();

  const { theme } = useThemeStore();

  const isDark = theme === "dark";

  const handleFavoriteToggle = () => {
    setIsFavorite((prev) => !prev);
  };

  return (
    <>
      <View
        className="flex-row items-center justify-between py-3 gap-4"
        style={{
          backgroundColor: isDark
            ? themeColors.dark.background
            : themeColors.light.background,
        }}
      >
        <View className="w-full h-full">
          <TouchableOpacity
            className="flex-row items-center gap-4 w-full justify-between px-2"
            onPress={onPress}
          >
            <View className="flex-row items-center gap-4">
              <Image
                source={icon}
                style={{ width: 35, height: 35, borderRadius: 6 }}
                resizeMode="cover"
              />
              <View className="flex flex-col ">
                <Text
                  className="text-base font-semibold py-1"
                  style={{
                    fontSize: 16,
                    fontFamily: "NunitoSans-SemiBold",
                    color:
                      isDark && audioItem?.title === title
                        ? themeColors.dark.primary
                        : isDark && audioItem?.title !== title
                          ? themeColors.dark.text
                          : !isDark && audioItem?.title === title
                            ? themeColors.light.primary
                            : themeColors.light.text,
                  }}
                >
                  {title}
                </Text>
                <Text
                  className="text-sm text-gray-600"
                  style={{
                    fontFamily: "NunitoSans-Regular",
                    color: isDark
                      ? themeColors.dark.textLight
                      : themeColors.light.textLight,
                  }}
                >
                  {reciter}
                </Text>
              </View>
            </View>

            <View className="">
              <TouchableOpacity
                className="p-2"
                onPress={onToggleFavorite}
              >
                <Image
                  source={isFav ? loveActiveIcon : loveIcon}
                  className="w-6 h-5"
                  resizeMode="contain"
                  tintColor={
                    isDark
                      ? themeColors.dark.primary
                      : themeColors.dark.primary
                  }
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default AudioBtn;
