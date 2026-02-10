type OtpTemplateProps = {
  name: string;
  otp: string;
  storeName: string;
};

export const otpTemplate = ({
  name,
  otp,
  storeName,
}: OtpTemplateProps): string => {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 24px;">
      <div style="max-width: 520px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
        
        <h2 style="margin-bottom: 12px; color: #111827;">
          Password Reset Request 🔐
        </h2>

        <p style="color: #374151; font-size: 14px;">
          Hi ${name},
        </p>

        <p style="color: #374151; font-size: 14px;">
          We received a request to reset your password.<br />
          Use the OTP below to continue:
        </p>

        <div style="
          margin: 24px 0;
          padding: 16px;
          text-align: center;
          font-size: 28px;
          letter-spacing: 8px;
          font-weight: bold;
          background: #f3f4f6;
          border-radius: 6px;
          color: #111827;
        ">
          ${otp}
        </div>

        <p style="color: #374151; font-size: 14px;">
          ⏳ This OTP is valid for <strong>5 minutes</strong>.
        </p>

        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
          If you didn’t request a password reset, please ignore this email.
          Your account remains safe.
        </p>

        <p style="margin-top: 24px; color: #374151; font-size: 14px;">
          Regards,<br />
          <strong>${storeName} Team</strong>
        </p>

      </div>
    </div>
  `;
};
