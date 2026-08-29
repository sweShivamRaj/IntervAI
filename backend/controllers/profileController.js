const { asyncHandler } = require('../middleware/errorMiddleware');
const { sanitizeUser } = require('../utils/token');
const { validateProfileUpdate } = require('../validators/authValidator');

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const updates = validateProfileUpdate(req.body);

  Object.assign(req.user, updates);
  await req.user.save();

  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

module.exports = { getProfile, updateProfile };
