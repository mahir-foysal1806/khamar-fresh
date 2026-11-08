import 'dotenv/config';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
  process.exit(1);
}

const port = process.env.PORT || 5000;
connectDB()
  .then(() => createApp().listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((e) => {
    console.error('Failed to start:', e.message);
    process.exit(1);
  });
