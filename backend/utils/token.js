const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

function signToken(userId) {
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: jwtExpiresIn });
}

function sanitizeUser(user) {
  const doc = user.toObject ? user.toObject() : { ...user };
  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    role: doc.role,
    education: doc.education || '',
    experience: doc.experience || '',
    skills: Array.isArray(doc.skills) ? doc.skills : [],
    resume: doc.resume || '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

module.exports = { signToken, sanitizeUser };
