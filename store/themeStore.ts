import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

type ThemeMode = "light" | "dark";

interface ThemeStoreState {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  theme: "light",

  setTheme: (mode) => {
    set({ theme: mode });
    AsyncStorage.setItem("app_theme", mode);
  },

  toggleTheme: () => {
    const newMode = get().theme === "light" ? "dark" : "light";
    set({ theme: newMode });
    AsyncStorage.setItem("app_theme", newMode);
  },

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem("app_theme");
      if (saved === "dark" || saved === "light") {
        set({ theme: saved });
      }
    } catch (err) {
      console.error("Error loading theme:", err);
    }
  },
}));
