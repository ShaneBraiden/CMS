# Complete AI Build Guide — MERN Student Dashboard

> **Purpose:** This is an exhaustive, step-by-step instruction guide for Claude Sonnet (or any AI coding assistant) to build the entire MERN Student Dashboard project from scratch. Each step includes the exact files to create, the exact code logic, business rules, and verification criteria. Follow every step sequentially — do NOT skip any step.

---

## GLOBAL RULES (Apply to EVERY step)

1. **Project root:** `student-dashboard-mern/` with two subdirectories: `server/` (Express API) and `client/` (React Vite SPA).
2. **Always use these exact versions/libraries:**
   - Node.js 18+, Express.js, Mongoose ODM, bcryptjs, jsonwebtoken, multer, express-validator, cookie-parser, cors, morgan, dotenv, helmet, express-rate-limit
   - React 18+ (Vite), react-router-dom v6, axios, Tailwind CSS v3, react-icons (Font Awesome set), react-hot-toast, dayjs
3. **API response envelope:** Every API response must use `{ success: true/false, data: {...}, message: "..." }` or `{ success: false, error: "..." }`.
4. **Error handling:** Every async route handler must be wrapped in try/catch. Use a global error handler middleware.
5. **Authentication:** JWT stored in httpOnly cookies. Every protected route uses auth middleware.
6. **Email domain restriction:** Only `@sriher.edu.in` emails allowed for registration.
7. **Styling:** Tailwind CSS only. Match the design system: `bg-gray-100` background, `bg-white rounded-lg shadow-md p-6` cards, `bg-gray-800` navbar, blue/green/red/yellow badges.
8. **Toast notifications:** Use `react-hot-toast` with 5-second duration for all success/error messages.
9. **File naming:** Models use PascalCase (e.g., `User.js`), routes use kebab (e.g., `auth.routes.js`), React pages use PascalCase (e.g., `Dashboard.jsx`).

---

## STEP 1: Project Scaffolding & Configuration

### 1.1 Create the project directory structure

Create the following directory structure exactly:

```
student-dashboard-mern/
├── server/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── utils/
│   ├── uploads/
│   └── seed/
├── client/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── context/
│       ├── hooks/
│       ├── components/
│       │   ├── layout/
│       │   ├── common/
│       │   └── forms/
│       ├── pages/
│       │   ├── admin/
│       │   └── errors/
│       └── utils/
```

### 1.2 Initialize server (`server/`)

Run:
```bash
cd server
npm init -y
npm install express mongoose dotenv cors bcryptjs jsonwebtoken multer morgan express-validator cookie-parser helmet express-rate-limit
npm install -D nodemon
```

Create `server/package.json` scripts:
```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "seed": "node seed/seed.js"
  }
}
```

### 1.3 Create `server/.env`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/student_dashboard
JWT_SECRET=mern_student_dashboard_jwt_secret_key_2024
JWT_EXPIRE=7d
UPLOAD_FOLDER=uploads
MAX_FILE_SIZE=16777216
ADMIN_EMAIL=admin@sriher.edu.in
ALLOWED_EXTENSIONS=pdf,doc,docx,txt,zip,jpg,png
NODE_ENV=development
```

### 1.4 Create `server/config/config.js`

```js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  uploadFolder: process.env.UPLOAD_FOLDER || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 16777216,
  allowedExtensions: (process.env.ALLOWED_EXTENSIONS || 'pdf,doc,docx,txt,zip,jpg,png').split(','),
  nodeEnv: process.env.NODE_ENV || 'development'
};
```

### 1.5 Create `server/config/db.js`

```js
const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### 1.6 Create `server/server.js`

```js
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS
app.use(cors({
  origin: config.nodeEnv === 'development' ? 'http://localhost:5173' : true,
  credentials: true
}));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes (mount all here — added in later steps)
app.use('/api/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/dashboard', apiLimiter, require('./routes/dashboard.routes'));
app.use('/api/courses', apiLimiter, require('./routes/course.routes'));
app.use('/api/assignments', apiLimiter, require('./routes/assignment.routes'));
app.use('/api/marks', apiLimiter, require('./routes/marks.routes'));
app.use('/api/attendance', apiLimiter, require('./routes/attendance.routes'));
app.use('/api/timetables', apiLimiter, require('./routes/timetable.routes'));
app.use('/api/exams', apiLimiter, require('./routes/exam.routes'));
app.use('/api/announcements', apiLimiter, require('./routes/announcement.routes'));
app.use('/api/od', apiLimiter, require('./routes/od.routes'));
app.use('/api/todos', apiLimiter, require('./routes/todo.routes'));
app.use('/api/notifications', apiLimiter, require('./routes/notification.routes'));
app.use('/api/events', apiLimiter, require('./routes/event.routes'));
app.use('/api/analytics', apiLimiter, require('./routes/analytics.routes'));
app.use('/api/settings', apiLimiter, require('./routes/settings.routes'));
app.use('/api/admin', apiLimiter, require('./routes/admin.routes'));

// Serve React app in production
if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handler (must be last)
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});
```

### 1.7 Initialize client (`client/`)

Run:
```bash
cd client
npm create vite@latest . -- --template react
npm install axios react-router-dom react-icons react-hot-toast dayjs
npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer
npx tailwindcss init -p
```

### 1.8 Configure `client/tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 1.9 Configure `client/vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000'
    }
  }
});
```

### 1.10 Set up `client/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Verification for Step 1:
- `server/` has all config files, `.env`, `server.js`
- `client/` is a working Vite React app with Tailwind CSS configured
- Both directories have `node_modules` installed
- Running `npm run dev` in `client/` opens a React page on port 5173

---

## STEP 2: All 14 Mongoose Models

Create every model file in `server/models/`. Each model must match the schema specification EXACTLY. Do NOT change field names, types, or defaults.

### 2.1 `server/models/User.js`

```js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, minlength: 2 },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role:          { type: String, enum: ['admin', 'teacher', 'student', 'pending_teacher'], default: 'student' },
  batch_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
  created_at:    { type: Date, default: Date.now }
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password_hash);
};

module.exports = mongoose.model('User', userSchema);
```

### 2.2 `server/models/Course.js`

```js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  code:        { type: String, unique: true, sparse: true },
  description: { type: String, default: '' },
  teacher_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  batch_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  credits:     { type: Number, default: 0 },
  department:  { type: String, default: '' },
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date, default: Date.now }
});

courseSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Course', courseSchema);
```

### 2.3 `server/models/Batch.js`

```js
const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  year:       { type: Number },
  department: { type: String, default: '' },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Batch', batchSchema);
```

### 2.4 `server/models/Attendance.js`

```js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  date:          { type: Date, required: true },
  status:        { type: String, enum: ['present', 'absent'], default: 'absent' },
  hourly_status: { type: [String], default: ['N','N','N','N','N','N','N'] }, // 7 hours: P, A, N
  marked_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  marked_at:     { type: Date, default: Date.now },
  updated_at:    { type: Date, default: Date.now }
});

attendanceSchema.index({ student_id: 1, course_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
```

### 2.5 `server/models/Assignment.js`

```js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  course_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  due_date:    { type: Date },
  total_marks: { type: Number, default: 100 },
  created_at:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
```

### 2.6 `server/models/Submission.js`

```js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student_name:  { type: String },
  file_path:     { type: String },
  filename:      { type: String },
  comments:      { type: String, default: '' },
  submitted_at:  { type: Date, default: Date.now },
  status:        { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
  marks:         { type: Number, default: null },
  feedback:      { type: String, default: '' },
  graded_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  graded_at:     { type: Date }
});

submissionSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
```

### 2.7 `server/models/Marks.js`

```js
const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  exam_type:  { type: String, default: '' },
  marks:      { type: Number, required: true },
  max_marks:  { type: Number, default: 100 },
  date:       { type: Date },
  remarks:    { type: String, default: '' },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Marks', marksSchema);
```

### 2.8 `server/models/Timetable.js`

```js
const mongoose = require('mongoose');

const hourSlotSchema = new mongoose.Schema({
  hour:    { type: Number },
  subject: { type: String, default: '' },
  faculty: { type: String, default: '' },
  room:    { type: String, default: '' }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  batch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, unique: true },
  timetable: {
    Monday:    [hourSlotSchema],
    Tuesday:   [hourSlotSchema],
    Wednesday: [hourSlotSchema],
    Thursday:  [hourSlotSchema],
    Friday:    [hourSlotSchema]
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Timetable', timetableSchema);
```

### 2.9 `server/models/Exam.js`

```js
const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  course_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  exam_date:  { type: Date },
  start_time: { type: String },
  duration:   { type: String },
  venue:      { type: String, default: '' },
  exam_type:  { type: String, default: '' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', examSchema);
```

### 2.10 `server/models/Announcement.js`

```js
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title:           { type: String, default: '' },
  content:         { type: String, required: true },
  created_by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by_name: { type: String },
  created_at:      { type: Date, default: Date.now },
  target_audience: { type: String, enum: ['all', 'students', 'teachers'], default: 'all' },
  priority:        { type: String, enum: ['high', 'normal', 'low'], default: 'normal' }
});

module.exports = mongoose.model('Announcement', announcementSchema);
```

### 2.11 `server/models/ODApplication.js`

```js
const mongoose = require('mongoose');

const odApplicationSchema = new mongoose.Schema({
  student_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start_date:  { type: Date, required: true },
  end_date:    { type: Date, required: true },
  reason:      { type: String, required: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  remarks:     { type: String, default: '' },
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('ODApplication', odApplicationSchema);
```

### 2.12 `server/models/Todo.js`

```js
const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  due_date:    { type: Date },
  completed:   { type: Boolean, default: false },
  created_at:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Todo', todoSchema);
```

### 2.13 `server/models/Notification.js`

```js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message:      { type: String, required: true },
  type:         { type: String, enum: ['assignment', 'announcement', 'grade', 'od', 'general'], default: 'general' },
  reference_id: { type: mongoose.Schema.Types.ObjectId },
  read:         { type: Boolean, default: false },
  created_at:   { type: Date, default: Date.now }
});

notificationSchema.index({ user_id: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
```

### 2.14 `server/models/Event.js`

```js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  event_date:  { type: Date },
  location:    { type: String, default: '' },
  event_type:  { type: String, default: '' },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
```

### Verification for Step 2:
- All 14 model files exist in `server/models/`
- Compound indexes on Attendance (`student_id + course_id + date`) and Submission (`assignment_id + student_id`)
- User model has `pre('save')` hook for bcrypt hashing and `matchPassword` method

---

## STEP 3: Middleware

### 3.1 `server/middleware/errorHandler.js`

Global error handler. Must be the LAST middleware registered in `server.js`.

```js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for ${field}`;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Resource not found';
  }

  res.status(statusCode).json({
    success: false,
    error: message
  });
};

module.exports = errorHandler;
```

### 3.2 `server/middleware/auth.js`

JWT verification. Extracts token from httpOnly cookie OR `Authorization: Bearer <token>` header. Attaches full user object (minus password) to `req.user`.

```js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check cookie first, then Authorization header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = await User.findById(decoded.id).select('-password_hash');

    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
```

### 3.3 `server/middleware/role.js`

Role-based access control. Each function checks `req.user.role`.

```js
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, error: 'Admin access required' });
};

const isTeacher = (req, res, next) => {
  if (req.user && ['teacher', 'admin'].includes(req.user.role)) return next();
  return res.status(403).json({ success: false, error: 'Teacher access required' });
};

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') return next();
  return res.status(403).json({ success: false, error: 'Student access required' });
};

const isTeacherOrAdmin = isTeacher; // alias

module.exports = { isAdmin, isTeacher, isStudent, isTeacherOrAdmin };
```

### 3.4 `server/middleware/upload.js`

Multer configuration. Saves to `uploads/` directory. Limits file size to 16MB. Only allows PDF, DOC, DOCX, TXT, ZIP, JPG, PNG.

```js
const multer = require('multer');
const path = require('path');
const config = require('../config/config');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', config.uploadFolder));
  },
  filename: function (req, file, cb) {
    const uniqueName = `${req.user._id}_${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (config.allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} not allowed. Allowed: ${config.allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter
});

module.exports = upload;
```

### 3.5 `server/utils/generateToken.js`

```js
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpire });
};

module.exports = generateToken;
```

### 3.6 `server/utils/helpers.js`

```js
// Helper to create notification
const Notification = require('../models/Notification');

const createNotification = async (userId, message, type = 'general', referenceId = null) => {
  try {
    await Notification.create({
      user_id: userId,
      message,
      type,
      reference_id: referenceId
    });
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

// Helper to create notifications for multiple users
const createBulkNotifications = async (userIds, message, type = 'general', referenceId = null) => {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      message,
      type,
      reference_id: referenceId
    }));
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error creating bulk notifications:', error.message);
  }
};

module.exports = { createNotification, createBulkNotifications };
```

### Verification for Step 3:
- All 4 middleware files exist
- `generateToken.js` and `helpers.js` in utils
- Auth middleware checks both cookies and Authorization header
- Upload middleware validates file extensions and size

---

## STEP 4: Seed Script

### 4.1 `server/seed/seed.js`

This script seeds the database with default users, batches, and courses. It must:
1. Clear all existing data (drop collections)
2. Create 1 admin user: `admin@sriher.edu.in` / `Admin@123`
3. Create 3 teacher users: `daa@sriher.edu.in`, `python@sriher.edu.in`, `dbms@sriher.edu.in` — all with password `teacher123`
4. Create 10 student users: `e0324001@sriher.edu.in` to `e0324010@sriher.edu.in` — password format `E0324XXX@24`
5. Create 1 batch: "B.Tech CSE 2024" with year 2024, department "Computer Science"
6. Assign all 10 students to that batch
7. Create 2 courses: "Design and Analysis of Algorithms" (code: CS301, teacher: daa) and "Python Programming" (code: CS302, teacher: python), both assigned to the batch
8. Create a sample timetable for the batch

**IMPORTANT:** The seed script must use `User.create()` (not `insertMany`) so that the pre-save bcrypt hook fires for each user. OR manually hash passwords before inserting.

```js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/User');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Timetable = require('../models/Timetable');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Batch.deleteMany({});
    await Course.deleteMany({});
    await Timetable.deleteMany({});

    const hashPassword = async (pw) => {
      const salt = await bcrypt.genSalt(12);
      return bcrypt.hash(pw, salt);
    };

    // Create admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@sriher.edu.in',
      password_hash: await hashPassword('Admin@123'),
      role: 'admin'
    });
    // NOTE: Since pre-save hook also hashes, we need to avoid double-hashing.
    // Set password_hash directly without the hook by using updateOne or
    // adjust the model. Simplest: skip pre-save for seed by inserting pre-hashed values.

    console.log('Admin created');

    // Create teachers
    const teacher1 = await User.create({
      name: 'DAA Faculty',
      email: 'daa@sriher.edu.in',
      password_hash: await hashPassword('teacher123'),
      role: 'teacher'
    });
    const teacher2 = await User.create({
      name: 'Python Faculty',
      email: 'python@sriher.edu.in',
      password_hash: await hashPassword('teacher123'),
      role: 'teacher'
    });
    const teacher3 = await User.create({
      name: 'DBMS Faculty',
      email: 'dbms@sriher.edu.in',
      password_hash: await hashPassword('teacher123'),
      role: 'teacher'
    });
    console.log('Teachers created');

    // Create batch
    const batch = await Batch.create({
      name: 'B.Tech CSE 2024',
      year: 2024,
      department: 'Computer Science',
      teacher_id: teacher1._id
    });
    console.log('Batch created');

    // Create students
    const students = [];
    for (let i = 1; i <= 10; i++) {
      const padded = String(i).padStart(3, '0');
      const student = await User.create({
        name: `Student ${padded}`,
        email: `e0324${padded}@sriher.edu.in`,
        password_hash: await hashPassword(`E0324${padded}@24`),
        role: 'student',
        batch_id: batch._id
      });
      students.push(student);
    }
    console.log('Students created');

    // Create courses
    const course1 = await Course.create({
      name: 'Design and Analysis of Algorithms',
      code: 'CS301',
      description: 'Study of algorithm design techniques and analysis',
      teacher_id: teacher1._id,
      batch_id: batch._id,
      credits: 4,
      department: 'Computer Science'
    });
    const course2 = await Course.create({
      name: 'Python Programming',
      code: 'CS302',
      description: 'Introduction to Python programming language',
      teacher_id: teacher2._id,
      batch_id: batch._id,
      credits: 3,
      department: 'Computer Science'
    });
    console.log('Courses created');

    // Create sample timetable
    await Timetable.create({
      batch_id: batch._id,
      timetable: {
        Monday: [
          { hour: 1, subject: 'DAA', faculty: 'DAA Faculty', room: 'CS-101' },
          { hour: 2, subject: 'Python', faculty: 'Python Faculty', room: 'CS-102' },
          { hour: 3, subject: 'DAA', faculty: 'DAA Faculty', room: 'CS-101' },
          { hour: 4, subject: 'Python', faculty: 'Python Faculty', room: 'Lab-1' },
          { hour: 5, subject: 'DBMS', faculty: 'DBMS Faculty', room: 'CS-103' },
          { hour: 6, subject: 'Free', faculty: '', room: '' },
          { hour: 7, subject: 'Free', faculty: '', room: '' }
        ],
        Tuesday: [
          { hour: 1, subject: 'Python', faculty: 'Python Faculty', room: 'CS-102' },
          { hour: 2, subject: 'DAA', faculty: 'DAA Faculty', room: 'CS-101' },
          { hour: 3, subject: 'DBMS', faculty: 'DBMS Faculty', room: 'CS-103' },
          { hour: 4, subject: 'DAA', faculty: 'DAA Faculty', room: 'Lab-1' },
          { hour: 5, subject: 'Python', faculty: 'Python Faculty', room: 'CS-102' },
          { hour: 6, subject: 'Free', faculty: '', room: '' },
          { hour: 7, subject: 'Free', faculty: '', room: '' }
        ],
        Wednesday: [
          { hour: 1, subject: 'DBMS', faculty: 'DBMS Faculty', room: 'CS-103' },
          { hour: 2, subject: 'DAA', faculty: 'DAA Faculty', room: 'CS-101' },
          { hour: 3, subject: 'Python', faculty: 'Python Faculty', room: 'Lab-1' },
          { hour: 4, subject: 'Python', faculty: 'Python Faculty', room: 'Lab-1' },
          { hour: 5, subject: 'DAA', faculty: 'DAA Faculty', room: 'CS-101' },
          { hour: 6, subject: 'Free', faculty: '', room: '' },
          { hour: 7, subject: 'Free', faculty: '', room: '' }
        ],
        Thursday: [
          { hour: 1, subject: 'DAA', faculty: 'DAA Faculty', room: 'CS-101' },
          { hour: 2, subject: 'DBMS', faculty: 'DBMS Faculty', room: 'CS-103' },
          { hour: 3, subject: 'Python', faculty: 'Python Faculty', room: 'CS-102' },
          { hour: 4, subject: 'DAA', faculty: 'DAA Faculty', room: 'Lab-1' },
          { hour: 5, subject: 'Free', faculty: '', room: '' },
          { hour: 6, subject: 'Free', faculty: '', room: '' },
          { hour: 7, subject: 'Free', faculty: '', room: '' }
        ],
        Friday: [
          { hour: 1, subject: 'Python', faculty: 'Python Faculty', room: 'CS-102' },
          { hour: 2, subject: 'Python', faculty: 'Python Faculty', room: 'Lab-1' },
          { hour: 3, subject: 'DAA', faculty: 'DAA Faculty', room: 'CS-101' },
          { hour: 4, subject: 'DBMS', faculty: 'DBMS Faculty', room: 'CS-103' },
          { hour: 5, subject: 'Free', faculty: '', room: '' },
          { hour: 6, subject: 'Free', faculty: '', room: '' },
          { hour: 7, subject: 'Free', faculty: '', room: '' }
        ]
      }
    });
    console.log('Timetable created');

    console.log('\n--- Seed Complete ---');
    console.log('Admin: admin@sriher.edu.in / Admin@123');
    console.log('Teacher: daa@sriher.edu.in / teacher123');
    console.log('Student: e0324001@sriher.edu.in / E0324001@24');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
```

**IMPORTANT NOTE ON DOUBLE-HASHING:** The User model has a pre-save hook that hashes `password_hash`. In the seed script, we are manually hashing with bcrypt THEN saving, which would cause DOUBLE hashing. To fix this, either:
- (A) In the seed script, set the field to the plain password and let the hook handle it, OR
- (B) Use `User.collection.insertOne()` to bypass hooks after manually hashing.

**Recommended fix:** In the seed, pass the PLAIN PASSWORD as `password_hash` and let the pre-save hook do the hashing:
```js
const admin = await User.create({
  name: 'Admin',
  email: 'admin@sriher.edu.in',
  password_hash: 'Admin@123',  // pre-save hook will hash this
  role: 'admin'
});
```

### Verification for Step 4:
- Running `npm run seed` creates all users, batch, courses, and timetable
- Can login with seeded credentials after auth is implemented

---

## STEP 5: All Backend Routes & Controllers

Create ALL 16 route files and their corresponding controller files. Each route file goes in `server/routes/` and each controller in `server/controllers/`.

### 5.1 Auth Routes & Controller

**`server/routes/auth.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| POST | `/login` | none | `login` |
| POST | `/register` | none | `register` |
| GET | `/logout` | none | `logout` |
| GET | `/me` | `protect` | `getMe` |

**`server/controllers/auth.controller.js`**

Business rules:
- `login`: Find user by email, compare password with `matchPassword()`, generate JWT, set httpOnly cookie, return user data (id, name, email, role, batch_id)
- `register`: Validate email ends with `@sriher.edu.in`, validate password >= 8 chars, check email not taken, if `is_teacher` flag then role = `pending_teacher` else `student`, create user, generate JWT, set cookie
- `logout`: Clear the `token` cookie
- `getMe`: Return `req.user` (already attached by auth middleware)

Cookie settings:
```js
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

### 5.2 Dashboard Routes & Controller

**`server/routes/dashboard.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getDashboard` |

**`server/controllers/dashboard.controller.js`**

Business rules:
- If admin: return counts of total users, students, teachers, courses
- If teacher: return count of own courses, own assignments, pending OD applications, upcoming assignment deadlines
- If student: return count of enrolled courses (by batch), pending assignments, attendance percentage, upcoming exams, recent notifications (last 5)

### 5.3 Course Routes & Controller

**`server/routes/course.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getCourses` |
| POST | `/` | `protect, isTeacher` | `createCourse` |
| PUT | `/:id` | `protect, isTeacher` | `updateCourse` |
| DELETE | `/:id` | `protect, isTeacher` | `deleteCourse` |

**`server/controllers/course.controller.js`**

Business rules:
- `getCourses`: Admin sees ALL courses. Teacher sees courses where `teacher_id === req.user._id`. Student sees courses where `batch_id === req.user.batch_id`. Populate teacher name and batch name.
- `createCourse`: Require name, code, teacher_id, batch_id. Set teacher_id from body (admin) or from req.user (teacher).
- `updateCourse`: Find by id, update fields, save.
- `deleteCourse`: Find by id, delete. Also delete all related assignments, submissions, marks, attendance, exams for that course.

### 5.4 Assignment Routes & Controller

**`server/routes/assignment.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getAssignments` |
| POST | `/` | `protect, isTeacher` | `createAssignment` |
| PUT | `/:id` | `protect, isTeacher` | `updateAssignment` |
| DELETE | `/:id` | `protect, isTeacher` | `deleteAssignment` |
| POST | `/:id/submit` | `protect, isStudent` | `submitAssignment` |
| GET | `/:id/submissions` | `protect, isTeacher` | `getSubmissions` |

**`server/controllers/assignment.controller.js`**

Business rules:
- `getAssignments`: For students, include submission status (whether they've submitted). For teachers, include submission count.
- `createAssignment`: Create assignment, then create notifications for all students in the course's batch.
- `submitAssignment`: Use multer upload middleware. If student already has a submission for this assignment, UPDATE the existing record (upsert). Save file to `uploads/`.
- `deleteAssignment`: Also delete all submissions for that assignment.

### 5.5 Marks Routes & Controller

**`server/routes/marks.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getMarks` |
| GET | `/:student_id` | `protect, isTeacher` | `getStudentMarks` |
| POST | `/` | `protect, isTeacher` | `addMarks` |
| PUT | `/:id` | `protect, isTeacher` | `updateMarks` |
| DELETE | `/:id` | `protect, isTeacher` | `deleteMarks` |

**`server/controllers/marks.controller.js`**

Business rules:
- `getMarks`: Teacher sees marks for courses they teach. Student sees only own marks. Populate course name and student name.
- `addMarks`: Create marks entry, send notification to the student.
- `updateMarks`, `deleteMarks`: Standard CRUD.

### 5.6 Attendance Routes & Controller — MOST COMPLEX

**`server/routes/attendance.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getAttendance` |
| GET | `/course/:course_id` | `protect, isTeacher` | `getAttendanceByCourse` |
| POST | `/mark/:course_id` | `protect, isTeacher` | `markAttendance` |
| GET | `/report/:course_id/:date` | `protect, isTeacher` | `getAttendanceReport` |
| GET | `/history/:student_id` | `protect` | `getAttendanceHistory` |
| PUT | `/:id` | `protect, isTeacher` | `editAttendance` |

**`server/controllers/attendance.controller.js`**

Critical business logic for `markAttendance`:

```
INPUT: {
  course_id (from URL param),
  date (from body),
  selected_hours: [1, 2, 3],  // which hours are being marked
  attendance: {
    "studentId1": { "1": "P", "2": "A", "3": "P" },
    "studentId2": { "1": "A", "2": "P", "3": "P" }
  }
}
```

For EACH student in the submitted attendance data:
1. Check if an Attendance record already exists for this student + course + date
2. If EXISTS: **MERGE** — only update the hours that are in `selected_hours`. Leave all other hours unchanged.
   ```
   existing.hourly_status = ['P', 'A', 'N', 'N', 'N', 'N', 'N']
   selected_hours = [2, 3]
   submitted = { "2": "P", "3": "A" }
   result = ['P', 'P', 'A', 'N', 'N', 'N', 'N']  // hour 1 unchanged, 2 & 3 updated
   ```
3. If NOT EXISTS: Create a new record with `['N','N','N','N','N','N','N']` base, then fill in selected hours
4. Compute overall `status`: if ANY element in `hourly_status` is `'P'`, status = `'present'`, else `'absent'`
5. Check for approved OD: If the student has an approved OD application covering this date, auto-mark affected hours as `'P'`

Use `bulkWrite` for efficiency when handling an entire batch of students.

For `getAttendance` (student view):
- Get all attendance records for the student
- Group by course
- Calculate percentage: `(records with status 'present' / total records) * 100` per course

For `getAttendanceHistory`:
- Return all attendance records for the student, sorted by date descending
- Include hourly_status details

### 5.7 Timetable Routes & Controller

**`server/routes/timetable.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getTimetables` |
| GET | `/:batch_id` | `protect` | `getTimetableByBatch` |
| POST | `/upload` | `protect, isAdmin` | `createOrUpdateTimetable` |
| DELETE | `/:batch_id` | `protect, isAdmin` | `deleteTimetable` |

### 5.8 Exam Routes & Controller

**`server/routes/exam.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getExams` |
| POST | `/` | `protect, isTeacher` | `createExam` |
| PUT | `/:id` | `protect, isTeacher` | `updateExam` |
| DELETE | `/:id` | `protect, isTeacher` | `deleteExam` |

### 5.9 Announcement Routes & Controller

**`server/routes/announcement.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getAnnouncements` |
| POST | `/` | `protect, isTeacher` | `createAnnouncement` |
| DELETE | `/:id` | `protect, isAdmin` | `deleteAnnouncement` |

Business rules:
- `createAnnouncement`: Set `created_by_name` from `req.user.name`. Create notifications for all users (or target audience).

### 5.10 OD Routes & Controller

**`server/routes/od.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| POST | `/apply` | `protect, isStudent` | `applyOD` |
| GET | `/status` | `protect, isStudent` | `getODStatus` |
| GET | `/approvals` | `protect, isTeacher` | `getODApprovals` |
| PUT | `/approvals/:id` | `protect, isTeacher` | `approveRejectOD` |

Business rules:
- `applyOD`: Validate start_date <= end_date. Create ODApplication with status `pending`.
- `getODStatus`: Return all OD applications for the logged-in student, sorted newest first.
- `getODApprovals`: Return all `pending` OD applications with student name populated.
- `approveRejectOD`: Update status to `approved` or `rejected`, set `approved_by` and `remarks`. Create notification for the student.

### 5.11 Todo Routes & Controller

**`server/routes/todo.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getTodos` |
| POST | `/` | `protect` | `createTodo` |
| PUT | `/:id` | `protect` | `updateTodo` |
| DELETE | `/:id` | `protect` | `deleteTodo` |

All operations filtered by `req.user._id` — users can only see/edit their own todos.

### 5.12 Notification Routes & Controller

**`server/routes/notification.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getNotifications` |
| GET | `/count` | `protect` | `getUnreadCount` |
| PUT | `/:id/read` | `protect` | `markAsRead` |

Business rules:
- `getNotifications`: Get all notifications for `req.user._id`, sorted newest first. Mark all as read.
- `getUnreadCount`: Count notifications where `user_id === req.user._id && read === false`.

### 5.13 Event Routes & Controller

**`server/routes/event.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getEvents` |
| POST | `/` | `protect, isTeacher` | `createEvent` |

### 5.14 Analytics Routes & Controller

**`server/routes/analytics.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getAnalytics` |

Business rules:
- Return aggregated stats: user counts by role, course count, average attendance per course (using MongoDB aggregation), recent assignments, submission counts.

### 5.15 Settings Routes & Controller

**`server/routes/settings.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/` | `protect` | `getProfile` |
| PUT | `/` | `protect` | `updateProfile` |
| PUT | `/password` | `protect` | `changePassword` |

Business rules:
- `updateProfile`: Only allow updating `name`.
- `changePassword`: Require current password (verify with `matchPassword`), then update with new password. The pre-save hook will hash it.

### 5.16 Admin Routes & Controller

**`server/routes/admin.routes.js`**

| Method | Path | Middleware | Controller Function |
|--------|------|-----------|-------------------|
| GET | `/users` | `protect, isAdmin` | `getUsers` |
| POST | `/users` | `protect, isAdmin` | `createUser` |
| DELETE | `/users/:id` | `protect, isAdmin` | `deleteUser` |
| GET | `/batches` | `protect, isAdmin` | `getBatches` |
| POST | `/batches` | `protect, isAdmin` | `createBatch` |
| PUT | `/batches/:id` | `protect, isAdmin` | `updateBatch` |
| DELETE | `/batches/:id` | `protect, isAdmin` | `deleteBatch` |
| GET | `/batches/:id/students` | `protect, isAdmin` | `getBatchStudents` |
| POST | `/batches/:id/students` | `protect, isAdmin` | `manageBatchStudents` |
| GET | `/timetables` | `protect, isAdmin` | `getAdminTimetables` |
| GET | `/attendance/reports` | `protect, isAdmin` | `getAttendanceReports` |
| GET | `/attendance/by-course` | `protect, isAdmin` | `getAttendanceByCourse` |
| GET | `/attendance/by-date` | `protect, isAdmin` | `getAttendanceByDate` |
| GET | `/attendance/by-student` | `protect, isAdmin` | `getAttendanceByStudent` |

Business rules:
- `createUser`: Admin can create users with any role (admin, teacher, student). Hash password.
- `deleteUser`: Cannot delete self. Also remove from batch if student.
- `manageBatchStudents`: Body contains `{ add: [studentIds], remove: [studentIds] }`. For adding, set `batch_id` on user. For removing, set `batch_id` to null. **Store batch_id as ObjectId, not string.**
- `getBatches`: Include student count for each batch (count users where `batch_id` matches).
- Attendance reports: Use MongoDB aggregation pipelines to compute attendance statistics by course, date, and student.

### Verification for Step 5:
- All 16 route files exist in `server/routes/`
- All 16 controller files exist in `server/controllers/`
- All routes are mounted in `server.js`
- Every POST/PUT endpoint has input validation
- Attendance merge logic correctly handles partial hour updates
- Notifications are created on: new assignment, new announcement, OD approval/rejection, marks added

---

## STEP 6: React Frontend — Core Infrastructure

### 6.1 `client/src/api/axios.js`

```js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Response interceptor — redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't redirect if already on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 6.2 `client/src/context/AuthContext.jsx`

Must provide:
- `user` state (null when logged out, object when logged in: `{ _id, name, email, role, batch_id }`)
- `loading` state (true while checking auth on mount)
- `login(email, password)` function — POST to `/api/auth/login`, set user state
- `register(name, email, password, isTeacher)` function — POST to `/api/auth/register`, set user state
- `logout()` function — GET `/api/auth/logout`, clear user state, redirect to `/login`
- On mount: call `GET /api/auth/me` to restore session from cookie

### 6.3 `client/src/hooks/useAuth.js`

Simple hook that returns `useContext(AuthContext)`.

### 6.4 `client/src/hooks/useFetch.js`

Custom hook that takes a URL, calls `api.get(url)` on mount, returns `{ data, loading, error, refetch }`.

### 6.5 `client/src/components/common/ProtectedRoute.jsx`

If user is not authenticated and loading is false, redirect to `/login`. Otherwise render `<Outlet />`.

### 6.6 `client/src/components/common/RoleRoute.jsx`

Takes `roles` prop (array). If `user.role` is not in the array, redirect to `/dashboard`. Otherwise render children.

### 6.7 `client/src/components/common/LoadingSpinner.jsx`

A centered spinning loader using Tailwind `animate-spin`.

### 6.8 `client/src/components/common/ConfirmDialog.jsx`

A modal dialog for delete confirmations. Props: `isOpen, onConfirm, onCancel, message`.

### 6.9 `client/src/components/common/Card.jsx`

Reusable card wrapper: `bg-white rounded-lg shadow-md p-6`.

### 6.10 `client/src/utils/constants.js`

```js
export const TIME_SLOTS = [
  { hour: 1, start: '08:00', end: '08:55', label: 'Hour 1 (8:00-8:55)' },
  { hour: 2, start: '08:55', end: '09:50', label: 'Hour 2 (8:55-9:50)' },
  { hour: 3, start: '10:10', end: '11:05', label: 'Hour 3 (10:10-11:05)' },
  { hour: 4, start: '11:05', end: '12:00', label: 'Hour 4 (11:05-12:00)' },
  { hour: 5, start: '13:00', end: '13:50', label: 'Hour 5 (1:00-1:50)' },
  { hour: 6, start: '13:50', end: '14:40', label: 'Hour 6 (1:50-2:40)' },
  { hour: 7, start: '14:55', end: '15:45', label: 'Hour 7 (2:55-3:45)' },
];

export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PENDING_TEACHER: 'pending_teacher'
};

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'zip', 'jpg', 'png'];
```

### 6.11 `client/src/utils/helpers.js`

```js
import { TIME_SLOTS } from './constants';

export function getCurrentHour() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  for (const slot of TIME_SLOTS) {
    const [sh, sm] = slot.start.split(':').map(Number);
    const [eh, em] = slot.end.split(':').map(Number);
    if (minutes >= sh * 60 + sm && minutes <= eh * 60 + em) return slot.hour;
  }
  return null;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function isOverdue(dueDate) {
  return new Date(dueDate) < new Date();
}
```

### Verification for Step 6:
- Axios instance with interceptor created
- AuthContext with login/register/logout/getMe
- ProtectedRoute and RoleRoute components
- Utility functions and constants

---

## STEP 7: React Layout & Navigation

### 7.1 `client/src/components/layout/Navbar.jsx`

This is the MOST CRITICAL frontend component. It must replicate the original Flask `base.html` navbar exactly.

Requirements:
- Fixed top navbar with `bg-gray-800 text-white`
- Logo/brand link ("Student Dashboard") → `/dashboard`
- Menu items conditional on `user.role`:
  - **ALL roles:** Dashboard, Courses, Assignments, Marks, Attendance, Exam Schedule, Calendar
  - **Student only:** OD Status, Todo
  - **Teacher/Admin:** Mark Attendance, Add Course, Add Assignment, OD Approvals, Announcements
  - **Admin only dropdown ("Admin"):** Manage Users, Manage Batches, Manage Timetables, Attendance Reports, Analytics
- **Notification bell icon** with red badge showing unread count
  - Auto-refresh every 30 seconds using `setInterval` calling `GET /api/notifications/count`
  - Clicking navigates to `/notifications`
- User name display and role badge
- Settings link (gear icon)
- Logout button
- **Mobile responsive:** Hamburger menu toggle that shows/hides menu on small screens
- Dropdown submenus for Attendance and Admin sections

### 7.2 `client/src/components/layout/Footer.jsx`

Simple footer: "© 2024 Student Dashboard. All rights reserved." Centered, `bg-gray-800 text-white py-4`.

### 7.3 `client/src/components/layout/Layout.jsx`

```jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      <main className="container mx-auto px-4 py-6 flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
```

### 7.4 `client/src/App.jsx`

Complete router setup with ALL routes. Every route must be listed here.

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import AddCourse from './pages/AddCourse';
import EditCourse from './pages/EditCourse';
import Assignments from './pages/Assignments';
import AddAssignment from './pages/AddAssignment';
import EditAssignment from './pages/EditAssignment';
import SubmitAssignment from './pages/SubmitAssignment';
import Marks from './pages/Marks';
import EditMarks from './pages/EditMarks';
import Attendance from './pages/Attendance';
import MarkAttendance from './pages/MarkAttendance';
import AttendanceReport from './pages/AttendanceReport';
import ViewAttendanceHistory from './pages/ViewAttendanceHistory';
import EditAttendance from './pages/EditAttendance';
import Timetables from './pages/Timetables';
import ExamSchedule from './pages/ExamSchedule';
import AddExam from './pages/AddExam';
import Announcements from './pages/Announcements';
import ApplyOD from './pages/ApplyOD';
import ODStatus from './pages/ODStatus';
import ODApprovals from './pages/ODApprovals';
import Todo from './pages/Todo';
import Notifications from './pages/Notifications';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Admin pages
import ManageUsers from './pages/admin/ManageUsers';
import ManageBatches from './pages/admin/ManageBatches';
import EditBatch from './pages/admin/EditBatch';
import ManageBatchStudents from './pages/admin/ManageBatchStudents';
import ManageTimetables from './pages/admin/ManageTimetables';
import AttendanceReports from './pages/admin/AttendanceReports';
import AttendanceByCourse from './pages/admin/AttendanceByCourse';
import AttendanceByDate from './pages/admin/AttendanceByDate';
import AttendanceByStudent from './pages/admin/AttendanceByStudent';

// Error pages
import NotFound from './pages/errors/NotFound';
import Forbidden from './pages/errors/Forbidden';
import ServerError from './pages/errors/ServerError';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/add" element={<RoleRoute roles={['teacher','admin']}><AddCourse /></RoleRoute>} />
              <Route path="/courses/edit/:id" element={<RoleRoute roles={['teacher','admin']}><EditCourse /></RoleRoute>} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/assignments/add" element={<RoleRoute roles={['teacher','admin']}><AddAssignment /></RoleRoute>} />
              <Route path="/assignments/edit/:id" element={<RoleRoute roles={['teacher','admin']}><EditAssignment /></RoleRoute>} />
              <Route path="/assignments/:id/submit" element={<RoleRoute roles={['student']}><SubmitAssignment /></RoleRoute>} />
              <Route path="/marks" element={<Marks />} />
              <Route path="/marks/edit" element={<RoleRoute roles={['teacher','admin']}><EditMarks /></RoleRoute>} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/attendance/mark" element={<RoleRoute roles={['teacher','admin']}><MarkAttendance /></RoleRoute>} />
              <Route path="/attendance/report/:courseId/:date" element={<RoleRoute roles={['teacher','admin']}><AttendanceReport /></RoleRoute>} />
              <Route path="/attendance/history/:studentId" element={<ViewAttendanceHistory />} />
              <Route path="/attendance/edit/:id" element={<RoleRoute roles={['teacher','admin']}><EditAttendance /></RoleRoute>} />
              <Route path="/timetables" element={<Timetables />} />
              <Route path="/exam-schedule" element={<ExamSchedule />} />
              <Route path="/exam-schedule/add" element={<RoleRoute roles={['teacher','admin']}><AddExam /></RoleRoute>} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/od/apply" element={<RoleRoute roles={['student']}><ApplyOD /></RoleRoute>} />
              <Route path="/od/status" element={<RoleRoute roles={['student']}><ODStatus /></RoleRoute>} />
              <Route path="/od/approvals" element={<RoleRoute roles={['teacher','admin']}><ODApprovals /></RoleRoute>} />
              <Route path="/todo" element={<Todo />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />

              {/* Admin routes */}
              <Route path="/admin/users" element={<RoleRoute roles={['admin']}><ManageUsers /></RoleRoute>} />
              <Route path="/admin/batches" element={<RoleRoute roles={['admin']}><ManageBatches /></RoleRoute>} />
              <Route path="/admin/batches/edit/:id" element={<RoleRoute roles={['admin']}><EditBatch /></RoleRoute>} />
              <Route path="/admin/batches/:id/students" element={<RoleRoute roles={['admin']}><ManageBatchStudents /></RoleRoute>} />
              <Route path="/admin/timetables" element={<RoleRoute roles={['admin']}><ManageTimetables /></RoleRoute>} />
              <Route path="/admin/attendance/reports" element={<RoleRoute roles={['admin']}><AttendanceReports /></RoleRoute>} />
              <Route path="/admin/attendance/by-course" element={<RoleRoute roles={['admin']}><AttendanceByCourse /></RoleRoute>} />
              <Route path="/admin/attendance/by-date" element={<RoleRoute roles={['admin']}><AttendanceByDate /></RoleRoute>} />
              <Route path="/admin/attendance/by-student" element={<RoleRoute roles={['admin']}><AttendanceByStudent /></RoleRoute>} />
            </Route>
          </Route>

          {/* Error routes */}
          <Route path="/403" element={<Forbidden />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### 7.5 `client/src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Verification for Step 7:
- Navbar renders with all menu items based on role
- Notification badge shows unread count, auto-refreshes every 30 seconds
- Mobile hamburger menu works
- All routes defined in App.jsx
- Layout wraps all protected pages with navbar and footer

---

## STEP 8: All React Pages (25+ Pages)

Create ALL page components listed in App.jsx. Each page must:
- Fetch data from the corresponding API endpoint
- Display loading spinner while fetching
- Show error toast on API failure
- Show success toast on successful create/update/delete
- Use Tailwind CSS matching the design system
- Handle role-based content correctly

### Page List with Descriptions:

| # | File | Key Behavior |
|---|------|-------------|
| 1 | `Login.jsx` | Centered card, email + password form, submit calls `login()`, link to register |
| 2 | `Register.jsx` | Centered card, name + email + password + "I am a teacher" checkbox, link to login |
| 3 | `Dashboard.jsx` | Role-based stat cards + quick action buttons |
| 4 | `Courses.jsx` | Table/card list of courses, add/edit/delete for teachers |
| 5 | `AddCourse.jsx` | Form with teacher and batch dropdowns |
| 6 | `EditCourse.jsx` | Pre-filled form, fetch course by URL param `:id` |
| 7 | `Assignments.jsx` | Card list with due dates, submission status for students |
| 8 | `AddAssignment.jsx` | Form with course dropdown (teacher's courses only) |
| 9 | `EditAssignment.jsx` | Pre-filled form |
| 10 | `SubmitAssignment.jsx` | File upload with `<input type="file">`, sends FormData |
| 11 | `Marks.jsx` | Table grouped by course, edit buttons for teachers |
| 12 | `EditMarks.jsx` | Form with student, course, exam type, marks fields |
| 13 | `Attendance.jsx` | Student: % per course table. Teacher: course selection to mark. |
| 14 | `MarkAttendance.jsx` | **CRITICAL:** Course select → date → hour checkboxes (auto-detect) → student×hour grid with P/A radios → submit |
| 15 | `AttendanceReport.jsx` | Report for course + date showing all students' hourly status |
| 16 | `ViewAttendanceHistory.jsx` | Student's attendance history with dates and hourly status |
| 17 | `EditAttendance.jsx` | Edit a single attendance record's hourly status |
| 18 | `Timetables.jsx` | 5-day × 7-hour grid, highlight current day/hour |
| 19 | `ExamSchedule.jsx` | Chronological card list of exams |
| 20 | `AddExam.jsx` | Form with course dropdown, date, time, venue |
| 21 | `Announcements.jsx` | Card list + post form (teacher/admin) |
| 22 | `ApplyOD.jsx` | Start date, end date, reason form |
| 23 | `ODStatus.jsx` | Student's OD list with colored badges |
| 24 | `ODApprovals.jsx` | Pending ODs with approve/reject + remarks |
| 25 | `Todo.jsx` | Add form + checklist with toggle and delete |
| 26 | `Notifications.jsx` | List with read/unread styling |
| 27 | `Calendar.jsx` | Event cards sorted by date |
| 28 | `Analytics.jsx` | Stat cards + summary tables |
| 29 | `Settings.jsx` | Profile edit + password change forms |

### Admin Pages:

| # | File | Key Behavior |
|---|------|-------------|
| 30 | `admin/ManageUsers.jsx` | User table + add form + delete |
| 31 | `admin/ManageBatches.jsx` | Batch cards + create form |
| 32 | `admin/EditBatch.jsx` | Edit batch details |
| 33 | `admin/ManageBatchStudents.jsx` | Assign/remove students |
| 34 | `admin/ManageTimetables.jsx` | 5×7 input grid per batch |
| 35 | `admin/AttendanceReports.jsx` | Hub with links to sub-reports |
| 36 | `admin/AttendanceByCourse.jsx` | Attendance analytics by course |
| 37 | `admin/AttendanceByDate.jsx` | Attendance analytics by date |
| 38 | `admin/AttendanceByStudent.jsx` | Attendance analytics by student |

### Error Pages:

| # | File | Content |
|---|------|---------|
| 39 | `errors/NotFound.jsx` | "404 — Page Not Found" + link to dashboard |
| 40 | `errors/Forbidden.jsx` | "403 — Access Denied" + link to dashboard |
| 41 | `errors/ServerError.jsx` | "500 — Server Error" + link to dashboard |

### Tailwind Design System (apply to ALL pages):

**Page headers:**
```jsx
<h1 className="text-3xl font-bold text-gray-800 mb-6">Page Title</h1>
```

**Stat cards (Dashboard):**
```jsx
<div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
  <div className="flex items-center">
    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
      <FaIcon className="text-2xl" />
    </div>
    <div className="ml-4">
      <p className="text-gray-500 text-sm">Label</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
</div>
```

**Tables:**
```jsx
<div className="overflow-x-auto">
  <table className="min-w-full bg-white rounded-lg shadow">
    <thead className="bg-gray-50">
      <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Header</th></tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      <tr className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap">Data</td></tr>
    </tbody>
  </table>
</div>
```

**Forms:**
```jsx
<div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
  <h2 className="text-2xl font-bold mb-6">Form Title</h2>
  <form onSubmit={handleSubmit}>
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">Field</label>
      <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Submit</button>
  </form>
</div>
```

**Status badges:**
```jsx
<span className={`px-2 py-1 text-xs font-semibold rounded-full ${
  status === 'approved' ? 'bg-green-100 text-green-800' :
  status === 'rejected' ? 'bg-red-100 text-red-800' :
  'bg-yellow-100 text-yellow-800'
}`}>{status}</span>
```

**Action buttons:**
```jsx
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-2">Edit</button>
<button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">Delete</button>
```

### Verification for Step 8:
- All 41 page/component files exist
- Each page fetches from the correct API endpoint
- Loading spinners shown during data fetch
- Toast notifications on success/error
- Role-based content rendering
- Forms submit to correct API endpoints
- Tailwind styling is consistent across all pages

---

## STEP 9: MarkAttendance.jsx — Detailed Implementation

This is the MOST COMPLEX page. Build it exactly as specified:

### Flow:
1. **Page load:** Fetch teacher's courses from `/api/courses`
2. **Teacher selects a course** from dropdown
3. **Fetch students** in that course's batch
4. **Date input** (default: today)
5. **Hour checkboxes:** Show 7 checkboxes with labels from `TIME_SLOTS`. Auto-detect current hour using `getCurrentHour()` and pre-check it. Also check hours from the batch timetable that match the selected course for today's day.
6. **Dynamic table generation:** When hours are selected, generate a table:
   - Header row: Student Name | Hour X | Hour Y | Hour Z (only selected hours)
   - Each student row: Name | P/A radio for each selected hour (default: P)
   - "Mark All Present" and "Mark All Absent" buttons per column
7. **Submit:** POST to `/api/attendance/mark/:course_id` with `{ date, selected_hours, attendance: { studentId: { hour: 'P'/'A' } } }`
8. **After submit:** Show success toast, reset form

### Timetable integration:
- When course is selected, fetch timetable for the course's batch
- Determine today's day name (Monday-Friday)
- Find which hours in today's timetable have the selected course's subject
- Auto-check those hour checkboxes

### OD indicator:
- Fetch approved OD applications for the selected date
- If a student has an approved OD, show an "OD" badge next to their name
- Their attendance should default to "P" for all hours

---

## STEP 10: Testing & Deployment

### 10.1 Backend Tests

Create `server/__tests__/` directory with test files using Jest + Supertest:

1. `auth.test.js` — Test login, register, invalid email domain, wrong password, missing fields
2. `attendance.test.js` — Test hourly merging: mark hours 1-2, then re-mark hour 2, verify merge
3. `assignment.test.js` — Test create, submit, re-submit upserts
4. `rbac.test.js` — Test student cannot access admin routes (403)

### 10.2 Dockerfile

Multi-stage build:
- Stage 1: Build React client
- Stage 2: Copy server + built client, run Express

### 10.3 docker-compose.yml

Services: app (Express + React) + MongoDB

### 10.4 README.md

Comprehensive setup instructions for local dev and Docker.

---

## COMPLETE FEATURE CHECKLIST

Before considering the project done, verify EVERY item:

- [ ] Login with email + password (JWT in httpOnly cookie)
- [ ] Register with @sriher.edu.in restriction
- [ ] Role-based dashboard (admin/teacher/student)
- [ ] Course CRUD (teacher/admin)
- [ ] Assignment CRUD with file upload submissions
- [ ] Re-submission updates existing record (not duplicate)
- [ ] Marks CRUD with student notifications
- [ ] Hourly attendance marking with 7-hour day
- [ ] Attendance hourly_status merging (partial hour updates)
- [ ] Auto-detect current hour in attendance UI
- [ ] Timetable integration in attendance marking
- [ ] OD auto-marking in attendance
- [ ] Attendance percentage calculation per course (student view)
- [ ] Attendance reports (by course, date, student)
- [ ] Timetable display with current day/hour highlight
- [ ] Timetable management (admin: 5×7 grid)
- [ ] Exam schedule with chronological display
- [ ] Announcements with post form (teacher/admin)
- [ ] OD application, status, and approval workflow
- [ ] Personal todo list with completion toggle
- [ ] Notifications with unread count badge (30s auto-refresh)
- [ ] Notifications created on: new assignment, announcement, OD decision, marks
- [ ] Calendar with events
- [ ] Analytics with aggregated stats
- [ ] Settings: profile edit + password change
- [ ] Admin: manage users (CRUD)
- [ ] Admin: manage batches (CRUD + student assignment)
- [ ] Admin: manage timetables
- [ ] Admin: attendance reports
- [ ] Error pages (404, 403, 500)
- [ ] Responsive mobile navbar with hamburger menu
- [ ] Tailwind CSS styling matching original Flask app
- [ ] Toast notifications (5s auto-dismiss)
- [ ] Input validation on all forms
- [ ] File upload validation (type, size)
- [ ] Security: helmet, rate limiting, httpOnly cookies

---

## DEFAULT CREDENTIALS

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sriher.edu.in | Admin@123 |
| Teacher | daa@sriher.edu.in | teacher123 |
| Teacher | python@sriher.edu.in | teacher123 |
| Teacher | dbms@sriher.edu.in | teacher123 |
| Student | e0324001@sriher.edu.in | E0324001@24 |
| Student | e0324002@sriher.edu.in | E0324002@24 |
| ... | ... | ... |
| Student | e0324010@sriher.edu.in | E0324010@24 |

---

## QUICK START COMMANDS

```bash
# 1. Clone/create project
mkdir student-dashboard-mern && cd student-dashboard-mern

# 2. Setup server
cd server
npm install
# Ensure MongoDB is running on localhost:27017
npm run seed    # Seed database with default data
npm run dev     # Start Express on port 5000

# 3. Setup client (new terminal)
cd client
npm install
npm run dev     # Start Vite on port 5173

# 4. Open browser
# http://localhost:5173
# Login with admin@sriher.edu.in / Admin@123
```

---

**END OF GUIDE. Follow every step sequentially. Do not skip any model, route, controller, or page. The attendance hourly merging logic is the most critical business rule — implement it exactly as described. Test thoroughly before moving to the next phase.**
