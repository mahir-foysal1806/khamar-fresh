import Admin from '../models/Admin.js';
import { signToken } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/helpers.js';

const safe = (a) => ({ id: a._id, name: a.name, email: a.email, role: a.role });

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const admin = await Admin.findOne({ email }).select('+password');
  if (!admin || !admin.isActive || !(await admin.matchPassword(req.body.password))) throw new HttpError(401, 'Invalid email or password');
  admin.lastLoginAt = new Date();
  await admin.save({ validateBeforeSave: false });
  res.json({ token: signToken(admin._id), admin: safe(admin) });
});

export const me = (req, res) => res.json({ admin: safe(req.admin) });

export const changePassword = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id).select('+password');
  if (!(await admin.matchPassword(req.body.currentPassword))) throw new HttpError(400, 'Current password is incorrect');
  if (String(req.body.newPassword || '').length < 8) throw new HttpError(400, 'New password must be at least 8 characters');
  admin.password = req.body.newPassword;
  await admin.save();
  res.json({ message: 'Password updated' });
});
