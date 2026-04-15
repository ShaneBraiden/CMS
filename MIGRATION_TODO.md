# MongoDB to PostgreSQL Migration - Todo List

**Total Tasks**: 95+ items  
**Priority**: Critical  
**Timeline**: 13 days (2 weeks)  

---

## PHASE 0: PREPARATION & SETUP (Check: ✓ = Done)

### Pre-Migration
- [ ] **P0.1** - Create full backup of MongoDB database
- [ ] **P0.2** - Verify PostgreSQL installation (version 14+)
- [ ] **P0.3** - Create PostgreSQL database: `student_dashboard`
- [ ] **P0.4** - Create PostgreSQL user and set permissions
- [ ] **P0.5** - Document all MongoDB collections stats (count, size)

### Environment & Dependencies
- [ ] **P0.6** - Update `server/package.json` - Add Sequelize ORM
- [ ] **P0.7** - Update `server/package.json` - Add pg (PostgreSQL driver)
- [ ] **P0.8** - Update `server/package.json` - Add pg-hstore (type support)
- [ ] **P0.9** - Run `npm install` in server folder
- [ ] **P0.10** - Create `.env.example` with new DB configuration variables

### Configuration Files
- [ ] **P0.11** - Update `server/config/config.js` - Replace MONGO_URI with PostgreSQL credentials
- [ ] **P0.12** - Create `server/config/sequelize.js` - Database connection pooling
- [ ] **P0.13** - Create `server/migrations/` folder structure
- [ ] **P0.14** - Update `.env` file with PostgreSQL connection details

---

## PHASE 1: MODEL MIGRATION (Convert Mongoose → Sequelize)

### User Model
- [ ] **M1.1** - Create `server/models/User.js` (Sequelize version)
  - Fields: id (UUID), name, email, password_hash, role, batch_id, created_at
  - Constraints: email UNIQUE, role ENUM, NOT NULL validations
  - Methods: matchPassword (bcrypt comparison)
  - Pre-hooks: password hashing on save
- [ ] **M1.2** - Add associations for Batch (belongsTo)
- [ ] **M1.3** - Add associations for courses taught (many-to-many through CourseTeacher)
- [ ] **M1.4** - Test User model CRUD operations

### Batch Model
- [ ] **M2.1** - Create `server/models/Batch.js` (Sequelize version)
  - Fields: id, name, year, department, teacher_id, created_at
  - Constraints: NOT NULL for name
- [ ] **M2.2** - Add associations for User (belongsTo teacher)
- [ ] **M2.3** - Add associations for Courses (many-to-many)
- [ ] **M2.4** - Add associations for Timetable (hasOne)
- [ ] **M2.5** - Test Batch model operations

### Course Model
- [ ] **M3.1** - Create `server/models/Course.js` (Sequelize version)
  - Fields: id, name, code, description, credits, department, semester, year, regulation, created_at, updated_at
  - Constraints: code UNIQUE (nullable), NOT NULL for name
- [ ] **M3.2** - Create `server/models/CourseBatchTeacher.js` (junction table)
  - Fields: id, course_id, batch_id, teacher_id
  - Constraints: PRIMARY KEY (course_id, batch_id, teacher_id)
- [ ] **M3.3** - Add many-to-many associations through junction table
- [ ] **M3.4** - Test Course model with batch/teacher relationships
- [ ] **M3.5** - Handle nested batches array serialization in responses

### Assignment Model
- [ ] **M4.1** - Create `server/models/Assignment.js` (Sequelize version)
  - Fields: id, title, description, course_id, teacher_id, due_date, total_marks, created_at
  - Constraints: title NOT NULL, foreign keys
- [ ] **M4.2** - Add associations for Course, User (teacher), Submission
- [ ] **M4.3** - Test Assignment model

### Submission Model
- [ ] **M5.1** - Create `server/models/Submission.js` (Sequelize version)
  - Fields: id, assignment_id, student_id, student_name, file_path, filename, comments, submitted_at, status, marks, feedback, graded_by, graded_at
  - Constraints: UNIQUE (assignment_id, student_id), status ENUM
- [ ] **M5.2** - Add associations for Assignment, Student (User), GradedBy (User)
- [ ] **M5.3** - Test Submission model

### Attendance Model
- [ ] **M6.1** - Create `server/models/Attendance.js` (Sequelize version)
  - Fields: id, student_id, course_id, date, status, hourly_status (JSON), marked_by, marked_at, updated_at
  - Constraints: status ENUM, UNIQUE (student_id, course_id, date)
- [ ] **M6.2** - Handle hourly_status array as JSON column in PostgreSQL
- [ ] **M6.3** - Add associations and test

### Marks Model
- [ ] **M7.1** - Create `server/models/Marks.js` (Sequelize version)
  - Fields: id, student_id, course_id, exam_type, marks, max_marks, date, remarks, updated_at
  - Constraints: marks validation, foreign keys
- [ ] **M7.2** - Add associations for Student, Course
- [ ] **M7.3** - Test Marks model

### Exam Model
- [ ] **M8.1** - Create `server/models/Exam.js` (Sequelize version)
  - Fields: id, course_id, exam_date, start_time, duration, venue, exam_type, created_by, created_at
  - Constraints: course_id foreign key, created_by foreign key
- [ ] **M8.2** - Add associations
- [ ] **M8.3** - Test Exam model

### Timetable Model
- [ ] **M9.1** - Create `server/models/Timetable.js` (Sequelize version)
  - Fields: id, batch_id, created_at, updated_at
  - Constraints: batch_id UNIQUE, foreign key
- [ ] **M9.2** - Create `server/models/TimetableSlot.js`
  - Fields: id, timetable_id, day, hour, subject, faculty, room
  - Constraints: foreign key to Timetable
- [ ] **M9.3** - Handle timetable structure transformation (Monday/Tuesday → Slots)
- [ ] **M9.4** - Add serialization method to return proper format
- [ ] **M9.5** - Test Timetable with slots

### Announcement Model
- [ ] **M10.1** - Create `server/models/Announcement.js` (Sequelize version)
  - Fields: id, title, content, created_by, created_by_name, created_at, target_audience, priority
  - Constraints: content NOT NULL, enums for target_audience and priority
- [ ] **M10.2** - Add associations for creator (User)
- [ ] **M10.3** - Test Announcement model

### Todo Model
- [ ] **M11.1** - Create `server/models/Todo.js` (Sequelize version)
  - Fields: id, user_id, title, description, due_date, completed, created_at
  - Constraints: user_id NOT NULL, title NOT NULL
- [ ] **M11.2** - Add associations
- [ ] **M11.3** - Test Todo model

### Notification Model
- [ ] **M12.1** - Create `server/models/Notification.js` (Sequelize version)
  - Fields: id, user_id, message, type, reference_id, read, created_at
  - Constraints: user_id NOT NULL, type ENUM
- [ ] **M12.2** - Add associations and indexes for (user_id, read)
- [ ] **M12.3** - Test Notification model

### Event Model
- [ ] **M13.1** - Create `server/models/Event.js` (Sequelize version)
  - Fields: id, title, description, event_date, location, event_type, created_by, created_at
  - Constraints: title NOT NULL, created_by foreign key
- [ ] **M13.2** - Add associations
- [ ] **M13.3** - Test Event model

### ODApplication Model
- [ ] **M14.1** - Create `server/models/ODApplication.js` (Sequelize version)
  - Fields: id, student_id, start_date, end_date, reason, status, approved_by, remarks, created_at, updated_at
  - Constraints: status ENUM, dates NOT NULL, student_id NOT NULL
- [ ] **M14.2** - Add associations for student and approver
- [ ] **M14.3** - Test ODApplication model

### Database Initialization
- [ ] **M15.1** - Create `server/models/index.js` to export all models
- [ ] **M15.2** - Set up associations in a central location
- [ ] **M15.3** - Test database sync/initialization

---

## PHASE 2: CONTROLLER UPDATES (Replace Mongoose queries with Sequelize)

### Auth Controller (`server/controllers/auth.controller.js`)
- [ ] **C1.1** - Update `login` - Replace User.findOne with Sequelize
- [ ] **C1.2** - Update `register` - Replace User.create with Sequelize
- [ ] **C1.3** - Update `logout` - Verify cookie handling works
- [ ] **C1.4** - Test all auth endpoints
- [ ] **C1.5** - Verify JWT token generation and validation

### Course Controller (`server/controllers/course.controller.js`)
- [ ] **C2.1** - Update `getCourses` - Replace populate with include
- [ ] **C2.2** - Update `createCourse` - Handle CourseBatchTeacher junction table
- [ ] **C2.3** - Update `updateCourse` - Handle nested batch updates
- [ ] **C2.4** - Update `deleteCourse` - Add cascade delete verification
- [ ] **C2.5** - Update all course-related queries
- [ ] **C2.6** - Test role-based filtering (student, teacher, admin)
- [ ] **C2.7** - Test response format maintains compatibility

### Assignment Controller (`server/controllers/assignment.controller.js`)
- [ ] **C3.1** - Update `getAssignments` - Replace find with findAll
- [ ] **C3.2** - Update `createAssignment` - Replace create
- [ ] **C3.3** - Update `updateAssignment` - Replace findByIdAndUpdate
- [ ] **C3.4** - Update `deleteAssignment` - Add cascade checks
- [ ] **C3.5** - Test all assignment operations

### Submission Controller (if separate)
- [ ] **C4.1** - Update `getSubmissions` - Sequelize queries
- [ ] **C4.2** - Update `createSubmission` - Handle file uploads
- [ ] **C4.3** - Update `gradeSubmission` - Atomic transaction (update submission + create notification)
- [ ] **C4.4** - Test submission workflow

### Attendance Controller (`server/controllers/attendance.controller.js`)
- [ ] **C5.1** - Update `getAttendance` - Handle date queries, hourly_status JSON
- [ ] **C5.2** - Update `markAttendance` - Single attendance record
- [ ] **C5.3** - Update `markHourlyAttendance` - JSON array updates
- [ ] **C5.4** - Handle unique constraint on (student_id, course_id, date)
- [ ] **C5.5** - Test quarterly/yearly report generation

### Marks Controller (`server/controllers/marks.controller.js`)
- [ ] **C6.1** - Update `getMarks` - Role-based filtering
- [ ] **C6.2** - Update `createMarks` - Replace create
- [ ] **C6.3** - Update `updateMarks` - Handle bulk updates
- [ ] **C6.4** - Test report generation queries

### Timetable Controller (`server/controllers/timetable.controller.js`)
- [ ] **C7.1** - Update `getTimetable` - Include TimetableSlot with include
- [ ] **C7.2** - Update `createTimetable` - Convert day structure to slots + insert
- [ ] **C7.3** - Update `updateTimetable` - Handle slot updates
- [ ] **C7.4** - Implement proper serialization to return day-based structure
- [ ] **C7.5** - Test timetable response format matches MongoDB format

### Exam Controller (`server/controllers/exam.controller.js`)
- [ ] **C8.1** - Update all exam queries to Sequelize
- [ ] **C8.2** - Test date queries and sorting
- [ ] **C8.3** - Verify role-based filtering

### Announcement Controller (`server/controllers/announcement.controller.js`)
- [ ] **C9.1** - Update `getAnnouncements` - Filter by target_audience
- [ ] **C9.2** - Update `createAnnouncement` - Replace create
- [ ] **C9.3** - Verify priority filtering
- [ ] **C9.4** - Test announcement retrieval

### Todo Controller (`server/controllers/todo.controller.js`)
- [ ] **C10.1** - Update `getTodos` - User-specific queries
- [ ] **C10.2** - Update `createTodo`, `updateTodo`, `deleteTodo`
- [ ] **C10.3** - Test todo CRUD operations

### Notification Controller (`server/controllers/notification.controller.js`)
- [ ] **C11.1** - Update `getNotifications` - Index on (user_id, read)
- [ ] **C11.2** - Update `markAsRead` - Bulk update
- [ ] **C11.3** - Test notification queries

### Event Controller (`server/controllers/event.controller.js`)
- [ ] **C12.1** - Update all event queries
- [ ] **C12.2** - Test event creation and filtering

### OD Application Controller (`server/controllers/od.controller.js`)
- [ ] **C13.1** - Update `createODApplication` - Replace create
- [ ] **C13.2** - Update `approveOD` - Atomic transaction
- [ ] **C13.3** - Test OD status updates

### Admin Controller (`server/controllers/admin.controller.js`)
- [ ] **C14.1** - Update user management queries
- [ ] **C14.2** - Update batch management queries
- [ ] **C14.3** - Test admin operations

### Dashboard Controller (`server/controllers/dashboard.controller.js`)
- [ ] **C15.1** - Update dashboard stats queries
- [ ] **C15.2** - Test role-based dashboard data

### Analytics Controller (`server/controllers/analytics.controller.js`)
- [ ] **C16.1** - Update complex analytics queries
- [ ] **C16.2** - Test trend analysis and reports

### Settings Controller (`server/controllers/settings.controller.js`)
- [ ] **C17.1** - Update any settings-related queries

---

## PHASE 3: ROUTE VERIFICATION & DATABASE CONNECTION

### Route Files (18 files - verify, not update)
- [ ] **R1.1** - Verify `auth.routes.js` - No changes needed
- [ ] **R1.2** - Verify `course.routes.js` - No changes needed
- [ ] **R1.3** - Verify `assignment.routes.js` - No changes needed
- [ ] **R1.4** - Verify `attendance.routes.js` - No changes needed
- [ ] **R1.5** - Verify `marks.routes.js` - No changes needed
- [ ] **R1.6** - Verify `timetable.routes.js` - No changes needed
- [ ] **R1.7** - Verify `exam.routes.js` - No changes needed
- [ ] **R1.8** - Verify `announcement.routes.js` - No changes needed
- [ ] **R1.9** - Verify `od.routes.js` - No changes needed
- [ ] **R1.10** - Verify `todo.routes.js` - No changes needed
- [ ] **R1.11** - Verify `notification.routes.js` - No changes needed
- [ ] **R1.12** - Verify `event.routes.js` - No changes needed
- [ ] **R1.13** - Verify `analytics.routes.js` - No changes needed
- [ ] **R1.14** - Verify `settings.routes.js` - No changes needed
- [ ] **R1.15** - Verify `admin.routes.js` - No changes needed
- [ ] **R1.16** - Verify `dashboard.routes.js` - No changes needed

### Database Connection
- [ ] **R2.1** - Rewrite `server/config/db.js` for Sequelize/PostgreSQL
- [ ] **R2.2** - Implement connection pooling
- [ ] **R2.3** - Add error handling for DB connection
- [ ] **R2.4** - Test database connection in server startup

### Server.js Updates
- [ ] **R3.1** - Update `server/server.js` - Replace `connectDB()` call
- [ ] **R3.2** - Add Sequelize sync in server startup
- [ ] **R3.3** - Test server starts without errors

---

## PHASE 4: SEED & DATA MIGRATION

### Seed Script
- [ ] **S1.1** - Rewrite `server/seed/seed.js` for PostgreSQL
  - Replace mongoose.connect with Sequelize connection
  - Replace deleteMany with truncate/destroy
  - Replace create with Sequelize create
  - Handle relationships properly (batch_id references)
  - Create sample users (admin, teachers, students)
  - Create batches and courses
  - Create course-batch-teacher associations
  - Create attendance records
  - Create marks, assignments, submissions
  - Create timetable with slots
  - Create announcements, todos, notifications

- [ ] **S1.2** - Create test data for each model
- [ ] **S1.3** - Handle foreign key constraints in insert order
- [ ] **S1.4** - Add transaction support for seed operations
- [ ] **S1.5** - Test seed script runs without errors
- [ ] **S1.6** - Verify seed data inserted correctly
- [ ] **S1.7** - Test data relationships are intact

### Data Migration (if migrating from existing MongoDB)
- [ ] **S2.1** - Create migration script from MongoDB to PostgreSQL
- [ ] **S2.2** - Export MongoDB data
- [ ] **S2.3** - Transform ObjectIds to integers/UUIDs
- [ ] **S2.4** - Handle nested documents (Timetable.timetable, Course.batches)
- [ ] **S2.5** - Insert migrated data into PostgreSQL
- [ ] **S2.6** - Verify data integrity after migration
- [ ] **S2.7** - Compare record counts and checksums

---

## PHASE 5: API RESPONSE FORMAT & COMPATIBILITY

### Response Format Verification
- [ ] **F1.1** - Verify all responses use correct success/error format
- [ ] **F1.2** - Ensure all ID fields use `id` not `_id`
- [ ] **F1.3** - Test date formatting (ISO 8601)
- [ ] **F1.4** - Test enum values remain unchanged

### Test Each Endpoint (Complete Workflow)
- [ ] **F2.1** - POST /api/auth/register → verify token response
- [ ] **F2.2** - POST /api/auth/login → verify token response
- [ ] **F2.3** - GET /api/courses → test filtering, pagination
- [ ] **F2.4** - POST /api/courses → test creation with batch-teacher relationships
- [ ] **F2.5** - GET /api/assignments → test course filtering
- [ ] **F2.6** - POST /api/assignments → test creation
- [ ] **F2.7** - POST /api/submissions → test file upload integration
- [ ] **F2.8** - GET /api/attendance → test date range queries
- [ ] **F2.9** - POST /api/attendance → test duplicate constraint handling
- [ ] **F2.10** - GET /api/marks → test student/teacher filtering
- [ ] **F2.11** - GET /api/exams → test course-based filtering
- [ ] **F2.12** - GET /api/timetable/:id → test slot structure format
- [ ] **F2.13** - POST /api/timetable → test slot creation
- [ ] **F2.14** - GET /api/announcements → test target_audience filtering
- [ ] **F2.15** - GET /api/todos → test user-specific queries
- [ ] **F2.16** - GET /api/notifications → test read/unread filtering
- [ ] **F2.17** - GET /api/events → test event listing
- [ ] **F2.18** - POST /api/od → test OD application creation
- [ ] **F2.19** - GET /api/admin/* → test admin operations
- [ ] **F2.20** - GET /api/dashboard → test stats generation

---

## PHASE 6: MIDDLEWARE & UTILITIES

### Middleware Updates
- [ ] **MW1.1** - Update `server/middleware/auth.js` - User.findById to Sequelize
- [ ] **MW1.2** - Update `server/middleware/role.js` - Verify role checking
- [ ] **MW1.3** - Verify `server/middleware/upload.js` - No DB changes needed
- [ ] **MW1.4** - Verify `server/middleware/errorHandler.js` - Works with Sequelize errors

### Utilities
- [ ] **U1.1** - Verify `server/utils/generateToken.js` - Works unchanged
- [ ] **U1.2** - Update `server/utils/helpers.js` if it uses database
- [ ] **U1.3** - Add PostgreSQL-specific helpers if needed

---

## PHASE 7: CLIENT VERIFICATION (No Changes Expected)

### Frontend Testing
- [ ] **CL1.1** - Verify client connects to updated backend
- [ ] **CL1.2** - Test login flow
- [ ] **CL1.3** - Test course listing and filtering
- [ ] **CL1.4** - Test assignment view/submission
- [ ] **CL1.5** - Test attendance marking
- [ ] **CL1.6** - Test marks view
- [ ] **CL1.7** - Test timetable view
- [ ] **CL1.8** - Test announcements
- [ ] **CL1.9** - Test todo management
- [ ] **CL1.10** - Test OD applications
- [ ] **CL1.11** - Test admin dashboard
- [ ] **CL1.12** - Verify no 404s or API errors

---

## PHASE 8: TESTING & VALIDATION

### Unit Tests (for critical paths)
- [ ] **T1.1** - Test User model validation
- [ ] **T1.2** - Test password hashing/comparison
- [ ] **T1.3** - Test Batch relationships
- [ ] **T1.4** - Test Course-Batch-Teacher relationships
- [ ] **T1.5** - Test Attendance unique constraint
- [ ] **T1.6** - Test Submission unique constraint
- [ ] **T1.7** - Test Timetable slot structure

### Integration Tests
- [ ] **T2.1** - Test full authentication flow
- [ ] **T2.2** - Test assignment creation → submission → grading workflow
- [ ] **T2.3** - Test attendance marking → report generation
- [ ] **T2.4** - Test OD application → approval workflow
- [ ] **T2.5** - Test notification creation and retrieval
- [ ] **T2.6** - Test course enrollment and data retrieval

### Data Validation Tests
- [ ] **T3.1** - Verify no duplicate emails
- [ ] **T3.2** - Verify foreign key constraints enforced
- [ ] **T3.3** - Verify status enum constraints
- [ ] **T3.4** - Verify date constraints
- [ ] **T3.5** - Verify role enum constraints

### Performance Tests
- [ ] **T4.1** - Test course listing performance (1k+ records)
- [ ] **T4.2** - Test attendance query performance
- [ ] **T4.3** - Test marks aggregation queries
- [ ] **T4.4** - Test notification filtering performance
- [ ] **T4.5** - Compare response times vs. MongoDB baseline

### Stress Tests
- [ ] **T5.1** - Test concurrent user login
- [ ] **T5.2** - Test bulk attendance marking
- [ ] **T5.3** - Test multiple submissions submission
- [ ] **T5.4** - Monitor connection pool usage

---

## PHASE 9: DOCUMENTATION & CLEANUP

### Documentation
- [ ] **D1.1** - Update MIGRATION_PRD.md with completion notes
- [ ] **D1.2** - Create DATABASE_SCHEMA.md with PostgreSQL schema
- [ ] **D1.3** - Create SEQUELIZE_MODELS.md documenting model structure
- [ ] **D1.4** - Update README.md with PostgreSQL setup instructions
- [ ] **D1.5** - Document any breaking changes (if any)
- [ ] **D1.6** - Create troubleshooting guide for common issues

### Code Cleanup
- [ ] **D2.1** - Remove all unused mongoose references
- [ ] **D2.2** - Clean up any commented-out MongoDB code
- [ ] **D2.3** - Review and lint all updated files
- [ ] **D2.4** - Ensure consistent code style (Sequelize patterns)

### Environment Setup
- [ ] **D3.1** - Update `.env.example` with PostgreSQL variables
- [ ] **D3.2** - Document database setup process
- [ ] **D3.3** - Create setup script for new developers

---

## PHASE 10: DEPLOYMENT & MONITORING

### Pre-Deployment
- [ ] **DP1.1** - Final full backup of MongoDB
- [ ] **DP1.2** - Create PostgreSQL backup strategy
- [ ] **DP1.3** - Test rollback procedures
- [ ] **DP1.4** - Prepare maintenance window announcement

### Deployment
- [ ] **DP2.1** - Deploy updated backend code
- [ ] **DP2.2** - Initialize PostgreSQL database
- [ ] **DP2.3** - Run seed script (or migrate data)
- [ ] **DP2.4** - Verify all endpoints responding
- [ ] **DP2.5** - Monitor error logs for issues

### Post-Deployment
- [ ] **DP3.1** - Run smoke tests on all critical endpoints
- [ ] **DP3.2** - Verify user login functionality
- [ ] **DP3.3** - Check error rates and response times
- [ ] **DP3.4** - Monitor for 24 hours
- [ ] **DP3.5** - Compare performance metrics
- [ ] **DP3.6** - Document any issues and resolutions

### Cutover
- [ ] **DP4.1** - Deactivate MongoDB connection after verification period
- [ ] **DP4.2** - Archive MongoDB data for 30-day safety window
- [ ] **DP4.3** - Update documentation
- [ ] **DP4.4** - Notify team of completion

---

## ADDITIONAL ITEMS

### Code Review
- [ ] **CR1** - All models reviewed for correctness
- [ ] **CR2** - All controllers reviewed for Sequelize patterns
- [ ] **CR3** - All routes verified for compatibility
- [ ] **CR4** - Database schema reviewed by DB admin
- [ ] **CR5** - Security review (SQL injection, etc.)

### Optional Enhancements (Post-Migration)
- [ ] **OPT1** - Add database migrations framework
- [ ] **OPT2** - Implement query optimization
- [ ] **OPT3** - Add database monitoring/alerting
- [ ] **OPT4** - Set up automated backups
- [ ] **OPT5** - Create data export tools

### Troubleshooting Log
- [ ] **LOG1** - Document any issues encountered
- [ ] **LOG2** - Document resolutions
- [ ] **LOG3** - Update troubleshooting guide

---

## SUMMARY BY PHASE

| Phase | Tasks | Owner | Duration | Status |
|-------|-------|-------|----------|--------|
| 0: Preparation | 14 | DevOps/Backend | 2 days | Not Started |
| 1: Models | 82 | Backend | 3 days | Not Started |
| 2: Controllers | 59 | Backend | 3 days | Not Started |
| 3: Routes & DB | 19 | Backend | 1 day | Not Started |
| 4: Seed & Migration | 18 | Backend | 1 day | Not Started |
| 5: Testing & Validation | 28 | QA/Backend | 2 days | Not Started |
| 6: Middleware & Utils | 6 | Backend | 0.5 days | Not Started |
| 7: Client Verification | 12 | QA/Frontend | 1 day | Not Started |
| 8: Documentation | 12 | Backend/Tech Writer | 1 day | Not Started |
| 9: Deployment | 15 | DevOps | 2 days | Not Started |

**Total Estimated Time**: 13 days (2-3 weeks with buffer)  
**Total Estimated Tasks**: 95+ items

---

## TRACKING NOTES

### In Progress
(Update as you work through phases)

### Completed
(Mark items done here)

### Blocked
(Note any blockers and how to resolve)

### Risk Log
(Document any risks that emerge)

---

**Last Updated**: March 23, 2026  
**Maintained By**: [Your Name]  
**Next Review**: After Phase 1 Completion
