import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export default function InitialSkeleton({
  isInitial,
  isDark,
}: {
  isInitial: boolean;
  isDark: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  if (!isInitial) return null;

  const boxStyle = {
    backgroundColor: isDark ? "#131c2d" : "#fff",
    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
  };

  return (
    <View style={{ flexDirection: "column", gap: 12 }} className="my-10">
      {/* Top grid of 4 */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 4,
        }}
      >
        {[...Array(4)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              {
                borderWidth: 1,
                borderRadius: 16,
                height: 80,
                flexBasis: "48%", // two per row
                padding: 16,
                opacity: pulseAnim,
              },
              boxStyle,
            ]}
          />
        ))}
      </View>

      {/* Bottom grid of 4 (PostCardSkeletons) */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {[...Array(4)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              {
                borderWidth: 1,
                borderRadius: 16,
                height: 120,
                flexBasis: "100%", // one per row
                marginBottom: 12,
                opacity: pulseAnim,
              },
              boxStyle,
            ]}
          />
        ))}
      </View>
    </View>
  );
}
