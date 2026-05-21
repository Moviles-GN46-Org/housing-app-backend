const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, isVerified: user.isVerified },
    ACCESS_SECRET,
    { expiresIn: "1m" },
  );
}

function generateRefreshToken(user) {
  return jwt.sign({ userId: user.id, type: "refresh" }, REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

function verifyToken(token, secret = ACCESS_SECRET) {
  return jwt.verify(token, secret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
};
