import { audioCacheManager } from "@/store/audioCache";
import { useThemeStore } from "@/store/themeStore";
import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";

export const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showOffline, setShowOffline] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  useEffect(() => {
    const checkNetwork = async () => {
      const online = await audioCacheManager.isOnline();
      setIsOnline(online);

      if (!online && !showOffline) {
        setShowOffline(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (online && showOffline) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowOffline(false));
      }
    };

    // Check immediately
    checkNetwork();

    // Check every 10 seconds
    const interval = setInterval(checkNetwork, 10000);

    return () => clearInterval(interval);
  }, [showOffline]);

  if (!showOffline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#e74c3c" : "#c0392b",
          opacity: fadeAnim,
        },
      ]}
    >
      <Text style={styles.text}>
        📶 You're offline. Some features may be limited.
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: 14,
    fontFamily: "NunitoSans-SemiBold",
    textAlign: "center",
  },
});

export default NetworkStatusIndicator;
