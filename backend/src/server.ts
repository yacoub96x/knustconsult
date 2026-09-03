import 'dotenv/config';
import app from './app.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

app.listen(PORT, () => {
  console.log(`\n🚀 KnustConsult Backend API Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health\n`);
});
