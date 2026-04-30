import AsyncStorage from "@react-native-async-storage/async-storage";

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("accessToken");
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("refreshToken");
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};

export const getAuthHeader = async (): Promise<string | null> => {
  const token = await getToken();
  return token ? `Bearer ${token}` : null;
};
