import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  await getTransporter().sendMail({
    from: `"Anon Message App" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

export const sendVerificationEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Verify your account",
    html: `<p>Your verification code: <b>${otp}</b></p><p>Expires in 10 minutes.</p>`,
  });
};

export const sendResetPasswordEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Reset your password",
    html: `<p>Your password reset code: <b>${otp}</b></p><p>Expires in 10 minutes. Ignore if not requested.</p>`,
  });
};
