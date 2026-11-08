import { getSettings, saveSettings, publicSettings, DEFAULT_SETTINGS } from '../models/AdminSettings.js';
import { deepMerge, asyncHandler } from '../utils/helpers.js';

export const getPublicSettings = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=30');
  res.json(publicSettings(await getSettings()));
});

export const getAdminSettings = asyncHandler(async (_req, res) => res.json(await getSettings()));

export const updateSettings = asyncHandler(async (req, res) => {
  const allowed = Object.keys(DEFAULT_SETTINGS);
  const patch = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => allowed.includes(k)));
  const merged = deepMerge(await getSettings(), patch);
  await saveSettings(merged);
  res.json(merged);
});
