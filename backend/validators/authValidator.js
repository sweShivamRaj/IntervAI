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

function validateRegister(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Invalid request data.', 400, 'VALIDATION_ERROR');
  }
  const { name, email, password } = body;
  if (!name || !String(name).trim()) {
    throw new AppError('Name is required.', 400);
  }
  const cleanedName = String(name).trim();
  if (cleanedName.length > 80) {
    throw new AppError('Name is too long.', 400);
  }
  if (!email || !String(email).trim()) {
    throw new AppError('Email is required.', 400);
  }
  const cleanedEmail = String(email).trim().toLowerCase();
  if (cleanedEmail.length > 254 || !EMAIL_RE.test(cleanedEmail)) {
    throw new AppError('Please provide a valid email address.', 400);
  }
  if (!password) {
    throw new AppError('Password is required.', 400);
  }
  const cleanedPassword = String(password);
  if (cleanedPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters.', 400);
  }
  if (cleanedPassword.length > 72) {
    throw new AppError('Password is too long.', 400);
  }

  return {
    name: cleanedName,
    email: cleanedEmail,
    password: cleanedPassword,
  };
}

function validateLogin(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Invalid request data.', 400, 'VALIDATION_ERROR');
  }
  const { email, password } = body;
  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }
  return {
    email: String(email).trim().toLowerCase(),
    password: String(password),
  };
}

function validateProfileUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Invalid request data.', 400, 'VALIDATION_ERROR');
  }
  const updates = {};

  if (body.name !== undefined) {
    if (!String(body.name).trim()) {
      throw new AppError('Name cannot be empty.', 400);
    }
    const name = String(body.name).trim();
    if (name.length > 80) throw new AppError('Name is too long.', 400);
    updates.name = name;
  }
  if (body.education !== undefined) {
    const education = String(body.education).trim();
    if (education.length > 200) throw new AppError('Education is too long.', 400);
    updates.education = education;
  }
  if (body.experience !== undefined) {
    const experience = String(body.experience).trim();
    if (experience.length > 2000) throw new AppError('Experience is too long.', 400);
    updates.experience = experience;
  }
  if (body.resume !== undefined) {
    const resume = String(body.resume).trim();
    if (resume.length > 2000) throw new AppError('Resume text is too long.', 400);
    updates.resume = resume;
  }
  if (body.skills !== undefined) {
    updates.skills = normalizeSkills(body.skills);
    if (updates.skills.length > 30) {
      throw new AppError('Too many skills.', 400);
    }
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
