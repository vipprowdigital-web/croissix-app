import { useColor } from "@/hooks/useColor";
import { View, Text } from "react-native";

export const Footer = () => {
  const textMuted = useColor("textMuted");
  return (
    <View
      style={{ marginTop: 20 }}
      className="flex flex-col justify-center items-center"
    >
      <Text style={{ color: textMuted, fontSize: 12 }}>
        Croissix · Beta Version 0.01
      </Text>
      <Text style={{ color: textMuted, fontSize: 12 }}>from Vipprow</Text>
    </View>
  );
};
