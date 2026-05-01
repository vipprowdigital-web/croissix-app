import { useRef, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { FRONTEND_URL } from "@/config/.env";
import React from "react";
import { queryClient } from "@/providers/queryClient";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentWebView({ visible, onClose, onSuccess }: Props) {
  // const queryClient = useQueryClient();
  const hasHandledSuccess = useRef(false);
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      hasHandledSuccess.current = false;
    }
  }, [visible]);

  const handleSuccess = async () => {
    if (hasHandledSuccess.current) return;
    hasHandledSuccess.current = true;

    // ✅ Close modal first so user sees app immediately
    onClose();

    // ✅ Invalidate and refetch subscription
    await queryClient.invalidateQueries({ queryKey: ["subscription"] });
    await queryClient.refetchQueries({ queryKey: ["subscription"] });

    // ✅ Notify parent
    onSuccess();
  };

  // ✅ Inject JS to intercept window.location.href changes inside WebView
  // This catches the deep link redirect before the WebView tries to navigate
  const injectedJS = `
    (function() {
      const originalAssign = window.location.assign.bind(window.location);
      const originalReplace = window.location.replace.bind(window.location);
      
      function interceptUrl(url) {
        if (url && url.startsWith('croissix://')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DEEP_LINK', url: url }));
          return true;
        }
        return false;
      }

      // Override assign
      window.location.assign = function(url) {
        if (!interceptUrl(url)) originalAssign(url);
      };

      // Override replace  
      window.location.replace = function(url) {
        if (!interceptUrl(url)) originalReplace(url);
      };

      // Override href setter
      const locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
      if (!locationDescriptor || locationDescriptor.configurable) {
        let _href = window.location.href;
        try {
          Object.defineProperty(window, 'location', {
            get: function() { return window.location; },
            configurable: true
          });
        } catch(e) {}
      }

      true; // required for injectedJavaScript
    })();
  `;

  const paymentUrl = `${FRONTEND_URL}/?callback=${encodeURIComponent("croissix://subscription/success")}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Subscribe to Croissix</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          startInLoadingState
          injectedJavaScript={injectedJS}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (
                data.type === "DEEP_LINK" &&
                data.url.startsWith("croissix://")
              ) {
                console.log(
                  "✅ Deep link intercepted via postMessage:",
                  data.url,
                );
                handleSuccess();
              }
            } catch (e) {}
          }}
          onNavigationStateChange={(navState) => {
            const { url } = navState;
            console.log("Navigation URL:", url);
            if (url && url.startsWith("croissix://")) {
              onClose();
              handleSuccess();
            }
          }}
          onShouldStartLoadWithRequest={(request) => {
            const { url } = request;
            if (url.startsWith("croissix://")) {
              onClose();
              handleSuccess();
              onClose();
              return false;
            }
            if (
              url.startsWith("upi://") ||
              url.startsWith("phonepe://") ||
              url.startsWith("paytmmp://") ||
              url.startsWith("gpay://") ||
              url.startsWith("bhim://") ||
              url.startsWith("credpay://") ||
              url.startsWith("intent://")
            ) {
              Linking.openURL(url).catch(() => {});
              return false;
            }
            return true;
          }}
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#f59e0b" />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  closeButton: { padding: 4 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
});

// import { useRef, useEffect } from "react";
// import {
//   Modal,
//   View,
//   TouchableOpacity,
//   Text,
//   ActivityIndicator,
//   StyleSheet,
//   Linking,
// } from "react-native";
// import { WebView } from "react-native-webview";
// import { Ionicons } from "@expo/vector-icons";
// import { useQueryClient } from "@tanstack/react-query";
// import { FRONTEND_URL } from "@/config/.env";
// import React from "react";

// interface Props {
//   visible: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function PaymentWebView({ visible, onClose, onSuccess }: Props) {
//   const queryClient = useQueryClient();
//   const hasHandledSuccess = useRef(false);

//   // ✅ Reset the flag every time the modal opens
//   useEffect(() => {
//     if (visible) {
//       hasHandledSuccess.current = false;
//     }
//   }, [visible]);

//   const handleSuccess = async () => {
//     if (hasHandledSuccess.current) return;
//     hasHandledSuccess.current = true;

//     onClose();

//     // ✅ Invalidate AND refetch immediately so guard re-evaluates
//     await queryClient.invalidateQueries({ queryKey: ["subscription"] });
//     await queryClient.refetchQueries({ queryKey: ["subscription"] });

//     onSuccess();
//   };

//   const handleNavigationChange = (navState: any) => {
//     const { url } = navState;
//     if (url.includes("croissix://subscription/success")) {
//       handleSuccess();
//     }
//   };

//   // ✅ Inject JS to intercept window.location.href changes inside WebView
//   // This catches the deep link redirect before the WebView tries to navigate
//   const injectedJS = `
//     (function() {
//       const originalAssign = window.location.assign.bind(window.location);
//       const originalReplace = window.location.replace.bind(window.location);

//       function interceptUrl(url) {
//         if (url && url.startsWith('croissix://')) {
//           window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DEEP_LINK', url: url }));
//           return true;
//         }
//         return false;
//       }

//       // Override assign
//       window.location.assign = function(url) {
//         if (!interceptUrl(url)) originalAssign(url);
//       };

//       // Override replace
//       window.location.replace = function(url) {
//         if (!interceptUrl(url)) originalReplace(url);
//       };

//       // Override href setter
//       const locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
//       if (!locationDescriptor || locationDescriptor.configurable) {
//         let _href = window.location.href;
//         try {
//           Object.defineProperty(window, 'location', {
//             get: function() { return window.location; },
//             configurable: true
//           });
//         } catch(e) {}
//       }

//       true; // required for injectedJavaScript
//     })();
//   `;

//   const paymentUrl = `${FRONTEND_URL}/?callback=${encodeURIComponent("croissix://subscription/success")}`;

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="pageSheet"
//       onRequestClose={onClose}
//     >
//       <View style={styles.container}>
//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Subscribe to Croissix</Text>
//           <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//             <Ionicons name="close" size={22} color="#64748b" />
//           </TouchableOpacity>
//         </View>

//         <WebView
//           source={{ uri: paymentUrl }}
//           onNavigationStateChange={handleNavigationChange}
//           startInLoadingState
//           // ✅ Spoof user agent so Razorpay shows UPI
//           userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
//           renderLoading={() => (
//             <View style={styles.loader}>
//               <ActivityIndicator size="large" color="#f59e0b" />
//             </View>
//           )}
//           onShouldStartLoadWithRequest={(request) => {
//             const { url } = request;

//             // ✅ Catch deep link back to app
//             if (url.startsWith("croissix://")) {
//               console.log("🔗 Deep link caught:", url); // ✅ add this
//               handleSuccess();
//               return false; // block WebView from navigating
//             }

//             // ✅ Open UPI apps externally
//             if (
//               url.startsWith("upi://") ||
//               url.startsWith("phonepe://") ||
//               url.startsWith("paytmmp://") ||
//               url.startsWith("gpay://") ||
//               url.startsWith("bhim://") ||
//               url.startsWith("credpay://") ||
//               url.startsWith("intent://")
//             ) {
//               Linking.openURL(url).catch(() => {});
//               return false;
//             }

//             return true;
//           }}
//         />
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f1f5f9",
//   },
//   headerTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
//   closeButton: { padding: 4 },
//   loader: { flex: 1, alignItems: "center", justifyContent: "center" },
// });

// import { useRef } from "react";
// import {
//   Modal,
//   View,
//   TouchableOpacity,
//   Text,
//   ActivityIndicator,
//   StyleSheet,
//   Linking,
// } from "react-native";
// import { WebView } from "react-native-webview";
// import { Ionicons } from "@expo/vector-icons";
// import { useQueryClient } from "@tanstack/react-query";
// import { FRONTEND_URL } from "@/config/.env";
// import React from "react";

// interface Props {
//   visible: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function PaymentWebView({ visible, onClose, onSuccess }: Props) {
//   const queryClient = useQueryClient();
//   const hasHandledSuccess = useRef(false);

//   const handleNavigationChange = (navState: any) => {
//     const { url } = navState;
//     if (
//       url.includes("croissix://subscription/success") &&
//       !hasHandledSuccess.current
//     ) {
//       hasHandledSuccess.current = true;
//       queryClient.invalidateQueries({ queryKey: ["subscription"] });
//       onSuccess();
//     }
//   };

//   const paymentUrl = `${FRONTEND_URL}/?callback=${encodeURIComponent("croissix://subscription/success")}`;

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="pageSheet"
//       onRequestClose={onClose}
//     >
//       <View style={styles.container}>
//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Subscribe to Croissix</Text>
//           <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//             <Ionicons name="close" size={22} color="#64748b" />
//           </TouchableOpacity>
//         </View>

//         {/* WebView */}
//         <WebView
//           source={{ uri: paymentUrl }}
//           onNavigationStateChange={handleNavigationChange}
//           startInLoadingState
//           // ✅ Spoof user agent so Razorpay shows UPI options
//           userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
//           renderLoading={() => (
//             <View style={styles.loader}>
//               <ActivityIndicator size="large" color="#f59e0b" />
//             </View>
//           )}
//           onShouldStartLoadWithRequest={(request) => {
//             const { url } = request;

//             // ✅ Catch deep link back to app
//             if (url.startsWith("croissix://")) {
//               if (!hasHandledSuccess.current) {
//                 hasHandledSuccess.current = true;
//                 queryClient.invalidateQueries({ queryKey: ["subscription"] });
//                 onSuccess();
//               }
//               return false;
//             }

//             // ✅ Open UPI apps externally so they actually launch
//             if (
//               url.startsWith("upi://") ||
//               url.startsWith("phonepe://") ||
//               url.startsWith("paytmmp://") ||
//               url.startsWith("gpay://") ||
//               url.startsWith("bhim://") ||
//               url.startsWith("credpay://") ||
//               url.startsWith("intent://") // Android intent links for UPI
//             ) {
//               Linking.openURL(url).catch(() => {
//                 // UPI app not installed — Razorpay handles this gracefully
//               });
//               return false;
//             }

//             return true;
//           }}
//         />
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f1f5f9",
//   },
//   headerTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#0f172a",
//   },
//   closeButton: {
//     padding: 4,
//   },
//   loader: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });

// import { useRef } from "react";
// import {
//   Modal,
//   View,
//   TouchableOpacity,
//   Text,
//   ActivityIndicator,
//   StyleSheet,
// } from "react-native";
// import { WebView } from "react-native-webview";
// import { Ionicons } from "@expo/vector-icons";
// import { useQueryClient } from "@tanstack/react-query";
// import { FRONTEND_URL } from "@/config/.env";
// import React from "react";

// interface Props {
//   visible: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function PaymentWebView({ visible, onClose, onSuccess }: Props) {
//   const queryClient = useQueryClient();
//   const hasHandledSuccess = useRef(false);

//   // ✅ Intercept navigation inside the WebView
//   const handleNavigationChange = (navState: any) => {
//     const { url } = navState;

//     // Payment succeeded — web tried to redirect to deep link
//     if (
//       url.includes("croissix://subscription/success") &&
//       !hasHandledSuccess.current
//     ) {
//       hasHandledSuccess.current = true;
//       queryClient.invalidateQueries({ queryKey: ["subscription"] });
//       onSuccess();
//     }
//   };

//   const paymentUrl = `${FRONTEND_URL}/?callback=${encodeURIComponent("croissix://subscription/success")}`;

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="pageSheet"
//       onRequestClose={onClose}
//     >
//       <View style={styles.container}>
//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Subscribe to Croissix</Text>
//           <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//             <Ionicons name="close" size={22} color="#64748b" />
//           </TouchableOpacity>
//         </View>

//         {/* WebView */}
//         <WebView
//           source={{ uri: paymentUrl }}
//           onNavigationStateChange={handleNavigationChange}
//           startInLoadingState
//           renderLoading={() => (
//             <View style={styles.loader}>
//               <ActivityIndicator size="large" color="#f59e0b" />
//             </View>
//           )}
//           // ✅ Intercept deep link before WebView tries to open it
//           onShouldStartLoadWithRequest={(request) => {
//             if (request.url.startsWith("croissix://")) {
//               if (!hasHandledSuccess.current) {
//                 hasHandledSuccess.current = true;
//                 queryClient.invalidateQueries({ queryKey: ["subscription"] });
//                 onSuccess();
//               }
//               return false; // block WebView from navigating to deep link
//             }
//             return true; // allow all other URLs
//           }}
//         />
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f1f5f9",
//   },
//   headerTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#0f172a",
//   },
//   closeButton: {
//     padding: 4,
//   },
//   loader: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });
