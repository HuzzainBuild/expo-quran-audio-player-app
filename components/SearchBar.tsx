import { searchIcon } from "@/constant/icons";
import { useThemeStore } from "@/store/themeStore";
import { themeColors } from "@/style/theme";
import { Image, TextInput, View } from "react-native";

interface Props {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
}

const SearchBar = ({
  placeholder,
  value,
  onChangeText,
  onPress,
}: Props) => {
  const { theme, toggleTheme } = useThemeStore();

  const isDark = theme === "dark";

  return (
    <View
      className="flex-row items-center  rounded-xl px-4 py-1 w-full"
      style={{
        backgroundColor: isDark
          ? themeColors.dark.card
          : themeColors.light.card,
      }}
    >
      <Image
        source={searchIcon}
        style={{ width: 18, height: 18 }}
        resizeMode="contain"
      />
      <TextInput
        onPress={onPress}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        className="flex-1 ml-2 w-full "
        style={{
          fontFamily: "NunitoSans-Regular",
          color: isDark
            ? themeColors.dark.text
            : themeColors.light.text,
        }}
      />
    </View>
  );
};

export default SearchBar;
