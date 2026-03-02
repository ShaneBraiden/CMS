const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/student_dashboard',
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  uploadFolder: process.env.UPLOAD_FOLDER || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 16777216,
  allowedExtensions: (process.env.ALLOWED_EXTENSIONS || 'pdf,doc,docx,txt,zip,jpg,png').split(','),
  nodeEnv: process.env.NODE_ENV || 'development'
};
