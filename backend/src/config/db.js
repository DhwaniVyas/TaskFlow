const mongoose = require("mongoose");
const { env } = require("./env");

async function ensureUserGoogleIndex() {
  const users = mongoose.connection.collection("users");
  const indexes = await users.indexes();
  const googleIndex = indexes.find((idx) => idx.name === "googleId_1");

  if (!googleIndex) {
    await users.createIndex(
      { googleId: 1 },
      { unique: true, partialFilterExpression: { googleId: { $type: "string" } } }
    );
    return;
  }

  const hasPartialFilter = Boolean(googleIndex.partialFilterExpression);
  const isUnique = Boolean(googleIndex.unique);

  if (!isUnique || !hasPartialFilter) {
    await users.dropIndex("googleId_1");
    await users.createIndex(
      { googleId: 1 },
      { unique: true, partialFilterExpression: { googleId: { $type: "string" } } }
    );
  }
}

async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await ensureUserGoogleIndex();
    console.log("User index check complete");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
}

module.exports = connectDB;
