const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['candidate', 'admin'], default: 'candidate' },
    education: { type: String, default: '', trim: true },
    experience: { type: String, default: '', trim: true },
    skills: { type: [String], default: [] },
    resume: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  const rounds = process.env.NODE_ENV === 'production' ? 12 : 10;
  this.password = await bcrypt.hash(this.password, rounds);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
