const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: process.env.PORT || 5000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'student_dashboard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },
  poolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  uploadFolder: process.env.UPLOAD_FOLDER || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 16777216,
  allowedExtensions: (process.env.ALLOWED_EXTENSIONS || 'pdf,doc,docx,txt,zip,jpg,png').split(','),
  nodeEnv: process.env.NODE_ENV || 'development'
};
