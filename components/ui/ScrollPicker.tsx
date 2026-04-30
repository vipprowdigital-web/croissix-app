import React, { useRef, useEffect } from "react";
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ViewToken,
} from "react-native";

function ScrollPicker({
  items,
  selected,
  onSelect,
  isDark,
  text,
  textMuted,
}: {
  items: { label: string; value: number }[];
  selected: number;
  onSelect: (val: number) => void;
  isDark: boolean;
  text: string;
  textMuted: string;
}) {
  const ITEM_HEIGHT = 40;
  const VISIBLE_ITEMS = 3; // shows 3 rows, middle = selected
  const flatRef = useRef<FlatList>(null);

  // Scroll to selected on mount / when selected changes
  useEffect(() => {
    const index = items.findIndex((it) => it.value === selected);
    if (index >= 0) {
      setTimeout(() => {
        flatRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, [selected]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // center item is the "selected" one visually
      if (viewableItems.length > 0) {
        const mid = viewableItems[Math.floor(viewableItems.length / 2)];
        if (mid?.item) onSelect(mid.item.value);
      }
    },
  ).current;

  return (
    <View
      style={{
        width: 72,
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: textMuted + "40",
        backgroundColor: isDark ? "#182236" : "#f8fafc",
      }}
    >
      {/* Selection highlight bar */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: ITEM_HEIGHT, // middle row
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          backgroundColor: isDark
            ? "rgba(59,130,246,0.18)"
            : "rgba(59,130,246,0.10)",
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: "rgba(59,130,246,0.35)",
          zIndex: 10,
        }}
      />

      <FlatList
        ref={flatRef}
        data={items}
        keyExtractor={(item) => String(item.value)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        // Padding so first/last items can center
        ListHeaderComponent={<View style={{ height: ITEM_HEIGHT }} />}
        ListFooterComponent={<View style={{ height: ITEM_HEIGHT }} />}
        renderItem={({ item }) => {
          const isActive = item.value === selected;
          return (
            <TouchableOpacity
              onPress={() => {
                onSelect(item.value);
                const index = items.findIndex((it) => it.value === item.value);
                flatRef.current?.scrollToIndex({
                  index,
                  animated: true,
                  viewPosition: 0.5,
                });
              }}
              style={{
                height: ITEM_HEIGHT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: isActive ? 18 : 14,
                  fontWeight: isActive ? "700" : "400",
                  color: isActive ? "#3b82f6" : textMuted,
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

export default ScrollPicker;
