import { LinearGradient } from "expo-linear-gradient";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import React from "react";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
}

export default function CustomButton({
  title,
  onPress,
}: CustomButtonProps): React.ReactElement {
  return (
    <Button
      variant="ghost"
      // size="lg"
      style={{
        backgroundColor: "transparent",
        padding: 0,
        overflow: "hidden",
      }}
      onPress={onPress}
    >
      <LinearGradient
        colors={["#4A5EB2", "#8b0ac8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          flex: 1,
          paddingVertical: 14,
          //   paddingHorizontal: 20,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 15,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>{title}</Text>
      </LinearGradient>
    </Button>
  );
}
