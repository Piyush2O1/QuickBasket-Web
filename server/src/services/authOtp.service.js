import crypto from "crypto";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const createOtpCode = () => crypto.randomInt(100000, 999999).toString();

export const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

export const buildRegisterOtpEmail = ({ name, otp }) => {
  const safeName = escapeHtml(name);
  const safeOtp = escapeHtml(otp);

  return {
    subject: "Quick Basket signup OTP",
    html: `
      <div style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">
          <div style="padding:24px 28px;background:linear-gradient(135deg,#10b981,#f59e0b);color:#ffffff;">
            <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.85;">Quick Basket</div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">Verify your email</h1>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hi ${safeName},</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
              Use this one-time password to complete your Quick Basket signup.
            </p>
            <div style="margin:24px 0;padding:20px;border:1px dashed #10b981;border-radius:20px;background:#f8fafc;text-align:center;">
              <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#64748b;">Verification code</div>
              <div style="margin-top:10px;font-size:36px;font-weight:700;letter-spacing:0.3em;color:#0f172a;">${safeOtp}</div>
            </div>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">
              This OTP will expire in 10 minutes.
            </p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">
              If you did not request this signup, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `,
  };
};
