const dotenv = require("dotenv");

dotenv.config();

const requiredVars = ["PORT", "NODE_ENV", "MONGO_URI", "JWT_SECRET", "JWT_EXPIRES_IN", "CLIENT_URL"];

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
};

module.exports = { env };
