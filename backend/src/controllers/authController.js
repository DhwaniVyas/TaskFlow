const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { createRandomToken, hashToken } = require("../utils/token");
const { sendEmail } = require("../utils/mailer");
const { env } = require("../config/env");

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function sanitizeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function resolveAppUrl(req) {
  const configured = env.APP_URL?.trim();
  if (configured && configured.length > 0) {
    return configured.replace(/\/+$/, "");
  }
  const origin = req.headers.origin;
  if (origin) {
    return origin.replace(/\/+$/, "");
  }
  return "http://localhost:5173";
}

async function sendVerificationEmail(user, appUrl) {
  const rawToken = createRandomToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationTokenExpiresAt = expiresAt;
  await user.save();

  const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;
  const html = `
    <h2>Verify your TaskFlow email</h2>
    <p>Click the button below to verify your account:</p>
    <p><a href="${verifyUrl}" style="padding:10px 16px;background:#0E7490;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a></p>
    <p>If the button does not work, open this URL:</p>
    <p>${verifyUrl}</p>
  `;

  await sendEmail({
    to: user.email,
    subject: "Verify your TaskFlow account",
    html,
  });
}

async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      res.status(400);
      throw new Error("fullName, email and password are required");
    }
    if (!isValidEmail(email)) {
      res.status(400);
      throw new Error("Please provide a valid email");
    }
    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail }).select(
      "+emailVerificationTokenHash +emailVerificationTokenExpiresAt"
    );

    if (existingUser) {
      res.status(409);
      throw new Error("An account already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });
    user = await User.findById(user._id).select(
      "+emailVerificationTokenHash +emailVerificationTokenExpiresAt"
    );

    await sendVerificationEmail(user, resolveAppUrl(req));

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email before login.",
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      res.status(400);
      throw new Error("Verification token is required");
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: { $gt: new Date() },
    }).select("+emailVerificationTokenHash +emailVerificationTokenExpiresAt");

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired verification token");
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationTokenExpiresAt = null;
    await user.save();

    const jwtToken = generateToken({ userId: user._id });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: {
        token: jwtToken,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    if (!user.emailVerified) {
      res.status(403);
      throw new Error("Please verify your email before login");
    }

    const token = generateToken({ userId: user._id });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error("email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+passwordResetTokenHash +passwordResetTokenExpiresAt"
    );

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email exists, a reset link has been sent.",
      });
    }

    const rawToken = createRandomToken();
    user.passwordResetTokenHash = hashToken(rawToken);
    user.passwordResetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30m
    await user.save();

    const resetUrl = `${resolveAppUrl(req)}/reset-password?token=${rawToken}`;
    const html = `
      <h2>Reset your TaskFlow password</h2>
      <p>Click below to reset your password:</p>
      <p><a href="${resetUrl}" style="padding:10px 16px;background:#F97316;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
      <p>If the button does not work, open this URL:</p>
      <p>${resetUrl}</p>
    `;

    await sendEmail({
      to: user.email,
      subject: "TaskFlow password reset",
      html,
    });

    res.status(200).json({
      success: true,
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400);
      throw new Error("token and password are required");
    }
    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }

    const user = await User.findOne({
      passwordResetTokenHash: hashToken(token),
      passwordResetTokenExpiresAt: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetTokenExpiresAt");

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired reset token");
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. Please login.",
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      data: sanitizeUser(req.user),
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { fullName } = req.body;
    if (!fullName || !fullName.trim()) {
      res.status(400);
      throw new Error("fullName is required");
    }

    const user = await User.findById(req.user._id);
    user.fullName = fullName.trim();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated",
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  logout,
};
