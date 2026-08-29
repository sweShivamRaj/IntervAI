const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorMiddleware');
const { signToken, sanitizeUser } = require('../utils/token');
const { validateRegister, validateLogin } = require('../validators/authValidator');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = validateRegister(req.body);

  const exists = await User.findOne({ email });
  if (exists) {
    throw new AppError('Email already registered.', 400);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'candidate',
  });

  const token = signToken(user._id);

  res.status(201).json({
    success: true,
    user: sanitizeUser(user),
    token,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = validateLogin(req.body);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken(user._id);

  res.json({
    success: true,
    user: sanitizeUser(user),
    token,
  });
});

const logout = asyncHandler(async (req, res) => {
  // JWT is cleared on the client; endpoint acknowledges logout for API completeness.
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

module.exports = { register, login, logout, me };
