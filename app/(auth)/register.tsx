// app/(auth)/ register.tsx

// app/(auth)/register.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useColor } from "@/hooks/useColor";
import StartBg from "@/assets/images/bg/auth/star_bg.svg";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  Building2,
  Users,
  MapPin,
  Map,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useToast } from "@/components/ui/toast";
import { handleRegister } from "@/services/(auth)/register.service";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";

// ─── Reusable Field ───────────────────────────────────────────────────────────
function Field({
  label,
  placeholder,
  value,
  onChangeText,
  icon: Icon,
  keyboardType = "default",
  secureTextEntry = false,
  rightComponent,
  error,
  textColor,
  mutedColor,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  icon: any;
  keyboardType?: any;
  secureTextEntry?: boolean;
  rightComponent?: React.ReactNode;
  error?: string;
  textColor: string;
  mutedColor: string;
}) {
  const red = useColor("red");
  const textMuted = useColor("textMuted");
  return (
    <View className="mb-4">
      <Text
        className="text-sm font-bold uppercase tracking-widest mb-1.5"
        style={{ color: textColor }}
      >
        {label}
      </Text>
      <View
        className={`flex-row items-center rounded-xl px-3 py-3 border ${
          error ? "border-red-500" : "border-white/10"
        } bg-white/5`}
        style={{ backgroundColor: error ? red + "10" : "transparent" }}
      >
        <Icon size={16} color={mutedColor} style={{ marginRight: 8 }} />
        <TextInput
          className="flex-1 text-md"
          style={{ color: textColor, paddingVertical: 0 }}
          placeholder={placeholder}
          placeholderTextColor={mutedColor}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
        />
        {rightComponent}
      </View>
      {!!error && (
        <Text className="text-sm mt-1 ml-1" style={{ color: red }}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const router = useRouter();
  const theme = useSelector((state: RootState) => state.theme.mode);

  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [employees, setEmployees] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Inline validation
  const fullNameError =
    fullName && fullName.length < 3 ? "Name must be at least 3 characters" : "";
  const emailError =
    email && !email.includes("@") ? "Enter a valid email address" : "";
  const phoneError =
    phone && phone.length < 10 ? "Enter a valid phone number" : "";
  const employeesError =
    employees && isNaN(Number(employees)) ? "Enter a valid number" : "";
  const passwordError =
    password && password.length < 6
      ? "Password must be at least 6 characters"
      : "";

  async function onRegister() {
    if (
      !fullName ||
      !businessName ||
      !email ||
      !password ||
      !phone ||
      !city ||
      !stateName
    ) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "error",
      });
      return;
    }
    if (
      fullNameError ||
      emailError ||
      phoneError ||
      employeesError ||
      passwordError
    ) {
      toast({
        title: "Error",
        description: "Please fix the errors above",
        variant: "error",
      });
      return;
    }

    setLoading(true);
    const res = await handleRegister(
      fullName,
      email,
      phone,
      password,
      dispatch,
      {
        businessName,
        employees: Number(employees) || 0,
        city,
        state: stateName,
      },
    );
    setLoading(false);

    if (res.success) {
      toast({ title: "Success", description: res.message, variant: "success" });
      router.replace("/(tabs)/(home)");
    } else {
      toast({ title: "Failed", description: res.message, variant: "error" });
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          {/* ── Background gradient + star SVG ── */}
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
              <View style={StyleSheet.absoluteFill}>
                <StartBg
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid slice"
                />
              </View>
            </LinearGradient>
          </View>

          {/* ── Scrollable form ── */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 72,
              paddingBottom: 48,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View
              entering={FadeInUp.duration(700).springify()}
              className="items-center mb-5"
            >
              <Text
                className="text-4xl font-bold text-center leading-tight"
                style={{ color: text }}
              >
                Create account
              </Text>
              <Text
                className="text-sm mt-2 text-center"
                style={{ color: textMuted }}
              >
                Fill in the details below to get started
              </Text>
            </Animated.View>

            {/* Form card */}
            <Animated.View
              entering={FadeInDown.delay(300).springify().duration(900)}
              className="rounded-3xl p-6"
              style={{ backgroundColor: primaryForeground }}
            >
              <Field
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                icon={User}
                error={fullNameError}
                textColor={text}
                mutedColor={textMuted}
              />

              <Field
                label="Business Name"
                placeholder="Your business name"
                value={businessName}
                onChangeText={setBusinessName}
                icon={Building2}
                textColor={text}
                mutedColor={textMuted}
              />

              <Field
                label="Mobile Number"
                placeholder="Enter your mobile number"
                value={phone}
                onChangeText={setPhone}
                icon={Phone}
                keyboardType="phone-pad"
                error={phoneError}
                textColor={text}
                mutedColor={textMuted}
              />

              <Field
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                icon={Mail}
                keyboardType="email-address"
                error={emailError}
                textColor={text}
                mutedColor={textMuted}
              />

              <Field
                label="Number of Employees"
                placeholder="e.g. 10"
                value={employees}
                onChangeText={setEmployees}
                icon={Users}
                keyboardType="numeric"
                error={employeesError}
                textColor={text}
                mutedColor={textMuted}
              />

              {/* City + State — side by side */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Field
                    label="City"
                    placeholder="City"
                    value={city}
                    onChangeText={setCity}
                    icon={MapPin}
                    textColor={text}
                    mutedColor={textMuted}
                  />
                </View>
                <View className="flex-1">
                  <Field
                    label="State"
                    placeholder="State"
                    value={stateName}
                    onChangeText={setStateName}
                    icon={Map}
                    textColor={text}
                    mutedColor={textMuted}
                  />
                </View>
              </View>

              <Field
                label="Password"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                icon={Lock}
                secureTextEntry={!showPassword}
                error={passwordError}
                textColor={text}
                mutedColor={textMuted}
                rightComponent={
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={18} color={textMuted} />
                    ) : (
                      <Eye size={18} color={textMuted} />
                    )}
                  </Pressable>
                }
              />

              {/* Submit */}
              <Pressable
                onPress={onRegister}
                disabled={loading}
                className="mt-2 rounded-2xl overflow-hidden"
              >
                <LinearGradient
                  colors={["#2a0e45", "#9f57f5"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 15,
                    paddingVertical: 15,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      Create Account
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Footer link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-md" style={{ color: textMuted }}>
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => router.push("/(auth)/login")}>
                <Text className="text-md font-semibold" style={{ color: link }}>
                  Log In
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   Pressable,
//   StyleSheet,
//   TouchableWithoutFeedback,
//   Keyboard,
// } from "react-native";
// import { useColor } from "@/hooks/useColor";
// // Assets
// import Logo from "@/assets/images/logo.svg";
// import StartBg from "@/assets/images/bg/auth/star_bg.svg";
// import GoogleIcon from "@/assets/images/logo/google.svg";
// // BNA UI
// import { Button as BNAButton } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Text as BNAText } from "@/components/ui/text";
// import { View as BNAView } from "@/components/ui/view";
// import { Input } from "@/components/ui/input";
// import { Checkbox as BNACheckbox } from "@/components/ui/checkbox";
// import { Eye, EyeOff, Lock, Mail, User, Phone } from "lucide-react-native";

// import { LinearGradient } from "expo-linear-gradient";

// // Reanimated
// import Animated, {
//   FadeIn,
//   FadeInUp,
//   FadeInDown,
//   ZoomIn,
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
// } from "react-native-reanimated";
// import { useRouter } from "expo-router";
// import { useToast } from "@/components/ui/toast";
// import { handleRegister } from "@/services/(auth)/register.service";
// import { useDispatch, useSelector } from "react-redux";
// import { RootState } from "@/store";

// export default function RegisterPage() {
//   const { toast } = useToast();
//   const dispatch = useDispatch();

//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [password, setPassword] = useState("");
//   const [checked, setChecked] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const theme = useSelector((state: RootState) => state.theme.mode);

//   const text = useColor("text");
//   const textMuted = useColor("textMuted");

//   const phoneError =
//     phone && phone.length < 10 ? "Please enter a valid phone number" : "";
//   const emailError =
//     email && !email.includes("@") ? "Please enter a valid email address" : "";
//   const passwordError =
//     password && password.length < 6
//       ? "Password must be at least 6 characters"
//       : "";
//   const fullNameError =
//     fullName && fullName.length < 6
//       ? "First must be at least 3 characters"
//       : "";
//   // Background parallax animation
//   const translateY = useSharedValue(0);
//   const router = useRouter();
//   useEffect(() => {
//     translateY.value = withTiming(-20, { duration: 6000 });
//   }, []);

//   // Inside onPress
//   async function onRegister() {
//     if (!fullName || !email || !password || !phone) {
//       toast({
//         title: "Error",
//         description: "All fields required",
//         variant: "error",
//       });
//       return;
//     }

//     const res = await handleRegister(
//       fullName,
//       email,
//       phone,
//       password,
//       dispatch,
//     );

//     if (res.success) {
//       toast({
//         title: "Success",
//         description: res.message,
//         variant: "success",
//       });

//       router.replace("/(tabs)/(home)");
//     } else {
//       toast({
//         title: "Failed",
//         description: res.message,
//         variant: "error",
//       });
//     }
//   }

//   return (
//     <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//       <View className="flex-1">
//         {/* <View style={{ flex: 1 }}>
//           <View
//             style={[
//               styles.bgContainer,
//               { backgroundColor: useColor("primary") },
//             ]}
//           >
//             <StartBg
//               width="100%"
//               height="100%"
//               preserveAspectRatio="xMidYMid slice"
//             />
//           </View>
//         </View>
//         <View className="flex-1" /> */}
//         <View style={StyleSheet.absoluteFill}>
//           <LinearGradient
//             colors={[
//               theme === "dark" ? "#2a0e45" : "white",
//               theme === "dark" ? "#101015" : "#2a0e45",
//             ]}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 0, y: 1 }}
//             style={StyleSheet.absoluteFill}
//           >
//             <View style={styles.bgContainer}>
//               <StartBg
//                 width="100%"
//                 height="100%"
//                 preserveAspectRatio="xMidYMid slice"
//                 // style={{ opacity: 0.4 }}
//               />
//             </View>
//           </LinearGradient>
//         </View>
//         <Animated.View
//           className="absolute top-20 inset-x-0 items-center"
//           entering={FadeInUp.duration(700).springify()}
//         >
//           {/* App Logo */}
//           {/* <Animated.View entering={ZoomIn.duration(800)}>
//             <Logo width={42} height={42} style={{ marginBottom: 20 }} />
//           </Animated.View> */}
//           <Animated.Text
//             entering={FadeInUp.delay(200).duration(900)}
//             className="text-4xl font-bold text-center px-10 leading-tight mt-0"
//             style={{ color: text }}
//           >
//             Create account
//           </Animated.Text>
//           <Animated.View entering={FadeInUp.delay(400).duration(900)}>
//             <BNAText variant="caption" style={{ color: textMuted }}>
//               Fill in the details below to get started
//             </BNAText>
//           </Animated.View>
//         </Animated.View>
//         {/* FLOATING LOGIN CARD */}
//         <Animated.View
//           entering={FadeInDown.delay(300).springify().duration(900)}
//           className="absolute inset-0 -bottom-24 items-center justify-center px-6 min-w-lg max-w-lg mx-auto"
//         >
//           <View
//             className="rounded-full shadow-md"
//             style={{ backgroundColor: useColor("primaryForeground") }}
//           >
//             <Card
//               style={{
//                 backgroundColor: useColor("primaryForeground"),
//                 padding: 25,
//               }}
//             >
//               <CardContent>
//                 {/* INPUTS */}
//                 <BNAView style={{ gap: 10 }}>
//                   <Text className="font-bold uppercase" style={{ color: text }}>
//                     Fullname
//                   </Text>
//                   <Input
//                     placeholder="Enter your Full Name"
//                     icon={User}
//                     value={fullName}
//                     onChangeText={setFullName}
//                     error={fullNameError}
//                     keyboardType="default"
//                     variant="outline"
//                     inputStyle={{
//                       color: "white",
//                     }}
//                   />
//                   <Text className="font-bold uppercase" style={{ color: text }}>
//                     Email
//                   </Text>
//                   <Input
//                     placeholder="Enter your email"
//                     icon={Mail}
//                     value={email}
//                     onChangeText={setEmail}
//                     error={emailError}
//                     keyboardType="email-address"
//                     variant="outline"
//                     inputStyle={{
//                       color: "white",
//                     }}
//                   />
//                   <Text className="font-bold uppercase" style={{ color: text }}>
//                     Phone
//                   </Text>
//                   <Input
//                     placeholder="Enter your phone"
//                     icon={Phone}
//                     value={phone}
//                     onChangeText={setPhone}
//                     error={phoneError}
//                     keyboardType="phone-pad"
//                     variant="outline"
//                     inputStyle={{ color: "white" }}
//                   />
//                   <Text className="font-bold uppercase" style={{ color: text }}>
//                     Password
//                   </Text>
//                   <Input
//                     placeholder="Enter password"
//                     icon={Lock}
//                     secureTextEntry={!showPassword}
//                     value={password}
//                     onChangeText={setPassword}
//                     error={passwordError}
//                     variant="outline"
//                     inputStyle={{ color: "white" }}
//                     rightComponent={
//                       <Pressable onPress={() => setShowPassword(!showPassword)}>
//                         {showPassword ? (
//                           <EyeOff size={20} color="#c4c4c8" />
//                         ) : (
//                           <Eye size={20} color="#c4c4c8" />
//                         )}
//                       </Pressable>
//                     }
//                   />
//                   {/* <View className="flex-row items-center justify-between mt-3">
//                     <BNACheckbox
//                       checked={checked}
//                       onCheckedChange={setChecked}
//                       label="Terms and Conditions"
//                       labelStyle={{ color: useColor("strokeColor") }}
//                       strokeColor={useColor("strokeColor")}
//                     />
//                     <BNAText
//                       variant="link"
//                       style={{ color: useColor("textMuted") }}
//                     >
//                       Read Policy
//                     </BNAText>
//                   </View> */}
//                 </BNAView>
//                 <View
//                   style={{
//                     gap: 16,
//                     marginTop: 10,
//                     justifyContent: "center",
//                   }}
//                 >
//                   <BNAButton
//                     variant="ghost"
//                     // size="lg"
//                     style={{
//                       backgroundColor: "transparent",
//                       padding: 0,
//                       overflow: "hidden",
//                     }}
//                     onPress={onRegister}
//                   >
//                     <LinearGradient
//                       colors={["#2a0e45", "#9f57f5"]}
//                       start={{ x: 0, y: 0 }}
//                       end={{ x: 1, y: 0 }}
//                       style={{
//                         flex: 1,
//                         paddingVertical: 14,
//                         paddingHorizontal: 20,
//                         alignItems: "center",
//                         justifyContent: "center",
//                         borderRadius: 15,
//                       }}
//                     >
//                       <BNAText style={{ color: "white", fontWeight: "bold" }}>
//                         Create Account
//                       </BNAText>
//                     </LinearGradient>
//                   </BNAButton>
//                 </View>
//               </CardContent>
//             </Card>
//           </View>
//           {/* GOOGLE LOGIN BUTTON */}
//           {/* <View style={{ width: "100%" }} className="mt-6">
//             <Pressable
//               className="
//                   flex-row items-center justify-center
//                   border h-14 rounded-2xl gap-3
//                   active:opacity-80 mx-1 shadow-lg bg-white"
//             >
//               <GoogleIcon width={20} height={26} />
//               <Text className="text-base font-bold text-black">
//                 Continue with Google
//               </Text>
//             </Pressable>
//           </View> */}
//           <View>
//             <BNAView
//               style={{
//                 marginTop: 16,
//                 flexDirection: "row",
//                 justifyContent: "center",
//                 gap: 6,
//               }}
//             >
//               <BNAText variant="caption"> Already have an account?</BNAText>
//               <BNAText
//                 variant="link"
//                 style={{ color: useColor("link") }}
//                 onPress={() => router.push("/(auth)/login")}
//               >
//                 Log In
//               </BNAText>
//             </BNAView>
//           </View>
//         </Animated.View>
//       </View>
//     </TouchableWithoutFeedback>
//   );
// }
// // Styles
// const styles = StyleSheet.create({
//   bgContainer: {
//     ...StyleSheet.absoluteFillObject,
//   },
// });
