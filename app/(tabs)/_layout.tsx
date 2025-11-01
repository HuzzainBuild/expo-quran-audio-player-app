import { Tabs } from "expo-router";
import { Image, Text, View } from "react-native";

import {
  audiosActiveIcon,
  audiosIcon,
  bookActiveIcon,
  bookIcon,
  favoriteActiveIcon,
  favoriteIcon,
  settingActiveIcon,
  settingIcon,
} from "@/constant/icons";
import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
const TabIcon = ({ focused, icons, title }: any) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <View
      className="flex flex-col w-full flex-1 justify-center items-center overflow-hidden"
      style={{
        minWidth: 100,
        minHeight: 100,
        marginTop: 22,
        gap: 2,
        backgroundColor: isDark
          ? themeColors.dark.background
          : themeColors.light.background,
      }}
    >
      <Image
        source={icons}
        style={{ width: 20, height: 20 }}
        resizeMode="contain"
        tintColor={
          focused && isDark
            ? "#ffffff"
            : focused && !isDark
              ? "#0c5b34"
              : !focused && isDark
                ? "#575757"
                : "#B0D4C2"
        }
      />

      <Text
        style={{
          color:
            focused && isDark
              ? themeColors.dark.text
              : focused && !isDark
                ? themeColors.light.primary
                : !focused && isDark
                  ? themeColors.dark.textLight
                  : "#B0D4C2",
          fontFamily: "NunitoSans-SemiBold",
        }}
        className={`text-base font-nunitosans-semibold`}
      >
        {title}
      </Text>
    </View>
  );
};

const _layout = () => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 5,
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          height: 110,
          overflow: "hidden",
          borderWidth: 1,
          paddingVertical: 10,
          position: "absolute",
          bottom: 0,
          borderTopWidth: 1,
          borderTopColor: isDark
            ? themeColors.dark.card
            : themeColors.light.card,
        },
      }}
    >
      <Tabs.Screen
        name="audio"
        options={{
          title: "Audio",
          headerShown: false,
          tabBarLabel: "Audio",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icons={focused ? audiosActiveIcon : audiosIcon}
              title="Audio"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorite"
        options={{
          title: "Favorite",
          headerShown: false,
          tabBarLabel: "Favorite",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icons={focused ? favoriteActiveIcon : favoriteIcon}
              title="Favorite"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: "Quran",
          headerShown: false,
          tabBarLabel: "Quran",

          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icons={focused ? bookActiveIcon : bookIcon}
              title="Read Qur'an"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          title: "Setting",
          headerShown: false,
          tabBarLabel: "Setting",

          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icons={focused ? settingActiveIcon : settingIcon}
              title="Setting"
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;
