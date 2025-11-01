import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface NetworkErrorModalProps {
  visible: boolean;
  onRetry: () => void;
  onDismiss: () => void;
  message?: string;
}

const NetworkErrorModal: React.FC<NetworkErrorModalProps> = ({
  visible,
  onRetry,
  onDismiss,
  message = "Unable to connect to the internet. Please check your connection and try again.",
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark
                ? themeColors.dark.card
                : themeColors.light.card,
              shadowColor: isDark ? "#000" : "#666",
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDark
                  ? "rgba(255, 77, 77, 0.1)"
                  : "rgba(255, 77, 77, 0.1)",
              },
            ]}
          >
            <Ionicons
              name="wifi-outline"
              size={40}
              color={isDark ? "#ff4d4d" : "#e74c3c"}
            />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              {
                color: isDark
                  ? themeColors.dark.text
                  : themeColors.light.text,
              },
            ]}
          >
            No Internet Connection
          </Text>

          {/* Message */}
          <Text
            style={[
              styles.message,
              {
                color: isDark
                  ? themeColors.dark.textLight
                  : themeColors.light.textLight,
              },
            ]}
          >
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                {
                  backgroundColor: isDark
                    ? themeColors.dark.background
                    : themeColors.light.background,
                  borderColor: isDark
                    ? themeColors.dark.textLight
                    : themeColors.light.textLight,
                },
              ]}
              onPress={onDismiss}
            >
              <Text
                style={[
                  styles.buttonText,
                  styles.secondaryButtonText,
                  {
                    color: isDark
                      ? themeColors.dark.textLight
                      : themeColors.light.textLight,
                  },
                ]}
              >
                Dismiss
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                {
                  backgroundColor: isDark
                    ? themeColors.dark.primary
                    : themeColors.light.primary,
                },
              ]}
              onPress={onRetry}
            >
              <Text
                style={[
                  styles.buttonText,
                  styles.primaryButtonText,
                  { color: isDark ? themeColors.dark.text : "#fff" },
                ]}
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "NunitoSans-Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: "NunitoSans-Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    borderWidth: 0,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "NunitoSans-SemiBold",
  },
  primaryButtonText: {
    color: "#fff",
  },
  secondaryButtonText: {
    // Color is set dynamically
  },
});

export default NetworkErrorModal;
