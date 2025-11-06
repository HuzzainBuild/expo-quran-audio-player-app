import { useThemeStore } from "@/store/themeStore";
import { setAudioModeAsync } from "expo-audio";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import "./global.css";

export default function RootLayout() {
  const { theme, loadTheme } = useThemeStore();

  const [fontsLoaded, error] = useFonts({
    "AmiriQuran-Regular": require("../assets/fonts/AmiriQuran-Regular.ttf"),
    "NunitoSans-Regular": require("../assets/fonts/NunitoSans-Regular.ttf"),
    "NunitoSans-SemiBold": require("../assets/fonts/NunitoSans-SemiBold.ttf"),
    "NunitoSans-Bold": require("../assets/fonts/NunitoSans-Bold.ttf"),
  });

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  useEffect(() => {
    const setupAudioMode = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionModeAndroid: "doNotMix",
          interruptionMode: "doNotMix",
        });
        console.log("🎧 Audio mode set globally");
      } catch (err) {
        console.error("Error setting audio mode:", err);
      }
    };
    setupAudioMode();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="play/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="quran/[verse]"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
