import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import React from "react";
import { Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function SettingsScreen() {
  const { theme, toggleTheme } = useThemeStore();

  const isDark = theme === "dark";

  return (
    <SafeAreaView
      style={{
        backgroundColor: isDark
          ? themeColors.dark.background
          : themeColors.light.background,
      }}
      className="flex-1 w-full  px-5 overflow-hidden "
    >
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
        Settings
      </Text>

      <View
        style={{
          marginTop: 20,
          borderRadius: 20,
          backgroundColor: isDark
            ? themeColors.dark.card
            : themeColors.light.card,
        }}
        className="flex flex-row items-center justify-between py-3 px-4"
      >
        <Text
          style={{
            fontFamily: "NunitoSans-SemiBold",
            color: isDark
              ? themeColors.dark.text
              : themeColors.light.text,
            fontSize: 16,
          }}
        >
          Dark Mode
        </Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: "#ccc", true: "#95b49f" }}
          thumbColor={isDark ? "#497e5d" : "#f4f3f4"}
        />
      </View>
    </SafeAreaView>
  );
}
