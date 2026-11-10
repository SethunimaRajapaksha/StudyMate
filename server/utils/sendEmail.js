const nodemailer = require("nodemailer");

// Brevo HTTPS API (Render free eke SMTP block nisa)
const sendWithBrevo = async ({ to, subject, text, html }) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "StudyMate", email: process.env.EMAIL_FROM },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo error ${res.status}: ${body}`);
  }
};

module.exports = async ({ to, subject, text, html }) => {
  // 1. Deploy eke: Brevo API
  if (process.env.BREVO_API_KEY && process.env.EMAIL_FROM) {
    return sendWithBrevo({ to, subject, text, html });
  }

  // 2. Local eke: Gmail SMTP (kalin wage)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    return transporter.sendMail({
      from: `"StudyMate" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
  }

  // 3. Kisima set karala nathnam: terminal eke print karanawa
  console.log(`\n[DEV EMAIL]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
};