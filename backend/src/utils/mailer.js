
const { env } = require("../config/env");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Convert "TaskFlow <noreply@example.com>" into
// { name: "TaskFlow", email: "noreply@example.com" }
function getSenderDetails(sender) {
  const match = sender.match(/^(.*?)\s*<([^<>]+)>$/);

  if (match) {
    return {
      name: match[1].trim() || "TaskFlow",
      email: match[2].trim(),
    };
  }

  return {
    name: "TaskFlow",
    email: sender.trim(),
  };
}

async function sendEmail({ to, subject, html }) {
  if (!to || !subject || !html) {
    throw new Error("Email requires recipient, subject, and HTML content.");
  }

  console.log(`[EMAIL] Sending email to: ${to}`);

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: getSenderDetails(env.MAIL_FROM),
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent: html,
      }),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        responseData.message || `Brevo API returned HTTP ${response.status}`;

      console.error("[EMAIL] Brevo API error:", errorMessage);
      throw new Error(errorMessage);
    }

    console.log(
      `[EMAIL] Email accepted by Brevo. Message ID: ${responseData.messageId}`
    );

    return responseData;
  } catch (error) {
    console.error("[EMAIL] Sending failed:", error.message);
    throw error;
  }
}

module.exports = { sendEmail };
