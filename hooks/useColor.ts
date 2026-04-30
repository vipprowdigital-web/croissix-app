// import { useColorScheme } from "@/hooks/useColorScheme";
import { RootState } from "@/store";
import { Colors } from "@/theme/colors";
import { useSelector } from "react-redux";

export function useColor(
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
  props?: { light?: string; dark?: string },
) {
  // const theme = useColorScheme() ?? "dark";
  const theme = useSelector((state: RootState) => state.theme.mode);
  const colorFromProps = props?.[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
