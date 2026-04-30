// types/auth.d.ts

// types/auth.d.ts

import { User } from "./user";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  // Business fields
  businessName: string;
  employeeCount: number;
  city: string;
  state: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: User;
  refreshToken: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  business: {
    id: string;
    businessName: string;
    employeeCount: number;
    city: string;
    state: string;
  };
}

// import { User } from "./user";

// export interface LoginPayload {
//   email: string;
//   password: string;
// }

// export interface RegisterPayload {
//   name: string;
//   email: string;
//   phone: string;
//   password: string;
// }

// export interface AuthUser {
//   id: string;
//   name: string;
//   email: string;
// }

// export interface LoginResponse {
//   message: string;
//   // token: string;
//   accessToken: string;
//   // user: AuthUser;
//   user: User;
//   refreshToken: string;
// }

// export interface RegisterResponse {
//   message: string;
//   user: User;
// }
