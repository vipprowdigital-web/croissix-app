import axios from "axios";
import { getToken } from "@/services/auth.util";
import { FRONTEND_URL } from "@/config/.env";

export const fetchGoogleLocation = async (locationId: string) => {
  try {
    const sessionToken = await getToken();
    // console.log("SessionToken: ", sessionToken);

    const response = await axios.get(
      `${FRONTEND_URL}/api/google/locations/get`,
      {
        params: { locationId },
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      },
    );
    // console.log("Response.data: ", response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      "Failed to fetch location from Next.js API:",
      error.response?.data || error.message,
    );
    throw error;
  }
};
