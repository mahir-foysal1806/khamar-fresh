import { connectDB } from './server/src/config/db.js';
import { createApp } from './server/src/app.js';

await connectDB();

const app = createApp();

export default app;
