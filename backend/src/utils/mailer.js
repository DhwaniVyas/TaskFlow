const nodemailer = require("nodemailer");
const { env } = require("../config/env");

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    html,
  });
}

module.exports = { sendEmail };


// const nodemailer = require("nodemailer");
// const { env } = require("../config/env");

// const transporter = nodemailer.createTransport({
//   host: env.SMTP_HOST,
//   port: Number(env.SMTP_PORT),
//   secure: env.SMTP_SECURE === "true",
//   auth: {
//     user: env.SMTP_USER,
//     pass: env.SMTP_PASS,
//   },
// });

// transporter.verify()
//   .then(() => {
//     console.log("[SMTP TEST] Connection successful");
//   })
//   .catch((error) => {
//     console.error("[SMTP TEST] Connection failed:", error.message);
//   });

// async function sendEmail({ to, subject, html }) {
//   console.log(`[SMTP TEST] Sending email to ${to}`);

//   const info = await transporter.sendMail({
//     from: env.MAIL_FROM,
//     to,
//     subject,
//     html,
//   });

//   console.log(`[SMTP TEST] Email sent: ${info.messageId}`);

//   return info;
// }

// module.exports = { sendEmail };
