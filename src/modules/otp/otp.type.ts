// otp.types.ts
export enum OtpPurpose {
  LOGIN = "LOGIN",
  REGISTER = "REGISTER",
  PASSWORD_RESET = "PASSWORD_RESET",

  EMAIL_VERIFY = "EMAIL_VERIFY",
  PHONE_VERIFY = "PHONE_VERIFY",
  VENDOR_APPROVAL = "VENDOR_APPROVAL",
}

export interface CreateOtpInput {
  userId?: string;
  purpose: OtpPurpose;
}
