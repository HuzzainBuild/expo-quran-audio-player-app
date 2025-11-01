import { homebg, quranIcon } from "@/constant/images";
import { Link } from "expo-router";
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white w-full h-screen overflow-hidden ">
      <ImageBackground
        source={homebg}
        className="flex-1 w-full h-full justify-center items-center flex-col gap-5 px-5"
      >
        <View
          className="flex flex-col justify-center items-center gap-8"
          style={{ paddingHorizontal: 20 }}
        >
          <Image
            source={quranIcon}
            className="w-[120px] h-[120px] z-10"
          />

          <View className="items-center mt-5 flex flex-col gap-5">
            <Text
              className="text-primary-900 font-nunitosans-bold"
              style={{
                fontFamily: "NunitoSans-Bold",
                fontSize: 30,
                textAlign: "center",
              }}
            >
              Qur'an Audio Player
            </Text>
            <Text
              className="text-gray-600 text-center leading-6"
              style={{
                fontFamily: "NunitoSans-SemiBold",
              }}
            >
              Listen, learn & reflect with quran everyday. A
              recitation by Hafiz Yahya Ibrahim Muhammad
            </Text>
          </View>
        </View>

        <View
          className="w-full items-center mt-10"
          style={{ paddingHorizontal: 20 }}
        >
          <TouchableOpacity className="w-full ">
            <Link
              href={"/audio"}
              className="bg-primary-900 px-10 py-5 rounded-full text-center text-white  "
              style={{
                fontFamily: "NunitoSans-SemiBold",
              }}
            >
              Continue
            </Link>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
