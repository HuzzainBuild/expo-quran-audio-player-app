import {
  nextIcon,
  pauseIcon,
  playIcon,
  previousIcon,
} from "@/constant/icons";
import { icon } from "@/constant/images";
import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface BottomControlProps {
  title?: string;
  isPlaying?: Boolean;
  onPressPlayPauseBtn?: () => void;
  onPressNextBtn?: () => void;
  onPressPrevBtn?: () => void;
  onNavigate?: () => void;
}

const BottomControl = ({
  title,
  isPlaying,
  onPressPlayPauseBtn,
  onPressNextBtn,
  onPressPrevBtn,
  onNavigate,
}: BottomControlProps) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <TouchableOpacity
      className="absolute rounded-xl w-full mx-auto z-10"
      style={{
        bottom: 120,
        paddingVertical: 8,
        paddingHorizontal: 15,
        left: 18,
        backgroundColor: isDark
          ? themeColors.dark.primary
          : themeColors.light.primary,
      }}
      onPress={onNavigate}
    >
      <View className="flex flex-row justify-between">
        <View className="flex flex-row gap-4 items-center">
          <Image
            source={icon}
            style={{ width: 30, height: 30, borderRadius: 6 }}
            resizeMode="cover"
          />
          <Text
            className="text-base "
            style={{
              fontFamily: "NunitoSans-Bold",
              color: isDark
                ? themeColors.dark.text
                : themeColors.dark.text,
            }}
          >
            {title}
          </Text>
        </View>
        <View className="flex flex-row ">
          <TouchableOpacity
            onPress={onPressPrevBtn}
            style={{
              padding: 15,
            }}
          >
            <Image
              source={previousIcon}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
              tintColor={
                isDark ? themeColors.dark.text : themeColors.dark.text
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPressPlayPauseBtn}
            style={{
              padding: 15,
              backgroundColor: "#638f72",
              borderRadius: "100%",
            }}
          >
            <Image
              source={isPlaying ? pauseIcon : playIcon}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
              tintColor={
                isDark ? themeColors.dark.text : themeColors.dark.text
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPressNextBtn}
            style={{
              padding: 15,
            }}
          >
            <Image
              source={nextIcon}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
              tintColor={
                isDark ? themeColors.dark.text : themeColors.dark.text
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default BottomControl;
