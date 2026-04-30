import React from "react";
// Highlight: Import components from react-native-svg instead of using web tags
import Svg, { Path, Circle } from "react-native-svg";
import { ActivityIndicator } from "react-native";

// Highlight: Use Svg and Path (Capitalized)
function GoogleG({
  width = 20,
  height = 20,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.805 10.023H12v3.977h5.617c-.245 1.36-1.017 2.514-2.164 3.29v2.73h3.503C20.938 18.202 22 15.298 22 12c0-.66-.069-1.305-.195-1.977z"
        fill="#4285F4"
      />
      <Path
        d="M12 22c2.97 0 5.46-.984 7.28-2.668l-3.503-2.73c-.984.66-2.245 1.05-3.777 1.05-2.9 0-5.36-1.958-6.24-4.59H2.15v2.817C3.96 19.983 7.7 22 12 22z"
        fill="#34A853"
      />
      <Path
        d="M5.76 13.062A6.05 6.05 0 0 1 5.44 12c0-.37.063-.73.163-1.062V8.121H2.15A9.987 9.987 0 0 0 2 12c0 1.61.387 3.13 1.07 4.477l3.69-2.817-.001-.598z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.958c1.637 0 3.105.563 4.26 1.667l3.195-3.195C17.455 2.693 14.965 1.6 12 1.6 7.7 1.6 3.96 3.617 2.15 7.12l3.61 2.817C6.64 7.305 9.1 5.958 12 5.958z"
        fill="#EA4335"
      />
    </Svg>
  );
}

// Highlight: Replaced manual SVG Spinner with native ActivityIndicator
// because web CSS animations like 'animate-spin' do not work in React Native
function Spinner() {
  return <ActivityIndicator size="small" color="white" />;
}

export { GoogleG, Spinner };
