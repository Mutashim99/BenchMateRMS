import "dotenv/config";
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
export const sendMail = async (emailOptions) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            html: emailOptions.html,
            to: emailOptions.to,
            subject: emailOptions.subject,
        });
        console.log(info);
        return info;
    }
    catch (e) {
        console.error("sendMail failed:", e);
        throw e;
    }
};
export const bodyForEmailVerification = (otp) => {
    return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
      <title>Verify your email</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:40px auto 40px;background:#ffffff;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.06);overflow:hidden;">
        <tr>
          <td style="padding:24px 28px 8px 28px;background:linear-gradient(90deg,#1f5ef8,#6b8bff);color:#fff;">
            <h1 style="margin:0;font-size:20px;font-weight:700;">BenchMate</h1>
            <p style="margin:6px 0 0 0;font-size:13px;opacity:0.95;">Verify your email to finish signing up</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 18px 0;color:#333;font-size:15px;line-height:1.45;">
              Hey there 👋,
            </p>

            <p style="margin:0 0 22px 0;color:#333;font-size:15px;line-height:1.45;">
              Thanks for creating an account on <strong>BenchMate</strong>. Please use the one-time verification code below to confirm your email address. The code will expire in <strong>10 minutes</strong>.
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0 26px 0;">
              <tr>
                <td align="center">
                  <div style="display:inline-block;padding:20px 28px;border-radius:8px;background:#f6f9ff;border:1px dashed #dfe9ff;">
                    <p style="margin:0;color:#1f2a44;font-size:14px;">Your verification code</p>
                    <p style="margin:10px 0 0 0;font-size:28px;letter-spacing:4px;font-weight:700;color:#0b2bff;">${otp}</p>
                  </div>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 18px 0;color:#333;font-size:15px;line-height:1.45;">
              Enter this code on the verification screen to complete your registration. If you didn't request this, you can safely ignore this email.
            </p>

            <p style="margin:0 0 6px 0;color:#666;font-size:13px;">
              Need help? Contact us at <a href="mailto:support@benchmate.example" style="color:#1f5ef8;text-decoration:none;">support@benchmate.example</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:18px 28px 28px;background:#fafbfd;border-top:1px solid #f0f2f7;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-size:13px;color:#7a8494;">
                  If the link/code does not work, request a new one from the app. This code is valid for 10 minutes.
                </td>
                <td align="right" style="font-size:13px;color:#7a8494;">
                  &copy; ${new Date().getFullYear()} BenchMate
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};
