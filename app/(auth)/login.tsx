// app/(auth)/login.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
// Assets
import StartBg from "@/assets/images/bg/auth/star_bg.svg";
// BNA UI
import { Button as BNAButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text as BNAText } from "@/components/ui/text";
import { View as BNAView } from "@/components/ui/view";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";

import { useDispatch, useSelector } from "react-redux";

import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "expo-router";
import { handleLogin } from "@/services/(auth)/login.service";
import { useColor } from "@/hooks/useColor";
import { RootState } from "@/store";

export default function LoginPage() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [checked, setChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useSelector((state: RootState) => state.theme.mode);

  const text = useColor("text");
  const textMuted = useColor("textMuted");
  // const primary = useColor("primary");

  const emailError =
    email && !email.includes("@") ? "Please enter a valid email address" : "";
  const passwordError =
    password && password.length < 6
      ? "Password must be at least 6 characters"
      : "";
  // Background parallax animation
  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withTiming(-20, { duration: 6000 });
  }, [translateY]);

  async function onLogin() {
    if (!email.trim().toLowerCase() || !password.trim()) {
      toast({
        title: "Validation Error",
        description: "Email & Password required",
        variant: "error",
      });
      return;
    }

    setLoading(true);

    const response = await handleLogin(email, password, dispatch);
    console.log("Response: ", response);

    setLoading(false);

    if (response.success) {
      toast({
        title: "Welcome 🎉",
        description: "Login Successful",
        variant: "success",
      });

      router.replace("/(tabs)/(home)");
    } else {
      toast({
        title: "Login Failed",
        description: response.message,
        variant: "error",
      });
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1">
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={[
              theme === "dark" ? "#2a0e45" : "white",
              theme === "dark" ? "#101015" : "#2a0e45",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.bgContainer}>
              <StartBg
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid slice"
                // style={{ opacity: 0.9 }}
              />
            </View>
          </LinearGradient>
        </View>
        <Animated.View
          className="absolute top-40 inset-x-0 items-center"
          entering={FadeInUp.duration(700).springify()}
        >
          {/* App Logo */}
          {/* <Animated.View entering={ZoomIn.duration(800)}>
            <Logo width={42} height={42} style={{ marginBottom: 20 }} />
          </Animated.View> */}
          <Animated.Text
            entering={FadeInUp.delay(200).duration(900)}
            className="text-5xl font-bold text-center px-10 leading-tight mt-5"
            style={{ color: text }}
          >
            Login
          </Animated.Text>
          <Animated.View entering={FadeInUp.delay(400).duration(900)}>
            <BNAText variant="caption" style={{ color: textMuted }}>
              Enter your email and password to log in
            </BNAText>
          </Animated.View>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(300).springify().duration(900)}
          className="absolute inset-0 -bottom-40 items-center justify-center px-6 min-w-lg max-w-lg mx-auto"
        >
          <View
            className="rounded-3xl shadow-md"
            style={{ backgroundColor: useColor("primaryForeground") }}
          >
            <Card
              style={{
                backgroundColor: useColor("primaryForeground"),
                padding: 25,
              }}
            >
              <CardContent>
                <BNAView style={{ gap: 16 }}>
                  <Text className="uppercase font-bold" style={{ color: text }}>
                    Email
                  </Text>
                  <Input
                    placeholder="Enter your email"
                    icon={Mail}
                    value={email}
                    onChangeText={setEmail}
                    error={emailError}
                    keyboardType="email-address"
                    variant="outline"
                    inputStyle={{ color: text }}
                  />
                  <Text className="uppercase font-bold" style={{ color: text }}>
                    Password
                  </Text>
                  <Input
                    placeholder="Enter password"
                    icon={Lock}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    error={passwordError}
                    variant="outline"
                    inputStyle={{ color: text }}
                    rightComponent={
                      <Pressable onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <EyeOff size={20} color="#c4c4c8" />
                        ) : (
                          <Eye size={20} color="#c4c4c8" />
                        )}
                      </Pressable>
                    }
                  />
                  {/* <View className="flex-row items-center justify-between mt-3">
                    <BNACheckbox
                      checked={checked}
                      onCheckedChange={setChecked}
                      label="Remember Me"
                      labelStyle={{ color: useColor("strokeColor") }}
                      strokeColor={useColor("strokeColor")}
                    />
                    <BNAText variant="link" style={{ color: useColor("link") }}>
                      Forget Password?
                    </BNAText>
                  </View> */}
                </BNAView>
              </CardContent>
              <BNAView
                style={{
                  flex: 1,
                  gap: 16,
                  // height: 40,
                  marginTop: 30,
                  marginBottom: 50,
                  justifyContent: "center",
                }}
              >
                <BNAButton
                  variant="ghost"
                  // size="lg"
                  style={{
                    backgroundColor: "transparent",
                    padding: 0,
                    overflow: "hidden",
                  }}
                  onPress={onLogin}
                >
                  <LinearGradient
                    colors={["#2a0e45", "#9f57f5"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 15,
                    }}
                  >
                    <BNAText style={{ color: "white", fontWeight: "bold" }}>
                      {loading ? "Logging..." : "Login"}
                    </BNAText>
                  </LinearGradient>
                </BNAButton>
              </BNAView>
            </Card>
          </View>
          {/* <View style={{ width: "100%" }} className="mt-6">
            <Pressable
              className="
              flex-row items-center justify-center 
              border h-14 rounded-2xl gap-3 active:opacity-80 mx-1 shadow-lg bg-white"
              style={{
                borderColor: theme === "light" ? "white" : "gray",
                shadowColor: theme === "light" ? "gray" : "",
              }}
            >
              <GoogleIcon width={20} height={26} />
              <Text className="text-base font-bold text-black">
                Continue with Google
              </Text>
            </Pressable>
          </View> */}
          <BNAView
            style={{
              marginTop: 16,
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <BNAText variant="caption" style={{ fontSize: 15 }}>
              Don&apos;t have an account?
            </BNAText>
            <BNAText
              variant="link"
              style={{ color: useColor("link"), fontSize: 15 }}
              onPress={() => router.push("/(auth)/register")}
            >
              Sign Up
            </BNAText>
          </BNAView>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}
// Styles
const styles = StyleSheet.create({
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});
