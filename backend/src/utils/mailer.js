export const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY environment variable is missing");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Anon Message App",
        email: process.env.SMTP_FROM_EMAIL || "kishan06nitr@gmail.com",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Brevo email API error: ${response.status}`);
  }

  return data;
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
