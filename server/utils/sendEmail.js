const nodemailer = require("nodemailer");

module.exports = async ({ to, subject, text, html }) => {
  // Email settings nathnam terminal eke print karanawa (development)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n[DEV EMAIL]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: `"StudyMate" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};