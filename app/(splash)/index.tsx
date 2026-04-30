// app/(splash)/index.tsx
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useColor } from "@/hooks/useColor";
import StartBg from "@/assets/images/bg/auth/star_bg.svg";
import { LinearGradient } from "expo-linear-gradient";

const prerequisites = [
  { name: "Lighting Fast Performance", icon: "" },
  { name: "Secure & Compliant", icon: "" },
  { name: "Real-time analysis", icon: "" },
];

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 1000);
    });
  }, []);

  return (
    <View style={{ flex: 1 }} className="justify-center items-center p-12">
      <View style={styles.bgContainer} className=" dark:bg-zinc-900/90">
        <StartBg
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
        />
        <LinearGradient
          colors={["#4A5EB2", "#8b0ac8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            paddingVertical: 14,
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 15,
          }}
        ></LinearGradient>
      </View>
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        Croissix AI
      </Animated.Text>
      <Animated.Text
        style={[
          styles.text,
          { opacity: fadeAnim, fontSize: 18, fontWeight: "normal" },
        ]}
        className="text-white text-center"
      >
        The fastest way to manage your workflow. Trusted by thousands of teams
        worldwide.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   backgroundColor: "#530677",
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  text: {
    color: "white",
    fontSize: 35,
    fontWeight: "bold",
  },
});

// import { StyleSheet, Text, View } from "react-native";

// export default function Page() {
//   return (
//     <View style={styles.container}>
//       <View style={styles.main}>
//         <Text style={styles.title}>Hello World</Text>
//         <Text style={styles.subtitle}>This is the first page of your app.</Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     padding: 24,
//   },
//   main: {
//     flex: 1,
//     justifyContent: "center",
//     maxWidth: 960,
//     marginHorizontal: "auto",
//   },
//   title: {
//     fontSize: 64,
//     fontWeight: "bold",
//   },
//   subtitle: {
//     fontSize: 36,
//     color: "#38434D",
//   },
// });
