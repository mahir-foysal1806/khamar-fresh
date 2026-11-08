import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { HttpError, asyncHandler } from '../utils/helpers.js';

export const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Not authorized');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Session expired, please log in again');
  }
  const admin = await Admin.findById(payload.id);
  if (!admin || !admin.isActive) throw new HttpError(401, 'Account not found or disabled');
  req.admin = admin;
  next();
});

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.admin?.role) ? next() : next(new HttpError(403, 'You do not have permission for this action'));
