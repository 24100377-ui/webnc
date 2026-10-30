import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`\n  Finora API → http://localhost:${env.port}`);
  console.log(`  Health    → http://localhost:${env.port}/api/health\n`);
});
