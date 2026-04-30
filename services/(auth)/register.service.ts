// services/(auth)/register.service.ts

import { loginApi, registerApi } from "@/api/auth.api";
import { AppDispatch } from "@/store";
import { saveRefreshToken, saveToken } from "../auth.util";
import { setAuth } from "@/store/slices/auth.slice";

type BusinessInfo = {
  businessName: string;
  employees: number;
  city: string;
  state: string;
};

export async function handleRegister(
  name: string,
  email: string,
  phone: string,
  password: string,
  dispatch: AppDispatch,
  business: BusinessInfo,
) {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const payload = {
      name: name.trim(),
      email: trimmedEmail,
      phone: phone.trim(),
      password: trimmedPassword,
      businessName: business.businessName.trim(),
      employeeCount: business.employees,
      city: business.city.trim(),
      state: business.state.trim(),
    };

    // Register user + business
    await registerApi(payload);

    // Auto-login after registration
    const loginRes = await loginApi({
      email: trimmedEmail,
      password: trimmedPassword,
    });

    const data = loginRes.data;

    // Persist token
    await saveToken(data.accessToken);
    await saveRefreshToken(data.refreshToken);

    // Hydrate Redux
    dispatch(setAuth({ user: data.user, token: data.accessToken }));

    return { success: true, message: "Registered & Logged in" };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Registration Failed",
    };
  }
}

// export async function handleRegister(
//   name: string,
//   email: string,
//   phone: string,
//   password: string,
//   dispatch: AppDispatch,
// ) {
//   try {
//     const payload = {
//       name: name.trim(),
//       email: email.trim().toLocaleLowerCase(),
//       phone: phone.trim(),
//       password: password.trim(),
//     };

//     // Register user
//     const reg = await registerApi(payload);

//     // After registration -> directly login
//     const loginRes = await loginApi({
//       email: payload.email,
//       password: payload.password,
//     });

//     const data = loginRes.data;
//     console.log("Data from login: ", data);

//     // Save token
//     await saveToken(data.accessToken);

//     // Set Redux
//     dispatch(setAuth({ user: data.user, token: data.accessToken }));

//     // return
//     return { success: true, message: "Registered & Logged in" };
//   } catch (error: any) {
//     return {
//       success: false,
//       message: error.response?.data?.message || "Registration Failed",
//     };
//   }
// }
