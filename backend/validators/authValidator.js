const { AppError } = require('../middleware/errorMiddleware');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeSkills(skills) {
  if (skills === undefined) return undefined;
  if (typeof skills === 'string') {
    return skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(skills)) {
    throw new AppError('Skills must be an array or comma-separated string.', 400);
  }
  return skills.map((s) => String(s).trim()).filter(Boolean);
}

function validateRegister({ name, email, password }) {
  if (!name || !String(name).trim()) {
    throw new AppError('Name is required.', 400);
  }
  if (!email || !String(email).trim()) {
    throw new AppError('Email is required.', 400);
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    throw new AppError('Please provide a valid email address.', 400);
  }
  if (!password) {
    throw new AppError('Password is required.', 400);
  }
  if (String(password).length < 6) {
    throw new AppError('Password must be at least 6 characters.', 400);
  }

  return {
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password: String(password),
  };
}

function validateLogin({ email, password }) {
  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }
  return {
    email: String(email).trim().toLowerCase(),
    password: String(password),
  };
}

function validateProfileUpdate(body) {
  const updates = {};

  if (body.name !== undefined) {
    if (!String(body.name).trim()) {
      throw new AppError('Name cannot be empty.', 400);
    }
    updates.name = String(body.name).trim();
  }
  if (body.education !== undefined) {
    updates.education = String(body.education).trim();
  }
  if (body.experience !== undefined) {
    updates.experience = String(body.experience).trim();
  }
  if (body.resume !== undefined) {
    updates.resume = String(body.resume).trim();
  }
  if (body.skills !== undefined) {
    updates.skills = normalizeSkills(body.skills);
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid profile fields provided.', 400);
  }

  return updates;
}

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  normalizeSkills,
};
