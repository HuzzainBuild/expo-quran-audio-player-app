import React from "react";
import { Image, Pressable } from "react-native";

interface IconButtonProps {
  icon: any;
  onPress: () => void;
  tint?: string;
  bg?: string;
  pressedBg?: string; // Background color when pressed
  size?: number;
  padding?: number;
  borderRadius?: number;
  scaleOnPress?: boolean;
  activeIcon?: any; // For toggled states (like loop)
  isActive?: boolean; // For toggled states
  activeTint?: string; // Tint color when active
}

const IconButton = ({
  icon,
  onPress,
  tint = "#ffffff",
  bg = "transparent",
  pressedBg,
  size = 22,
  padding = 15,
  borderRadius = 10,
  scaleOnPress = true,
  activeIcon,
  isActive = false,
  activeTint,
}: IconButtonProps) => {
  // Determine which icon to show
  const displayIcon = isActive && activeIcon ? activeIcon : icon;

  // Determine tint color
  const displayTint = isActive && activeTint ? activeTint : tint;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed && pressedBg ? pressedBg : bg,
        padding: padding,
        borderRadius: borderRadius,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed && !pressedBg ? 0.7 : 1,
      })}
    >
      {({ pressed }) => (
        <Image
          source={displayIcon}
          style={{
            width: size,
            height: size,
            resizeMode: "contain",
            tintColor: displayTint,
            transform: [{ scale: pressed && scaleOnPress ? 0.9 : 1 }],
          }}
        />
      )}
    </Pressable>
  );
};

export default IconButton;
