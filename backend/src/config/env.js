
const dotenv = require("dotenv");

dotenv.config();

const requiredVars = [
  "PORT",
  "NODE_ENV",
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "CLIENT_URL",
  "APP_URL",
  "MAIL_FROM",
  "BREVO_API_KEY",
  "GOOGLE_CLIENT_ID",
];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const env = {
  PORT: Number(process.env.PORT),
  NODE_ENV: process.env.NODE_ENV,

  MONGO_URI: process.env.MONGO_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  CLIENT_URL: process.env.CLIENT_URL,
  CLIENT_URLS: process.env.CLIENT_URLS
    ? process.env.CLIENT_URLS.split(",").map((item) => item.trim()).filter(Boolean)
    : [],
  APP_URL: process.env.APP_URL,

  // Brevo transactional email API
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  MAIL_FROM: process.env.MAIL_FROM,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",

  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || "",
};

module.exports = { env };
