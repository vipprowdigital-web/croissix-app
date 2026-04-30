// utils/validators.ts

export const validateEmail = (email: string) => {
  const regex = /\S+@\S+\.\S+/;
  return regex.test(email);
};

export const validatePassword = (password: string) => {
  return password.length >= 6;
};
