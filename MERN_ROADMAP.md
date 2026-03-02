# MERN Stack Roadmap — Student Dashboard

> **Goal:** Recreate the Flask + MongoDB Student Dashboard as a **MERN** (MongoDB, Express.js, React, Node.js) application with the **exact same features, UI, and behavior**.

---

## Table of Contents

1. [Tech Stack & Architecture](#1-tech-stack--architecture)
2. [Project Structure](#2-project-structure)
3. [Phase 0 — Environment & Scaffold](#3-phase-0--environment--scaffold)
4. [Phase 1 — Database & Models](#4-phase-1--database--models)
5. [Phase 2 — Authentication System](#5-phase-2--authentication-system)
6. [Phase 3 — Core API Routes (Express)](#6-phase-3--core-api-routes-express)
7. [Phase 4 — React Frontend Setup & Layout](#7-phase-4--react-frontend-setup--layout)
8. [Phase 5 — Dashboard Pages (Role-Based)](#8-phase-5--dashboard-pages-role-based)
9. [Phase 6 — Course Management](#9-phase-6--course-management)
10. [Phase 7 — Assignment & Submission System](#10-phase-7--assignment--submission-system)
11. [Phase 8 — Marks / Grades System](#11-phase-8--marks--grades-system)
12. [Phase 9 — Hourly Attendance System](#12-phase-9--hourly-attendance-system)
13. [Phase 10 — Timetable Management](#13-phase-10--timetable-management)
14. [Phase 11 — Exam Schedule](#14-phase-11--exam-schedule)
15. [Phase 12 — Announcements](#15-phase-12--announcements)
16. [Phase 13 — On Duty (OD) Application System](#16-phase-13--on-duty-od-application-system)
17. [Phase 14 — Todo List](#17-phase-14--todo-list)
18. [Phase 15 — Notifications System](#18-phase-15--notifications-system)
19. [Phase 16 — Calendar & Events](#19-phase-16--calendar--events)
20. [Phase 17 — Admin Panel](#20-phase-17--admin-panel)
21. [Phase 18 — Analytics](#21-phase-18--analytics)
22. [Phase 19 — Settings & Profile](#22-phase-19--settings--profile)
23. [Phase 20 — Error Handling & Security Hardening](#23-phase-20--error-handling--security-hardening)
24. [Phase 21 — Testing](#24-phase-21--testing)
25. [Phase 22 — Build, Deploy & Documentation](#25-phase-22--build-deploy--documentation)
26. [AI Prompt Templates](#26-ai-prompt-templates)
27. [Feature-Route Mapping Checklist](#27-feature-route-mapping-checklist)
28. [UI/UX Replication Guide](#28-uiux-replication-guide)

---

## 1. Tech Stack & Architecture

### Backend (API Server)
| Concern | Library / Tool |
|---|---|
| Runtime | Node.js (v18+) |
| Framework | Express.js |
| Database | MongoDB (v7+) with Mongoose ODM |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Session (optional) | express-session + connect-mongo |
| File Uploads | multer |
| Validation | express-validator / Joi |
| Environment | dotenv |
| CORS | cors |
| Logging | morgan |

### Frontend (SPA)
| Concern | Library / Tool |
|---|---|
| Framework | React 18+ (Vite) |
| Routing | react-router-dom v6 |
| HTTP Client | axios |
| State Management | React Context + useReducer (or Zustand) |
| Styling | Tailwind CSS v3 (same as original) |
| Icons | Font Awesome (react-icons or @fortawesome/react-fontawesome) |
| Date Handling | dayjs or date-fns |
| Notifications UI | react-hot-toast or react-toastify |
| Forms | React Hook Form (optional) |

### Architecture Pattern
```
┌─────────────┐       ┌──────────────┐       ┌─────────┐
│  React SPA  │──────▶│  Express API │──────▶│ MongoDB │
│  (Vite)     │◀──────│  (REST JSON) │◀──────│         │
│  Port 5173  │       │  Port 5000   │       │ Port 27017│
└─────────────┘       └──────────────┘       └─────────┘
```

- Frontend makes API calls to Express backend (JSON)
- JWT stored in httpOnly cookies (or localStorage with refresh token)
- File uploads go through Express → saved to `uploads/` (or S3)
- Tailwind CSS compiled identically for the same look

---

## 2. Project Structure

```
student-dashboard-mern/
├── server/                         # Express API
│   ├── config/
│   │   ├── db.js                   # MongoDB/Mongoose connection
│   │   └── config.js               # Environment config
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification middleware
│   │   ├── role.js                 # Role-based access (admin, teacher, student)
│   │   ├── upload.js               # Multer file upload config
│   │   └── errorHandler.js         # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Batch.js
│   │   ├── Attendance.js
│   │   ├── Assignment.js
│   │   ├── Submission.js
│   │   ├── Marks.js
│   │   ├── Timetable.js
│   │   ├── Exam.js
│   │   ├── Announcement.js
│   │   ├── ODApplication.js
│   │   ├── Todo.js
│   │   ├── Notification.js
│   │   └── Event.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── course.routes.js
│   │   ├── assignment.routes.js
│   │   ├── marks.routes.js
│   │   ├── attendance.routes.js
│   │   ├── timetable.routes.js
│   │   ├── exam.routes.js
│   │   ├── announcement.routes.js
│   │   ├── od.routes.js
│   │   ├── todo.routes.js
│   │   ├── notification.routes.js
│   │   ├── event.routes.js
│   │   ├── analytics.routes.js
│   │   ├── settings.routes.js
│   │   └── admin.routes.js
│   ├── controllers/                # (mirrors routes — business logic)
│   │   └── ...
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── helpers.js
│   ├── uploads/                    # Uploaded files
│   ├── seed/
│   │   └── seed.js                 # DB seed script (admin, teachers, students)
│   ├── server.js                   # Entry point
│   ├── package.json
│   └── .env
├── client/                         # React SPA (Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js            # Axios instance with interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Auth state provider
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useFetch.js
│   │   │   └── useNotifications.js
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx       # Responsive nav with dropdowns & badge
│   │   │   │   ├── Sidebar.jsx      # (optional)
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── Layout.jsx       # Wraps all pages (≈ base.html)
│   │   │   ├── common/
│   │   │   │   ├── FlashMessage.jsx # Auto-dismiss toast (5s)
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   ├── RoleRoute.jsx    # Restrict by role
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── ConfirmDialog.jsx
│   │   │   │   └── Card.jsx
│   │   │   └── forms/
│   │   │       ├── LoginForm.jsx
│   │   │       ├── RegisterForm.jsx
│   │   │       └── ...
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── AddCourse.jsx
│   │   │   ├── EditCourse.jsx
│   │   │   ├── Assignments.jsx
│   │   │   ├── AddAssignment.jsx
│   │   │   ├── EditAssignment.jsx
│   │   │   ├── SubmitAssignment.jsx
│   │   │   ├── Marks.jsx
│   │   │   ├── EditMarks.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── MarkAttendance.jsx
│   │   │   ├── AttendanceReport.jsx
│   │   │   ├── ViewAttendanceHistory.jsx
│   │   │   ├── EditAttendance.jsx
│   │   │   ├── Timetables.jsx
│   │   │   ├── ExamSchedule.jsx
│   │   │   ├── AddExam.jsx
│   │   │   ├── Announcements.jsx
│   │   │   ├── ApplyOD.jsx
│   │   │   ├── ODStatus.jsx
│   │   │   ├── ODApprovals.jsx
│   │   │   ├── Todo.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── admin/
│   │   │   │   ├── ManageUsers.jsx
│   │   │   │   ├── ManageBatches.jsx
│   │   │   │   ├── EditBatch.jsx
│   │   │   │   ├── ManageBatchStudents.jsx
│   │   │   │   ├── ManageTimetables.jsx
│   │   │   │   ├── AttendanceReports.jsx
│   │   │   │   ├── AttendanceByCourse.jsx
│   │   │   │   ├── AttendanceByDate.jsx
│   │   │   │   └── AttendanceByStudent.jsx
│   │   │   └── errors/
│   │   │       ├── NotFound.jsx     # 404
│   │   │       ├── Forbidden.jsx    # 403
│   │   │       └── ServerError.jsx  # 500
│   │   ├── utils/
│   │   │   ├── constants.js         # Time slots, roles, allowed extensions
│   │   │   └── helpers.js
│   │   ├── App.jsx                  # Router config
│   │   ├── main.jsx                 # Entry
│   │   └── index.css                # Tailwind directives
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── .env
├── docker-compose.yml               # (optional)
├── README.md
└── .gitignore
```

---

## 3. Phase 0 — Environment & Scaffold

### Steps

1. **Initialize the monorepo (or two folders)**
   ```bash
   mkdir student-dashboard-mern && cd student-dashboard-mern
   mkdir server client
   ```

2. **Server setup**
   ```bash
   cd server
   npm init -y
   npm install express mongoose dotenv cors bcryptjs jsonwebtoken multer morgan express-validator cookie-parser
   npm install -D nodemon
   ```
   - Create `server.js` entry point
   - Create `.env` with:
     ```
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/student_dashboard
     JWT_SECRET=your_jwt_secret_key
     JWT_EXPIRE=7d
     UPLOAD_FOLDER=uploads
     MAX_FILE_SIZE=16777216
     ADMIN_EMAIL=admin@sriher.edu.in
     ALLOWED_EXTENSIONS=pdf,doc,docx,txt,zip,jpg,png
     ```
   - Add `nodemon` script to `package.json`:
     ```json
     "scripts": {
       "dev": "nodemon server.js",
       "start": "node server.js",
       "seed": "node seed/seed.js"
     }
     ```

3. **Client setup**
   ```bash
   cd ../client
   npm create vite@latest . -- --template react
   npm install axios react-router-dom react-icons react-hot-toast dayjs
   npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer
   npx tailwindcss init -p
   ```
   - Configure `tailwind.config.js` content paths
   - Add Tailwind directives to `src/index.css`
   - Configure Vite proxy in `vite.config.js`:
     ```js
     export default defineConfig({
       plugins: [react()],
       server: {
         proxy: {
           '/api': 'http://localhost:5000'
         }
       }
     })
     ```

4. **MongoDB** — Ensure running locally or via Docker:
   ```bash
   docker run -d -p 27017:27017 --name mongo mongo:7
   ```

### AI Prompt (Phase 0)
> *"Scaffold a MERN project with an Express server in `server/` and a React (Vite) client in `client/`. The server should connect to MongoDB via Mongoose, use dotenv for config, cors, morgan for logging, and cookie-parser. The client should use Tailwind CSS v3, react-router-dom v6, axios, and react-hot-toast. Set up Vite proxy to forward `/api` requests to `http://localhost:5000`. Provide the basic `server.js`, `db.js`, `App.jsx`, and `main.jsx` files."*

---

## 4. Phase 1 — Database & Models

### 13 Mongoose Models to Create

Replicate the exact same 13 MongoDB collections from the Flask app.

#### 1. `User.js`
```js
const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, minlength: 2 },
  email:         { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  role:          { type: String, enum: ['admin', 'teacher', 'student', 'pending_teacher'], default: 'student' },
  batch_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
  created_at:    { type: Date, default: Date.now }
});
```

#### 2. `Course.js`
```js
const courseSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  code:        { type: String, unique: true },
  description: String,
  teacher_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  batch_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  credits:     Number,
  department:  String,
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date, default: Date.now }
});
```

#### 3. `Batch.js`
```js
const batchSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  year:       Number,
  department: String,
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  created_at: { type: Date, default: Date.now }
});
```

#### 4. `Attendance.js` *(Critical — hourly tracking)*
```js
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
```

#### 5. `Assignment.js`
```js
const assignmentSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: String,
  course_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  due_date:    Date,
  total_marks: Number,
  created_at:  { type: Date, default: Date.now }
});
```

#### 6. `Submission.js`
```js
const submissionSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student_name:  String, // denormalized
  file_path:     String,
  filename:      String,
  comments:      String,
  submitted_at:  { type: Date, default: Date.now },
  status:        { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
  marks:         { type: Number, default: null },
  feedback:      String,
  graded_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  graded_at:     Date
});
submissionSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });
```

#### 7. `Marks.js`
```js
const marksSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  exam_type:  String, // 'midterm', 'final', 'quiz'
  marks:      { type: Number, required: true },
  max_marks:  Number,
  date:       Date,
  remarks:    String,
  updated_at: { type: Date, default: Date.now }
});
```

#### 8. `Timetable.js`
```js
const hourSlotSchema = new mongoose.Schema({
  hour:    Number,
  subject: String,
  faculty: String,
  room:    String
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  batch_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, unique: true },
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
```

#### 9. `Exam.js`
```js
const examSchema = new mongoose.Schema({
  course_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  exam_date:  Date,
  start_time: String,
  duration:   String,
  venue:      String,
  exam_type:  String,
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});
```

#### 10. `Announcement.js`
```js
const announcementSchema = new mongoose.Schema({
  title:           String,
  content:         { type: String, required: true },
  created_by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by_name: String, // denormalized
  created_at:      { type: Date, default: Date.now },
  target_audience: { type: String, enum: ['all', 'students', 'teachers'], default: 'all' },
  priority:        { type: String, enum: ['high', 'normal', 'low'], default: 'normal' }
});
```

#### 11. `ODApplication.js`
```js
const odApplicationSchema = new mongoose.Schema({
  student_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start_date:  { type: Date, required: true },
  end_date:    { type: Date, required: true },
  reason:      { type: String, required: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  remarks:     String,
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date, default: Date.now }
});
```

#### 12. `Todo.js`
```js
const todoSchema = new mongoose.Schema({
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: String,
  due_date:    Date,
  completed:   { type: Boolean, default: false },
  created_at:  { type: Date, default: Date.now }
});
```

#### 13. `Notification.js`
```js
const notificationSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message:      { type: String, required: true },
  type:         { type: String, enum: ['assignment', 'announcement', 'grade', 'od', 'general'] },
  reference_id: mongoose.Schema.Types.ObjectId,
  read:         { type: Boolean, default: false },
  created_at:   { type: Date, default: Date.now }
});
notificationSchema.index({ user_id: 1, read: 1 });
```

#### 14. `Event.js`
```js
const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: String,
  event_date:  Date,
  location:    String,
  event_type:  String,
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at:  { type: Date, default: Date.now }
});
```

### Seed Script (`seed/seed.js`)
Create a script that seeds:
- 1 admin user (`admin@sriher.edu.in` / `Admin@123`)
- Sample teachers (e.g., `daa@sriher.edu.in` / `teacher123`)
- Sample students (`e0324001@sriher.edu.in` to `e0324010@sriher.edu.in`, password format: `E0324001@24`)
- 1 batch, 2 courses, sample timetable

### AI Prompt (Phase 1)
> *"Create all 14 Mongoose models (User, Course, Batch, Attendance, Assignment, Submission, Marks, Timetable, Exam, Announcement, ODApplication, Todo, Notification, Event) matching the schemas I described. Add compound indexes on Attendance (student_id + course_id + date) and Submission (assignment_id + student_id). Create a seed script that inserts an admin user, 3 teachers, 10 students, 1 batch, and 2 courses with bcrypt-hashed passwords."*

---

## 5. Phase 2 — Authentication System

### Backend API Endpoints

| Method | Endpoint | Body | Response | Auth |
|--------|----------|------|----------|------|
| POST | `/api/auth/login` | `{ email, password }` | `{ user, token }` + httpOnly cookie | Public |
| POST | `/api/auth/register` | `{ name, email, password, is_teacher? }` | `{ user, token }` | Public |
| GET | `/api/auth/logout` | — | `{ message }` (clears cookie) | Any |
| GET | `/api/auth/me` | — | `{ user }` | Any logged-in |

### Business Rules (must replicate exactly)
- Email domain restriction: only `@sriher.edu.in` allowed
- Password minimum 8 characters
- Password hashed with bcryptjs (≈ werkzeug's PBKDF2)
- Default role = `student`; if `is_teacher` flag → `pending_teacher` (admin must approve)
- On login, return user data (id, name, email, role, batch_id)
- JWT stored in httpOnly cookie (or Authorization header)

### Middleware files to create

**`middleware/auth.js`** — Verify JWT, attach `req.user`
```js
// Extract token from cookie or Authorization header
// Verify with jsonwebtoken
// Fetch user from DB, attach to req.user
```

**`middleware/role.js`** — Role gates
```js
const isAdmin = (req, res, next) => { /* check req.user.role === 'admin' */ };
const isTeacher = (req, res, next) => { /* check role in ['teacher', 'admin'] */ };
const isStudent = (req, res, next) => { /* check role === 'student' */ };
```

### React Frontend
- `Login.jsx` — Email + password form, POST to `/api/auth/login`
- `Register.jsx` — Name + email + password + teacher checkbox, POST to `/api/auth/register`
- `AuthContext.jsx` — Stores user state, provides `login()`, `logout()`, `isAuthenticated`
- `ProtectedRoute.jsx` — Redirects to `/login` if not authenticated
- `RoleRoute.jsx` — Redirects to `/dashboard` if role doesn't match

### AI Prompt (Phase 2)
> *"Implement JWT authentication for the Express server: POST /api/auth/login, POST /api/auth/register, GET /api/auth/logout, GET /api/auth/me. Use bcryptjs for hashing, jsonwebtoken for tokens stored in httpOnly cookies. Restrict registration to @sriher.edu.in emails. Create auth middleware that verifies the JWT and attaches the user. Create role middleware (isAdmin, isTeacher). On the React side, create Login.jsx and Register.jsx pages, an AuthContext with login/logout/user state, and ProtectedRoute + RoleRoute wrapper components. The Login and Register pages must use Tailwind CSS and match a clean card-centered design."*

---

## 6. Phase 3 — Core API Routes (Express)

### Route Files & Endpoints

Below is the **complete** API surface. Each route file is mounted under `/api/`.

#### `routes/dashboard.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | Any | Returns role-specific stats (counts of courses, assignments, students, attendance %, recent activities) |

#### `routes/course.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/courses` | Any | Admin: all; Teacher: own; Student: enrolled (by batch) |
| POST | `/api/courses` | Teacher/Admin | Create course (name, code, description, teacher_id, batch_id, credits, department) |
| PUT | `/api/courses/:id` | Teacher/Admin | Edit course |
| DELETE | `/api/courses/:id` | Teacher/Admin | Delete course |

#### `routes/assignment.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/assignments` | Any | List assignments (filtered by role) |
| POST | `/api/assignments` | Teacher/Admin | Create assignment |
| PUT | `/api/assignments/:id` | Teacher/Admin | Edit assignment |
| DELETE | `/api/assignments/:id` | Teacher/Admin | Delete assignment |
| POST | `/api/assignments/:id/submit` | Student | Submit (multipart file upload) |
| GET | `/api/assignments/:id/submissions` | Teacher/Admin | List submissions for an assignment |

#### `routes/marks.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/marks` | Any | Teacher: marks for their courses; Student: own marks |
| GET | `/api/marks/:student_id` | Teacher/Admin | Specific student's marks |
| POST | `/api/marks` | Teacher/Admin | Add marks |
| PUT | `/api/marks/:id` | Teacher/Admin | Edit marks |
| DELETE | `/api/marks/:id` | Teacher/Admin | Delete marks |

#### `routes/attendance.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/attendance` | Any | Student: own; Teacher: courses list |
| GET | `/api/attendance/course/:course_id` | Teacher/Admin | Attendance for a course |
| POST | `/api/attendance/mark/:course_id` | Teacher/Admin | Mark attendance (bulk, with hourly_status merging) |
| GET | `/api/attendance/report/:course_id/:date` | Teacher/Admin | Full-day/hourly report |
| GET | `/api/attendance/history/:student_id` | Any | Student attendance history |
| PUT | `/api/attendance/:id` | Teacher/Admin | Edit single attendance record |

#### `routes/timetable.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/timetables` | Any | View timetable (student: own batch; admin: all) |
| GET | `/api/timetables/:batch_id` | Any | Get specific batch timetable (JSON) |
| POST | `/api/timetables/upload` | Admin | Create/update timetable |
| DELETE | `/api/timetables/:batch_id` | Admin | Delete timetable |

#### `routes/exam.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/exams` | Any | List exams (sorted chronologically) |
| POST | `/api/exams` | Teacher/Admin | Schedule exam |
| PUT | `/api/exams/:id` | Teacher/Admin | Edit exam |
| DELETE | `/api/exams/:id` | Teacher/Admin | Delete exam |

#### `routes/announcement.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/announcements` | Any | List announcements (newest first) |
| POST | `/api/announcements` | Teacher/Admin | Post announcement |
| DELETE | `/api/announcements/:id` | Admin | Delete announcement |

#### `routes/od.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/od/apply` | Student | Apply for OD |
| GET | `/api/od/status` | Student | View own OD applications |
| GET | `/api/od/approvals` | Teacher/Admin | List pending OD applications |
| PUT | `/api/od/approvals/:id` | Teacher/Admin | Approve/reject with remarks |

#### `routes/todo.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/todos` | Any | Get user's todos |
| POST | `/api/todos` | Any | Add todo |
| PUT | `/api/todos/:id` | Any | Toggle complete / edit |
| DELETE | `/api/todos/:id` | Any | Delete todo |

#### `routes/notification.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Any | Get user's notifications (marks as read) |
| GET | `/api/notifications/count` | Any | Get unread count (JSON) |
| PUT | `/api/notifications/:id/read` | Any | Mark single as read |

#### `routes/event.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | Any | List events |
| POST | `/api/events` | Teacher/Admin | Add event |

#### `routes/analytics.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics` | Any | Role-based analytics (counts, averages, aggregations) |

#### `routes/settings.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings` | Any | Get current user profile |
| PUT | `/api/settings` | Any | Update name |
| PUT | `/api/settings/password` | Any | Change password |

#### `routes/admin.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users |
| POST | `/api/admin/users` | Admin | Add user with role |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |
| GET | `/api/admin/batches` | Admin | List batches |
| POST | `/api/admin/batches` | Admin | Create batch |
| PUT | `/api/admin/batches/:id` | Admin | Edit batch |
| DELETE | `/api/admin/batches/:id` | Admin | Delete batch |
| GET | `/api/admin/batches/:id/students` | Admin | Get batch students |
| POST | `/api/admin/batches/:id/students` | Admin | Assign/remove students |
| GET | `/api/admin/timetables` | Admin | Manage timetables page data |
| GET | `/api/admin/attendance/reports` | Admin | Attendance reports overview |
| GET | `/api/admin/attendance/by-course` | Admin | Attendance by course |
| GET | `/api/admin/attendance/by-date` | Admin | Attendance by date |
| GET | `/api/admin/attendance/by-student` | Admin | Attendance by student |

### API Response Envelope
All responses use:
```json
{
  "success": true,
  "data": { ... },
  "message": "optional message"
}
// or on error:
{
  "success": false,
  "error": "Error description"
}
```

### AI Prompt (Phase 3)
> *"Create all Express route files and corresponding controller files for the Student Dashboard API. Mount them in server.js under /api. Use the auth and role middleware for protection. Each controller should interact with the Mongoose models. Implement the attendance marking endpoint with hourly_status merging logic: when marking hours for a student+course+date that already has a record, merge only the selected hours into the existing hourly_status array (don't overwrite unselected hours). Compute overall status as 'present' if any hour is 'P', else 'absent'. Use bulk operations for attendance to handle entire batches efficiently."*

---

## 7. Phase 4 — React Frontend Setup & Layout

### Replicating `base.html` → `Layout.jsx`

The original Flask app uses `base.html` as a shared layout with:
- Responsive navbar with dropdowns
- Role-based menu items
- Notification badge (unread count, auto-refresh 30s)
- User info display
- Flash messages (auto-dismiss 5s)
- Footer

#### `Layout.jsx` structure:
```jsx
<div className="min-h-screen bg-gray-100">
  <Navbar />              {/* Replicates the Tailwind navbar from base.html */}
  <FlashMessage />        {/* Toast notifications */}
  <main className="container mx-auto px-4 py-6">
    <Outlet />            {/* React Router child pages */}
  </main>
  <Footer />
</div>
```

#### `Navbar.jsx` must include:
- Logo/brand link to dashboard
- Menu items conditional on role:
  - **All**: Dashboard, Courses, Assignments, Marks, Attendance, Exam Schedule, Calendar
  - **Student**: OD Status, Todo
  - **Teacher/Admin**: Mark Attendance, Add Course, Add Assignment, OD Approvals, Announcements
  - **Admin**: Manage Users, Manage Batches, Manage Timetables, Attendance Reports
- Notification bell icon with unread count badge
- User name + role display
- Settings link
- Logout button
- Mobile hamburger menu toggle
- Dropdown submenus (Attendance dropdown, Admin dropdown)

#### Notification Badge Auto-Refresh
```jsx
// In Navbar or a custom hook
useEffect(() => {
  const fetchCount = () => {
    axios.get('/api/notifications/count').then(res => setUnreadCount(res.data.data.count));
  };
  fetchCount();
  const interval = setInterval(fetchCount, 30000); // 30 seconds
  return () => clearInterval(interval);
}, []);
```

#### Flash Messages
Replace Flask's `flash()` with `react-hot-toast` or a custom `FlashMessage` component:
```jsx
// After API calls:
toast.success('Course added successfully!');
toast.error('Access denied');
```

### React Router Setup (`App.jsx`)
```jsx
<BrowserRouter>
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/add" element={<RoleRoute roles={['teacher','admin']}><AddCourse /></RoleRoute>} />
          {/* ... all other routes ... */}
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

### Axios Instance (`api/axios.js`)
```js
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,  // send cookies
  headers: { 'Content-Type': 'application/json' }
});

// Response interceptor: on 401 → redirect to /login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) window.location.href = '/login';
    return Promise.reject(err);
  }
);
```

### AI Prompt (Phase 4)
> *"Create the React Layout.jsx component that replicates the original base.html template. It should include a responsive Tailwind CSS navbar with role-based menu items (Dashboard, Courses, Assignments, Marks, Attendance, Exam Schedule, Calendar, Admin dropdown, Notification bell with unread count badge that auto-refreshes every 30 seconds, user name display, and logout). Use react-router-dom v6 Outlet for child pages. Create FlashMessage using react-hot-toast. Set up the full React Router in App.jsx with ProtectedRoute and RoleRoute wrappers. Create the axios instance with credentials and a 401 interceptor."*

---

## 8. Phase 5 — Dashboard Pages (Role-Based)

### `Dashboard.jsx`

Fetch `/api/dashboard` and render different cards based on `user.role`.

#### Admin Dashboard shows:
- Total users count
- Total courses count
- Total students count
- Total teachers count
- Quick links: Manage Users, Manage Batches, Manage Timetables

#### Teacher Dashboard shows:
- Number of courses assigned
- Number of assignments created
- Upcoming assignment deadlines
- Quick links: Mark Attendance, Add Assignment, OD Approvals

#### Student Dashboard shows:
- Number of enrolled courses
- Pending assignments count
- Average attendance %
- Upcoming exam dates
- Recent notifications
- Quick links: View Attendance, View Marks, Todo List

### UI Pattern
- Grid of stat cards (colored top borders, icon, number, label)
- Quick action buttons below
- Recent activity section

### AI Prompt (Phase 5)
> *"Create Dashboard.jsx that fetches /api/dashboard and renders role-based content. For admin: stat cards showing total users, courses, students, teachers with quick links. For teacher: courses count, assignments count, upcoming deadlines. For student: enrolled courses, pending assignments, attendance percentage, upcoming exams, recent notifications. Use Tailwind CSS cards with colored borders and Font Awesome icons. Match the card-based layout from the original Flask dashboard.html."*

---

## 9. Phase 6 — Course Management

### Pages
- `Courses.jsx` — Lists courses (Admin: all, Teacher: own, Student: enrolled by batch)
- `AddCourse.jsx` — Form: name, code, description, teacher (dropdown), batch (dropdown), credits, department
- `EditCourse.jsx` — Same form pre-filled

### Key behavior
- Teacher dropdown populated from `/api/admin/users?role=teacher`
- Batch dropdown from `/api/admin/batches`
- After add/edit → redirect to `/courses` with success toast
- Delete with confirmation dialog

### AI Prompt (Phase 6)
> *"Create Courses.jsx, AddCourse.jsx, and EditCourse.jsx React pages. Courses.jsx fetches /api/courses and displays a Tailwind table/card list with course name, code, teacher, batch, credits. Admin/teacher see Add/Edit/Delete buttons. AddCourse.jsx has a form with dropdowns for teacher and batch (fetched from API). Use react-hot-toast for success/error messages. Match the Tailwind styling from the original courses.html template."*

---

## 10. Phase 7 — Assignment & Submission System

### Pages
- `Assignments.jsx` — List all assignments with status (submitted/pending for students)
- `AddAssignment.jsx` — Title, description, course (dropdown), due date, total marks
- `EditAssignment.jsx` — Pre-filled edit form
- `SubmitAssignment.jsx` — File upload form (PDF, DOC, DOCX, TXT, ZIP)

### File Upload handling
- Frontend: `<input type="file" />` + FormData with axios
- Backend: multer middleware saves to `uploads/` with `studentId_timestamp_originalname`
- Max size: 16MB
- If student re-submits → update existing submission (upsert)

### Key details
- Show due date with overdue indicator
- Students see "Submitted" / "Not Submitted" badge per assignment
- Teachers see submission count per assignment

### AI Prompt (Phase 7)
> *"Create Assignments.jsx, AddAssignment.jsx, EditAssignment.jsx, and SubmitAssignment.jsx. The assignment list shows title, course, due date, and for students whether they submitted. AddAssignment has a course dropdown (teacher's courses). SubmitAssignment.jsx has a file input that sends multipart/form-data to POST /api/assignments/:id/submit. Use multer on the backend with 16MB limit and allowed extensions (pdf, doc, docx, txt, zip). If a student re-submits, update the existing submission. Show overdue badges for past due dates. Use Tailwind cards and tables matching the original UI."*

---

## 11. Phase 8 — Marks / Grades System

### Pages
- `Marks.jsx` — Teacher: table of all students' marks for their courses; Student: own marks only
- `EditMarks.jsx` — Teacher/admin: add/edit marks for a student in a course

### Key behavior
- Marks grouped by course
- Show exam type, marks obtained, max marks, percentage
- Student performance calculation (total/max × 100)

### AI Prompt (Phase 8)
> *"Create Marks.jsx and EditMarks.jsx. Marks page fetches /api/marks and shows a Tailwind table grouped by course. Teachers see all students' marks for their courses with Edit buttons. Students see only their own marks. EditMarks has fields for student (dropdown), course, exam type, marks, max marks. Match the marks.html Tailwind styling."*

---

## 12. Phase 9 — Hourly Attendance System

**This is the most complex feature — replicate exactly.**

### Pages
- `Attendance.jsx` — Student: own attendance with % per course; Teacher: list of courses to mark
- `MarkAttendance.jsx` — The hourly marking grid (7-hour day)
- `AttendanceReport.jsx` — Report for course + date
- `ViewAttendanceHistory.jsx` — Student's full history
- `EditAttendance.jsx` — Edit a single record

### `MarkAttendance.jsx` — Critical Component

1. Teacher selects a course → API fetches students in that course's batch
2. Teacher selects date (default: today)
3. Show 7 hour checkboxes (auto-detect current hour via JavaScript time comparison)
4. Dynamic table: rows = students, columns = selected hours
5. Each cell: radio buttons P / A (default: P)
6. On submit: POST to `/api/attendance/mark/:course_id`

#### Time Slots (must match original exactly)
```js
const TIME_SLOTS = [
  { hour: 1, start: '08:00', end: '08:55', label: 'Hour 1 (8:00-8:55)' },
  { hour: 2, start: '08:55', end: '09:50', label: 'Hour 2 (8:55-9:50)' },
  // Break 9:50-10:10
  { hour: 3, start: '10:10', end: '11:05', label: 'Hour 3 (10:10-11:05)' },
  { hour: 4, start: '11:05', end: '12:00', label: 'Hour 4 (11:05-12:00)' },
  // Lunch 12:00-1:00
  { hour: 5, start: '13:00', end: '13:50', label: 'Hour 5 (1:00-1:50)' },
  { hour: 6, start: '13:50', end: '14:40', label: 'Hour 6 (1:50-2:40)' },
  // Break 2:40-2:55
  { hour: 7, start: '14:55', end: '15:45', label: 'Hour 7 (2:55-3:45)' },
];
```

#### Auto-Hour Detection (JavaScript)
```js
function getCurrentHour() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  for (const slot of TIME_SLOTS) {
    const [sh, sm] = slot.start.split(':').map(Number);
    const [eh, em] = slot.end.split(':').map(Number);
    if (minutes >= sh * 60 + sm && minutes <= eh * 60 + em) return slot.hour;
  }
  return null;
}
```

#### Hourly Status Merging (Backend — critical logic)
```js
// For each student:
const existing = await Attendance.findOne({ student_id, course_id, date });
if (existing) {
  // Merge: only update selected hours
  const merged = [...existing.hourly_status];
  for (const hour of selectedHours) {
    merged[hour - 1] = submittedStatus[student_id][hour]; // 'P' or 'A'
  }
  existing.hourly_status = merged;
  existing.status = merged.some(h => h === 'P') ? 'present' : 'absent';
  await existing.save();
} else {
  // Create new record
  const hourly_status = ['N','N','N','N','N','N','N'];
  for (const hour of selectedHours) {
    hourly_status[hour - 1] = submittedStatus[student_id][hour];
  }
  const status = hourly_status.some(h => h === 'P') ? 'present' : 'absent';
  await Attendance.create({ student_id, course_id, date, status, hourly_status, marked_by, marked_at: new Date() });
}
```

#### Timetable Integration
- When marking attendance, show today's timetable for the course's batch
- Highlight which hours are scheduled for the selected course
- Auto-select those hours

#### OD Integration
- When marking attendance, check for approved OD applications for each student on that date
- If approved OD exists, auto-mark as 'OD' (or 'P' per original behavior)

### AI Prompt (Phase 9)
> *"Create the complete hourly attendance system for the MERN app. This is the most critical feature. Create MarkAttendance.jsx that: (1) lets teacher select a course and date, (2) fetches students in the course's batch, (3) shows 7 hour checkboxes with auto-detection of current hour based on the time schedule [8:00-8:55, 8:55-9:50, 10:10-11:05, 11:05-12:00, 1:00-1:50, 1:50-2:40, 2:55-3:45], (4) dynamically generates a table with student rows and hour columns with P/A radio buttons, (5) submits to POST /api/attendance/mark/:course_id. On the backend, implement hourly_status merging: when a record exists for student+course+date, only update the selected hours in the array and recompute overall status ('present' if any P, else 'absent'). Use bulkWrite for efficiency. Also show the batch timetable and highlight the selected course's hours. Check for approved OD applications and auto-mark OD students. Create Attendance.jsx (student view with percentage per course), AttendanceReport.jsx, ViewAttendanceHistory.jsx, and EditAttendance.jsx."*

---

## 13. Phase 10 — Timetable Management

### Pages
- `Timetables.jsx` — View timetable (student sees own batch; highlight current day/hour)
- `admin/ManageTimetables.jsx` — Admin: select batch, fill 5-day × 7-hour grid, submit

### Timetable Grid UI
- 5 columns (Mon-Fri) × 7 rows (hours)
- Each cell: subject, faculty, room inputs
- When batch is selected, fetch existing timetable to pre-fill
- Show available courses for the batch with their assigned teachers

### AI Prompt (Phase 10)
> *"Create Timetables.jsx that fetches the logged-in student's batch timetable from /api/timetables and displays a 5-day × 7-hour Tailwind grid table highlighting the current day and hour. Create admin/ManageTimetables.jsx with a batch selector dropdown and a dynamic 5×7 input grid (subject, faculty, room per cell) that auto-fills from available courses. POST to /api/timetables/upload. Pre-fill existing timetable data when editing."*

---

## 14. Phase 11 — Exam Schedule

### Pages
- `ExamSchedule.jsx` — List of exams sorted by date
- `AddExam.jsx` — Form: course, date, time, duration, venue, exam type

### AI Prompt (Phase 11)
> *"Create ExamSchedule.jsx and AddExam.jsx. ExamSchedule shows a Tailwind card/table list of exams sorted chronologically with course name, date, time, duration, venue. AddExam has a form with course dropdown, date picker, time input, duration, venue, and exam type. Teacher/admin can add; all can view. Match the original exam_schedule.html styling."*

---

## 15. Phase 12 — Announcements

### Pages
- `Announcements.jsx` — List of announcements (newest first) + post form (teacher/admin only)

### Key behavior
- Toggle post form visibility (teacher/admin)
- Display author name and timestamp
- All users can view

### AI Prompt (Phase 12)
> *"Create Announcements.jsx. Show a chronological list of announcements with author and timestamp in Tailwind cards. For teacher/admin, show a togglable 'Post Announcement' form at the top with title and content fields. Fetch from GET /api/announcements, post with POST /api/announcements."*

---

## 16. Phase 13 — On Duty (OD) Application System

### Pages
- `ApplyOD.jsx` — Student: form with start date, end date, reason
- `ODStatus.jsx` — Student: list of own applications with status badges (pending/approved/rejected)
- `ODApprovals.jsx` — Teacher/Admin: list of pending applications with approve/reject buttons and remarks field

### Key behavior (must replicate)
- Status tracking: pending → approved/rejected
- Remarks from approver
- **Auto-mark OD in attendance**: When marking attendance, check for approved OD for that student on that date → auto-mark as present/OD

### AI Prompt (Phase 13)
> *"Create ApplyOD.jsx (student form: start date, end date, reason), ODStatus.jsx (student's application list with colored status badges), and ODApprovals.jsx (teacher/admin list of pending ODs with approve/reject buttons and remarks input). When attendance is marked, the backend should check if a student has an approved OD for that date and auto-mark them accordingly. Use Tailwind badges: yellow for pending, green for approved, red for rejected."*

---

## 17. Phase 14 — Todo List

### Pages
- `Todo.jsx` — Personal todo list with add form, completion toggle, delete, due date

### Key behavior
- Each user has their own todos (filtered by user_id)
- Separate add form and list view
- Mark complete (strikethrough)
- Due date display
- Delete confirmation

### AI Prompt (Phase 14)
> *"Create Todo.jsx with a personal todo list. Show an add form (title, description, due date) at top and a list below. Each todo has a checkbox to toggle completion (strikethrough styling), due date, and a delete button with confirmation. CRUD via /api/todos endpoints. Filter by logged-in user. Use Tailwind styling matching the original todo.html."*

---

## 18. Phase 15 — Notifications System

### Pages
- `Notifications.jsx` — List of notifications with read/unread styling

### Key behaviors (replicate exactly)
- **Unread count badge** in navbar (auto-refresh every 30 seconds via GET `/api/notifications/count`)
- Visiting notifications page marks all as read
- Notification types: assignment, announcement, grade, od, general
- Timestamp display
- Visual unread indicators (bold/highlighted)

### Notification Creation (backend triggers)
Create notifications when:
- New assignment is posted → notify all students in the course's batch
- New announcement → notify all users (or targeted audience)
- OD approved/rejected → notify the student
- Marks added → notify the student

### AI Prompt (Phase 15)
> *"Create Notifications.jsx that fetches /api/notifications, displays them in a Tailwind list with unread indicators (bold, colored dot), and marks all as read on page visit. In the Navbar, add a bell icon with a badge showing unread count from /api/notifications/count, refreshed every 30 seconds. On the backend, create notification triggers: when a new assignment is created, insert notifications for all students in the course's batch; when an announcement is posted, notify all users; when OD is approved/rejected, notify the student; when marks are added, notify the student."*

---

## 19. Phase 16 — Calendar & Events

### Pages
- `Calendar.jsx` — Academic calendar with upcoming events, event type badges, location

### AI Prompt (Phase 16)
> *"Create Calendar.jsx that fetches /api/events and displays upcoming events in Tailwind cards sorted by date. Show event title, description, date, location, and event type badge. Include quick links to related features (exams, assignments). Teacher/admin can add events via a form."*

---

## 20. Phase 17 — Admin Panel

### Pages
- `admin/ManageUsers.jsx` — List all users, add user form, delete user
- `admin/ManageBatches.jsx` — List batches with stats, create batch
- `admin/EditBatch.jsx` — Edit batch details
- `admin/ManageBatchStudents.jsx` — Assign/remove students from batch
- `admin/ManageTimetables.jsx` — (covered in Phase 10)
- `admin/AttendanceReports.jsx` — Overview/hub page
- `admin/AttendanceByCourse.jsx` — Attendance analytics by course
- `admin/AttendanceByDate.jsx` — Attendance analytics by date
- `admin/AttendanceByStudent.jsx` — Attendance analytics by student

### ManageUsers behavior
- Table: name, email, role, created date
- Add form: name, email, password, role (admin/teacher/student dropdown)
- Delete with confirmation
- Show user count stats

### ManageBatches behavior
- Card grid: batch name, year, department, student count
- Add form: name, year, department
- Edit and delete
- Link to manage batch students

### ManageBatchStudents behavior
- List current students in batch
- Add students (search by email or select from unassigned)
- Remove students from batch
- **Important**: Store `batch_id` as ObjectId (not string) — this caused bugs in original

### AI Prompt (Phase 17)
> *"Create the complete admin panel: ManageUsers.jsx (user table + add form + delete), ManageBatches.jsx (batch cards + create form + edit/delete), EditBatch.jsx, ManageBatchStudents.jsx (assign/remove students), AttendanceReports.jsx (hub), AttendanceByCourse.jsx, AttendanceByDate.jsx, AttendanceByStudent.jsx. All admin-only pages. ManageBatchStudents should let admin search for students and assign them to a batch (storing batch_id as ObjectId). Use Tailwind tables and cards matching the original admin templates."*

---

## 21. Phase 18 — Analytics

### Page
- `Analytics.jsx` — Aggregated stats: user counts, course enrollment, average attendance, recent activity

### Backend: MongoDB aggregation
```js
// Example aggregation for attendance per course
Attendance.aggregate([
  { $group: { _id: '$course_id', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } },
  { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
  { $unwind: '$course' },
  { $project: { course_name: '$course.name', total: 1, present: 1, percentage: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } }
]);
```

### AI Prompt (Phase 18)
> *"Create Analytics.jsx that fetches /api/analytics and displays stat cards and summary tables. Backend /api/analytics endpoint should use MongoDB aggregations for: total user counts by role, course enrollment counts, average attendance percentage per course, recent activity (last 10 assignments, submissions, attendance records). Display with Tailwind stat cards and tables."*

---

## 22. Phase 19 — Settings & Profile

### Page
- `Settings.jsx` — Update name, change password, view email (read-only), view role (read-only)

### AI Prompt (Phase 19)
> *"Create Settings.jsx with two sections: (1) Profile — name input (editable), email (read-only), role (read-only), save button calling PUT /api/settings; (2) Change Password — current password, new password, confirm password, save button calling PUT /api/settings/password. Show success/error toasts. Use Tailwind form styling matching settings.html."*

---

## 23. Phase 20 — Error Handling & Security Hardening

### Error Pages (React)
- `NotFound.jsx` (404) — "Page not found" with link to dashboard
- `Forbidden.jsx` (403) — "Access denied" with link to dashboard
- `ServerError.jsx` (500) — "Something went wrong"

### Backend Error Handler (`middleware/errorHandler.js`)
```js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
};
```

### Security Checklist
- [ ] bcryptjs for password hashing (salt rounds: 12)
- [ ] JWT in httpOnly cookies (SameSite: 'strict', Secure: true in prod)
- [ ] Input validation with express-validator on all POST/PUT routes
- [ ] File upload validation (type, size, secure filename)
- [ ] Rate limiting with express-rate-limit (login: 5/15min, API: 100/15min)
- [ ] Helmet.js for HTTP security headers
- [ ] CORS configured for client origin only
- [ ] MongoDB injection prevention (Mongoose handles most)
- [ ] XSS prevention (React auto-escapes; sanitize API inputs)
- [ ] Environment variables for all secrets

### AI Prompt (Phase 20)
> *"Add error handling and security: create error pages (404, 403, 500) in React. Add a global Express error handler middleware. Install and configure helmet, express-rate-limit (5 attempts per 15 min on login, 100 requests per 15 min on API), and express-validator on all input-accepting routes. Ensure JWT cookies are httpOnly, SameSite strict, and Secure in production. Validate file uploads with multer (16MB max, allowed extensions only)."*

---

## 24. Phase 21 — Testing

### Backend Tests (Jest + Supertest)
```bash
npm install -D jest supertest @faker-js/faker
```

#### Test files:
- `__tests__/auth.test.js` — Login, register, invalid email domain, wrong password
- `__tests__/attendance.test.js` — Mark attendance, hourly merging logic, re-marking subset
- `__tests__/assignment.test.js` — Create, submit, re-submit updates existing
- `__tests__/rbac.test.js` — Student can't access admin routes, teacher can't delete users

#### Key test cases (from original project):
1. Student registration with non-@sriher.edu.in email → rejected
2. Teacher marks hours 1,2 present → marks hour 2 absent → merged hourly_status reflects latest, overall status recalculated
3. Student submits assignment twice → second submit updates existing document (not duplicate)
4. Student cannot access `/api/admin/users` → 403
5. Unauthenticated request → 401

### Frontend Tests (Vitest + React Testing Library)
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

- Test Login form renders and submits
- Test Dashboard renders role-specific content
- Test ProtectedRoute redirects unauthenticated users

### AI Prompt (Phase 21)
> *"Write Jest + Supertest tests for the Express API: auth tests (login success, register with invalid domain, wrong password), attendance merging tests (mark hours 1-2, then re-mark hour 2 differently → verify merge), assignment submission tests (submit twice → update not duplicate), and RBAC tests (student can't access admin routes). Create test fixtures with 3 users (admin, teacher, student), 1 batch, 1 course. Use a separate test database. Also write basic Vitest + React Testing Library tests for Login, Dashboard, and ProtectedRoute."*

---

## 25. Phase 22 — Build, Deploy & Documentation

### Build
```bash
# Client
cd client && npm run build   # outputs to client/dist/

# Server serves static files from client/dist/ in production
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
```

### Docker
```dockerfile
# Dockerfile (multi-stage)
FROM node:18 AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:18
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./
COPY --from=client-build /app/client/dist ./public
EXPOSE 5000
CMD ["node", "server.js"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/student_dashboard
      - JWT_SECRET=your_secret
    depends_on:
      - mongo
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
volumes:
  mongo-data:
```

### Documentation
- Update `README.md` with MERN setup instructions
- API documentation (consider Swagger/OpenAPI)
- Environment variables reference
- Seed data instructions

### AI Prompt (Phase 22)
> *"Create a Dockerfile (multi-stage: build React client, then serve from Express) and docker-compose.yml with MongoDB. Configure Express to serve the React build in production. Create a comprehensive README with setup instructions for local dev and Docker deployment. Add swagger-jsdoc + swagger-ui-express for API documentation on /api/docs."*

---

## 26. AI Prompt Templates

Use these comprehensive prompts when asking an AI to build each part.

### Full Project Generation Prompt
> *"Create a Student Dashboard web application using the MERN stack (MongoDB, Express, React with Vite, Node.js). The app manages users (students, teachers, admins), courses, batches, hourly attendance (7 hours/day with merging logic), assignments with file upload submissions, marks/grades, timetables (5-day × 7-hour grid per batch), exam schedules, announcements, OD (on-duty) applications with approval workflow, personal todo lists, notifications with real-time unread count, calendar events, and analytics.*
>
> *Use Mongoose for MongoDB, bcryptjs + JWT (httpOnly cookies) for auth, multer for file uploads, and express-validator for input validation. The React frontend uses Tailwind CSS v3 (same UI as the original Flask app), react-router-dom v6, axios, and react-hot-toast.*
>
> *Key behaviors to replicate exactly:*
> *1. Registration restricted to @sriher.edu.in emails*
> *2. Hourly attendance: 7-hour day, merging selected hours into existing records, overall status = 'present' if any hour is 'P'*
> *3. Auto-detect current hour in attendance marking UI based on time schedule*
> *4. Timetable integration: show today's schedule when marking attendance*
> *5. OD auto-marking: approved OD students auto-marked when taking attendance*
> *6. Assignment re-submission updates existing record*
> *7. Notification auto-refresh every 30 seconds in navbar badge*
> *8. Role-based navigation menus and page access*
>
> *Create all 14 Mongoose models, all Express routes with controllers, all React pages (25+ pages matching the original templates), seed script, tests, Dockerfile, and docker-compose.yml."*

### Single Feature Prompt Template
> *"For the MERN Student Dashboard, implement the [FEATURE NAME] feature. Backend: Create Express route file at server/routes/[name].routes.js and controller at server/controllers/[name].controller.js. Use the [MODEL] Mongoose model. Protect routes with auth and role middleware. Frontend: Create React page(s) at client/src/pages/[PageNames].jsx. Fetch data from the API endpoints. Style with Tailwind CSS to match the original Flask template [template_name].html. Include proper error handling, loading states, and toast notifications."*

---

## 27. Feature-Route Mapping Checklist

Use this to verify **no feature is missed** during implementation.

| # | Feature | Flask Route(s) | Express API | React Page(s) | Status |
|---|---------|----------------|-------------|---------------|--------|
| 1 | Login | POST /login | POST /api/auth/login | Login.jsx | ☐ |
| 2 | Register | POST /register | POST /api/auth/register | Register.jsx | ☐ |
| 3 | Logout | GET /logout | GET /api/auth/logout | (Navbar button) | ☐ |
| 4 | Dashboard | GET / | GET /api/dashboard | Dashboard.jsx | ☐ |
| 5 | View Courses | GET /courses | GET /api/courses | Courses.jsx | ☐ |
| 6 | Add Course | POST /courses/add | POST /api/courses | AddCourse.jsx | ☐ |
| 7 | Edit Course | POST /course/edit/:id | PUT /api/courses/:id | EditCourse.jsx | ☐ |
| 8 | Delete Course | POST /course/delete/:id | DELETE /api/courses/:id | (Courses.jsx) | ☐ |
| 9 | View Assignments | GET /assignments | GET /api/assignments | Assignments.jsx | ☐ |
| 10 | Add Assignment | POST /add_assignment | POST /api/assignments | AddAssignment.jsx | ☐ |
| 11 | Edit Assignment | POST /assignment/edit/:id | PUT /api/assignments/:id | EditAssignment.jsx | ☐ |
| 12 | Delete Assignment | POST /assignment/delete/:id | DELETE /api/assignments/:id | (Assignments.jsx) | ☐ |
| 13 | Submit Assignment | POST /assignments/:id/submit | POST /api/assignments/:id/submit | SubmitAssignment.jsx | ☐ |
| 14 | View Marks | GET /marks | GET /api/marks | Marks.jsx | ☐ |
| 15 | Edit Marks | POST /marks/edit | POST/PUT /api/marks | EditMarks.jsx | ☐ |
| 16 | View Attendance | GET /attendance | GET /api/attendance | Attendance.jsx | ☐ |
| 17 | Mark Attendance | POST /attendance/mark/:cid | POST /api/attendance/mark/:cid | MarkAttendance.jsx | ☐ |
| 18 | Attendance Report | GET /attendance/report/:cid/:date | GET /api/attendance/report/:cid/:date | AttendanceReport.jsx | ☐ |
| 19 | View Attendance History | GET /attendance/history/:sid | GET /api/attendance/history/:sid | ViewAttendanceHistory.jsx | ☐ |
| 20 | Edit Attendance | POST /attendance/edit/:id | PUT /api/attendance/:id | EditAttendance.jsx | ☐ |
| 21 | View Timetables | GET /timetables | GET /api/timetables | Timetables.jsx | ☐ |
| 22 | Manage Timetables | GET/POST admin/timetables | POST /api/timetables/upload | admin/ManageTimetables.jsx | ☐ |
| 23 | View Exams | GET /exam-schedule | GET /api/exams | ExamSchedule.jsx | ☐ |
| 24 | Add Exam | POST /exam-schedule/add | POST /api/exams | AddExam.jsx | ☐ |
| 25 | Announcements | GET/POST /announcements | GET/POST /api/announcements | Announcements.jsx | ☐ |
| 26 | Apply OD | POST /od/apply | POST /api/od/apply | ApplyOD.jsx | ☐ |
| 27 | OD Status | GET /od/status | GET /api/od/status | ODStatus.jsx | ☐ |
| 28 | OD Approvals | GET/POST /od/approvals | GET/PUT /api/od/approvals | ODApprovals.jsx | ☐ |
| 29 | Todo List | GET/POST /todo | GET/POST/PUT/DELETE /api/todos | Todo.jsx | ☐ |
| 30 | Notifications | GET /notifications | GET /api/notifications | Notifications.jsx | ☐ |
| 31 | Notification Count | GET /notifications/count | GET /api/notifications/count | (Navbar badge) | ☐ |
| 32 | Calendar/Events | GET /calendar | GET /api/events | Calendar.jsx | ☐ |
| 33 | Analytics | GET /analytics | GET /api/analytics | Analytics.jsx | ☐ |
| 34 | Settings | GET/POST /settings | GET/PUT /api/settings | Settings.jsx | ☐ |
| 35 | Change Password | (in settings) | PUT /api/settings/password | (Settings.jsx) | ☐ |
| 36 | Manage Users | GET/POST /admin/users | GET/POST/DELETE /api/admin/users | admin/ManageUsers.jsx | ☐ |
| 37 | Manage Batches | GET/POST /admin/batches | GET/POST/PUT/DELETE /api/admin/batches | admin/ManageBatches.jsx | ☐ |
| 38 | Edit Batch | POST /admin/batch/edit/:id | PUT /api/admin/batches/:id | admin/EditBatch.jsx | ☐ |
| 39 | Manage Batch Students | POST /admin/batch/:id/manage | POST /api/admin/batches/:id/students | admin/ManageBatchStudents.jsx | ☐ |
| 40 | Admin Attendance Reports | GET /admin/attendance/* | GET /api/admin/attendance/* | admin/AttendanceReports.jsx | ☐ |

---

## 28. UI/UX Replication Guide

### Design System (same as original)

#### Colors (Tailwind classes used in original)
- Primary actions: `bg-blue-600 hover:bg-blue-700 text-white`
- Success: `bg-green-500`, badges: `bg-green-100 text-green-800`
- Danger: `bg-red-500`, badges: `bg-red-100 text-red-800`
- Warning: `bg-yellow-500`, badges: `bg-yellow-100 text-yellow-800`
- Info: `bg-indigo-500`
- Background: `bg-gray-100`
- Cards: `bg-white rounded-lg shadow-md p-6`
- Navbar: `bg-gray-800 text-white`

#### Component Patterns

**Stat Cards** (Dashboard):
```jsx
<div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
  <div className="flex items-center">
    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
      <FaUsers className="text-2xl" />
    </div>
    <div className="ml-4">
      <p className="text-gray-500 text-sm">Total Students</p>
      <p className="text-2xl font-bold">{count}</p>
    </div>
  </div>
</div>
```

**Tables**:
```jsx
<div className="overflow-x-auto">
  <table className="min-w-full bg-white rounded-lg shadow">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {items.map(item => (
        <tr key={item._id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Forms**:
```jsx
<div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
  <h2 className="text-2xl font-bold mb-6">Add Course</h2>
  <form onSubmit={handleSubmit}>
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">Course Name</label>
      <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Submit</button>
  </form>
</div>
```

**Flash Messages** (react-hot-toast):
```jsx
toast.success('Course added successfully!', { duration: 5000 });
toast.error('Access denied', { duration: 5000 });
toast('Assignment due tomorrow', { icon: '⚠️', duration: 5000 });
```

**Status Badges**:
```jsx
<span className={`px-2 py-1 text-xs font-semibold rounded-full ${
  status === 'approved' ? 'bg-green-100 text-green-800' :
  status === 'rejected' ? 'bg-red-100 text-red-800' :
  'bg-yellow-100 text-yellow-800'
}`}>{status}</span>
```

**Navbar Dropdown** (mobile & desktop):
```jsx
// Desktop: hover dropdown
// Mobile: hamburger toggle → slide-down menu
// Notification bell with red badge count
```

#### Page-by-Page UI Mapping

| Original Template | React Page | Key UI Elements |
|---|---|---|
| login.html | Login.jsx | Centered card, email/password inputs, submit button, register link |
| register.html | Register.jsx | Centered card, name/email/password inputs, teacher checkbox |
| dashboard.html | Dashboard.jsx | Grid of stat cards, quick action buttons, recent activity |
| courses.html | Courses.jsx | Table or card grid, add button (teacher/admin) |
| add_course.html | AddCourse.jsx | Form card with dropdowns |
| assignments.html | Assignments.jsx | Card list with due dates and status badges |
| submit_assignment.html | SubmitAssignment.jsx | File upload form with drag-drop area |
| marks.html | Marks.jsx | Table grouped by course |
| attendance.html | Attendance.jsx | Student: % per course; Teacher: course list |
| mark_attendance.html | MarkAttendance.jsx | Hour checkboxes + dynamic student×hour grid |
| timetables.html | Timetables.jsx | 5×7 grid table highlighted for today |
| exam_schedule.html | ExamSchedule.jsx | Chronological card list |
| announcements.html | Announcements.jsx | Post form + card list |
| apply_od.html | ApplyOD.jsx | Date range + reason form |
| od_status.html | ODStatus.jsx | Application list with badges |
| od_approvals.html | ODApprovals.jsx | Pending list with approve/reject |
| todo.html | Todo.jsx | Add form + checklist |
| notifications.html | Notifications.jsx | Notification list with read/unread |
| calendar.html | Calendar.jsx | Event cards sorted by date |
| analytics.html | Analytics.jsx | Stat cards + summary tables |
| settings.html | Settings.jsx | Profile form + password change form |
| admin/manage_users.html | admin/ManageUsers.jsx | User table + add form |
| admin/manage_batches.html | admin/ManageBatches.jsx | Batch cards + create form |
| base.html | Layout.jsx + Navbar.jsx | Responsive navbar, flash messages, footer |

---

## Development Order Summary

| Phase | What | Est. Time | Dependencies |
|-------|------|-----------|-------------|
| 0 | Scaffold & Environment | 1-2 hrs | None |
| 1 | Models & Seed | 2-3 hrs | Phase 0 |
| 2 | Authentication | 3-4 hrs | Phase 1 |
| 3 | All API Routes | 6-8 hrs | Phase 2 |
| 4 | React Layout & Routing | 3-4 hrs | Phase 2 |
| 5 | Dashboard | 2-3 hrs | Phase 3, 4 |
| 6 | Courses | 2-3 hrs | Phase 3, 4 |
| 7 | Assignments + Upload | 4-5 hrs | Phase 6 |
| 8 | Marks | 2-3 hrs | Phase 6 |
| 9 | Attendance (hourly) | 6-8 hrs | Phase 6 (most complex) |
| 10 | Timetables | 3-4 hrs | Phase 6 |
| 11 | Exam Schedule | 1-2 hrs | Phase 6 |
| 12 | Announcements | 1-2 hrs | Phase 4 |
| 13 | OD System | 3-4 hrs | Phase 9 |
| 14 | Todo | 1-2 hrs | Phase 4 |
| 15 | Notifications | 2-3 hrs | Phase 4 |
| 16 | Calendar | 1-2 hrs | Phase 4 |
| 17 | Admin Panel | 4-5 hrs | Phase 3, 4 |
| 18 | Analytics | 2-3 hrs | Phase 3 |
| 19 | Settings | 1-2 hrs | Phase 2 |
| 20 | Error Handling & Security | 2-3 hrs | All |
| 21 | Testing | 4-6 hrs | All |
| 22 | Build & Deploy | 2-3 hrs | All |
| **TOTAL** | | **~55-75 hrs** | |

---

## Default Credentials (same as original)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sriher.edu.in | Admin@123 |
| Teacher | daa@sriher.edu.in | teacher123 |
| Teacher | python@sriher.edu.in | teacher123 |
| Student | e0324001@sriher.edu.in | E0324001@24 |
| Student | e0324002@sriher.edu.in | E0324002@24 |

---

## Quick Start Commands

```bash
# Clone and setup
git clone <repo-url> && cd student-dashboard-mern

# Server
cd server
cp .env.example .env          # Configure MongoDB URI, JWT secret
npm install
npm run seed                   # Seed database
npm run dev                    # Start Express on :5000

# Client (new terminal)
cd client
npm install
npm run dev                    # Start Vite on :5173

# Docker (alternative)
docker-compose up --build      # Runs everything on :5000
```

---

**This roadmap covers every feature, route, model, UI component, and business rule from the original Flask Student Dashboard. No feature has been omitted. Use the AI prompts at each phase to generate the code, and the checklist in Section 27 to verify completeness.**
