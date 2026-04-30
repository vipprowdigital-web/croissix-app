import { useColor } from "@/hooks/useColor";
import { View, ScrollView, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";

interface Content {
  id: string;
  name: string;
  icon: React.ReactNode | string;
  statusColor?: string;
  dotColor?: string;
  status?: string;
  stats?: string;
  desc?: string;
  value?: string | number;
  color?: string;
  redirectTo?: string;
}

interface HorizontalListProps {
  list: Content[];
  heading?: string;
  subHeading?: string;
  headerRequired?: boolean;
  redirect?: boolean;
  onScrollTo?: (id: string) => void;
}

const HorizontalList: React.FC<HorizontalListProps> = ({
  list,
  heading,
  subHeading,
  headerRequired,
  redirect = true,
  onScrollTo,
}) => {
  const link = useColor("link");
  const textMuted = useColor("textMuted");
  const text = useColor("text");
  const green = useColor("green");
  const router = useRouter();
  return (
    <View className="pl-7" style={{ marginTop: !headerRequired ? 15 : 0 }}>
      {headerRequired && (
        <View className="mb-9 mt-10">
          <Text className="text-xl font-bold" style={{ color: text }}>
            {heading}
          </Text>
          {subHeading && (
            <Text className="text-sm" style={{ color: textMuted }}>
              {subHeading}
            </Text>
          )}
        </View>
      )}

      {/* Horizontal Scroll for Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
      >
        {list.map((item) => (
          <Pressable
            key={item.id}
            // onPress={() => router.push(item.redirectTo as any)}
            onPress={() => {
              if (redirect && item.redirectTo) {
                router.push(item.redirectTo as any);
              } else {
                onScrollTo?.(item.id);
              }
            }}
          >
            <View
              className={`${item.status && "w-32 p-4"} ${item.icon && "w-32 p-3"} ${item.value && "w-34 p-4"} mr-2 border rounded-3xl ${item.desc ? "items-start" : "items-center"} shadow-sm`}
              style={[
                styles.cardShadow,
                {
                  backgroundColor: item.value ? link + "20" : link + "50",
                  borderColor: item.value ? link : link + "70",
                },
              ]}
            >
              {/* Icon Container */}
              <View
                className={`${item.status ? "w-12 h-12" : "w-10 h-10"} rounded-full items-center justify-center mb-3`}
                style={{
                  backgroundColor: item.value
                    ? item.color + "40"
                    : item.color + "20",
                }}
              >
                {typeof item.icon === "string" ? (
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.color}
                  />
                ) : (
                  item.icon
                )}
              </View>

              {item.value && (
                <Text
                  className="text-2xl uppercase font-bold"
                  style={{ color: text }}
                >
                  {item.value}
                </Text>
              )}
              {/* Platform Name */}
              <Text
                className={`${item.desc ? "text-xs" : "text-sm"} text-center font-bold ${item.value && "uppercase"}`}
                style={{ color: text }}
              >
                {item.name}
              </Text>
              {item.desc && (
                <Text className="text-xs" style={{ color: textMuted }}>
                  {item.desc}
                </Text>
              )}

              {/* Status Badge */}
              {item.status && (
                <View className="flex-row items-center">
                  <View
                    className={`w-2 h-2 rounded-full mr-1.5 ${item.dotColor} ${item.status === "Live" && "shadow-lg"}`}
                    style={{ shadowColor: green }}
                  />
                  {item.status && (
                    <Text
                      className={`text-xs font-semibold ${item.statusColor}`}
                    >
                      {item.status}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  cardShadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});

export default HorizontalList;
