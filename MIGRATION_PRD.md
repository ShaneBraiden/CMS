# Product Requirements Document (PRD)
## MongoDB to PostgreSQL Migration

**Project**: College Management System (CMS)  
**Date**: March 2026  
**Objective**: Migrate from MongoDB (NoSQL document database) to PostgreSQL (relational SQL database)  
**Status**: Planning Phase  

---

## 1. Executive Summary

The College Management System currently uses MongoDB as its database. This document outlines the requirements for migrating to PostgreSQL while maintaining full API compatibility, data integrity, and system functionality.

**Key Goals**:
- Seamless database migration with zero data loss
- Maintain all API endpoints and response structures (client remains unchanged)
- Improve data consistency through relational integrity constraints
- Better scalability for large datasets (attendance, assignments, marks)
- Enable complex queries and reporting capabilities

---

## 2. Current System Overview

### 2.1 Technology Stack
- **Backend**: Node.js + Express.js
- **ORM**: Mongoose (MongoDB)
- **Database**: MongoDB
- **Frontend**: React + Vite (No changes needed)
- **Authentication**: JWT + cookies
- **File Storage**: Local uploads folder

### 2.2 Core Entities (14 Models)
1. **User** - System users (admin, teachers, students)
2. **Batch** - Student batches/cohorts
3. **Course** - Academic courses
4. **Assignment** - Course assignments
5. **Submission** - Student assignment submissions
6. **Attendance** - Daily/hourly attendance
7. **Marks** - Student marks/grades
8. **Exam** - Exam schedules
9. **Timetable** - Weekly class schedules
10. **Announcement** - System announcements
11. **Todo** - User task management
12. **Notification** - User notifications
13. **Event** - College events
14. **ODApplication** - On Duty (leave) applications

### 2.3 Key Features Dependent on Database
- User authentication & role-based access control
- Course and batch management
- Attendance tracking (daily + hourly slots)
- Assignment and submission workflow
- Marks management and grading
- Exam scheduling
- Timetable management
- Announcement distribution
- Event management
- OD (On Duty) leave applications
- Todo list management
- Notification system

---

## 3. Migration Scope

### 3.1 What's Included
✅ Database schema redesign (MongoDB → PostgreSQL)  
✅ Update all 14 models to use Sequelize ORM or direct SQL  
✅ Migrate all 16 controllers  
✅ Update all 16 route files  
✅ Rewrite seed/data initialization script  
✅ Update database configuration  
✅ Create database migration scripts  
✅ Data validation and integrity checks  
✅ Comprehensive unit testing of data operations  

### 3.2 What's Excluded (Client Remains Unchanged)
❌ Frontend code (React)  
❌ API endpoint routes (keep same structure)  
❌ API response formats (maintain compatibility)  
❌ Authentication flow  
❌ File upload mechanism  
❌ UI/UX changes  

---

## 4. Data Mapping Strategy

### 4.1 Key Mapping Principles
- **ObjectId → UUID/SERIAL**: MongoDB ObjectIds converted to PostgreSQL UUID or SERIAL primary keys
- **Nested Objects → Foreign Keys**: Embedded documents become normalized tables with foreign key relationships
- **References → Foreign Keys**: Mongoose references become explicit PostgreSQL foreign keys
- **Dates**: MongoDB Date objects map directly to PostgreSQL TIMESTAMP
- **Enums**: String enums become PostgreSQL ENUM types or VARCHAR with CHECK constraints
- **Compound Indexes**: Convert index definitions to PostgreSQL equivalents

### 4.2 Schema Relationships

```
User (1) ──── (M) Batch
User (1) ──── (M) Course (as teacher_id in course.batches)
Batch (1) ──── (M) Course (M-M through course.batches)
Course (1) ──── (M) Assignment
Course (1) ──── (M) Attendance
Course (1) ──── (M) Exam
Course (1) ──── (M) Marks
Batch (1) ──── (1) Timetable
Assignment (1) ──── (M) Submission
User (1) ──── (M) Submission (student)
User (1) ──── (M) Todo
User (1) ──── (M) Notification
User (1) ──── (M) Attendance
User (1) ──── (M) Marks
User (1) ──── (M) ODApplication
User (1) ──── (M) Event (created_by)
User (1) ──── (M) Announcement (created_by)
```

### 4.3 Complex Data Structures

#### Timetable Structure (from MongoDB)
```javascript
{
  batch_id: ObjectId,
  timetable: {
    Monday: [{ hour, subject, faculty, room }],
    Tuesday: [{ hour, subject, faculty, room }],
    // ... etc
  }
}
```

**PostgreSQL Redesign**:
- Create `timetable_slots` table with: id, timetable_id, day, hour, subject, faculty, room
- Parent `timetable` table: id, batch_id

#### Course Structure (with nested Batches)
```javascript
{
  name, code, description, credits, department, semester, year, regulation,
  batches: [{ batch_id: ObjectId, teacher_id: ObjectId }],
  created_at, updated_at
}
```

**PostgreSQL Redesign**:
- Create `course_batch_assignment` junction table
- Columns: id, course_id, batch_id, teacher_id

---

## 5. Technical Requirements

### 5.1 ORM Selection
**Recommended**: Sequelize ORM
- Mature, well-documented for Node.js
- Excellent PostgreSQL support
- Automatic migrations
- Built-in validation and hooks
- Similar syntax to current Mongoose usage

**Alternative**: Direct SQL with `pg` library (less code overhead)

### 5.2 Database Setup
- **Database**: PostgreSQL 14+
- **Connection Pool**: Manage connections efficiently
- **Connection String Format**: `postgresql://user:password@localhost:5432/student_dashboard`
- **Encoding**: UTF-8
- **Timezone**: UTC for all timestamps

### 5.3 Dependencies to Install
```json
{
  "dependencies": {
    "sequelize": "^6.35.0",
    "pg": "^8.11.0",
    "pg-hstore": "^2.3.4"
  }
}
```

### 5.4 Breaking Changes to Handle
- No automatic _id field generation (switch to UUID or SERIAL)
- No document-level atomicity guarantees (need transactions for multi-table operations)
- No embedded documents (normalization required)
- Join performance considerations for complex queries

---

## 6. API Compatibility Requirements

### 6.1 Response Format Compatibility
All API responses must maintain current structure:

```javascript
// Always maintain this structure
{
  success: boolean,
  data: object|array,
  error?: string,
  message?: string
}
```

### 6.2 ID Field Handling
- **Current**: MongoDB returns `_id` as ObjectId strings
- **Future**: PostgreSQL returns `id` as integers or UUIDs
- **Solution**: All responses must use `id` field (not `_id`)
  - Update model serialization
  - Create response formatters if needed

### 6.3 Backward Compatibility Checklist
- ✅ Error response format unchanged
- ✅ Success codes and messages unchanged
- ✅ Date formats unchanged (ISO 8601)
- ✅ Enum values unchanged (present/absent, pending/approved, etc.)
- ✅ Pagination format (if any)
- ✅ Query parameter handling

---

## 7. Data Integrity & Validation

### 7.1 Constraints to Implement
```sql
-- Primary Keys
id SERIAL PRIMARY KEY

-- Unique Constraints
email VARCHAR(255) UNIQUE NOT NULL
batch_id IN courses.batches UNIQUE (batch_id per course)

-- NOT NULL Constraints
name VARCHAR(255) NOT NULL
password_hash VARCHAR(255) NOT NULL
email VARCHAR(255) NOT NULL

-- Check Constraints
status IN ('present', 'absent')
role IN ('admin', 'teacher', 'student', 'pending_teacher')
priority IN ('high', 'normal', 'low')

-- Foreign Keys
references User(id) ON DELETE CASCADE
references Course(id) ON DELETE CASCADE
```

### 7.2 Data Validation Rules
- Email validation: Must be unique, valid format, @sriher.edu.in domain for most users
- Password: Minimum 8 characters, hashed with bcrypt
- Date fields: ISO 8601 format
- Numeric fields: appropriate ranges (marks 0-100, etc.)

### 7.3 Transaction Requirements
- Multi-table operations (create assignment + create notification)
- Batch operations (seed data insertion)
- Submission grading (update submission + update marks + create notification)

---

## 8. Implementation Phases

### Phase 1: Setup & Configuration (Days 1-2)
- Install PostgreSQL and required packages
- Create database and connection pool
- Set up environment configuration
- Create schema/migration structure

### Phase 2: Model Migration (Days 3-5)
- Convert all 14 Mongoose models to Sequelize models
- Define relationships and constraints
- Implement validations
- Set up associations

### Phase 3: Controller Updates (Days 6-8)
- Update all 16 controllers for Sequelize syntax
- Replace Mongoose queries with Sequelize queries
- Add error handling
- Test each controller's CRUD operations

### Phase 4: Route & Seed Updates (Days 9-10)
- Verify route definitions (no changes needed)
- Rewrite seed script for PostgreSQL
- Test data initialization

### Phase 5: Testing & Validation (Days 11-12)
- Integration testing of all endpoints
- Data validation and integrity checks
- Performance testing
- Production readiness checks

### Phase 6: Deployment (Day 13)
- Database backup procedures
- Migration execution
- Smoke testing
- Monitoring and rollback plan

---

## 9. Risk Mitigation

### 9.1 Identified Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Data loss during migration | Critical | Full backup before migration; dry-run on copy |
| Downtime during migration | High | Plan migration during maintenance window |
| API compatibility issues | High | Maintain response format; comprehensive testing |
| Performance degradation | Medium | Index optimization; query analysis |
| Referential integrity errors | Medium | Validate constraints during migration |

### 9.2 Rollback Plan
1. Backup MongoDB database before starting
2. Keep both systems running during transition period
3. Verify data consistency after migration
4. Maintain MongoDB access for 30 days post-migration
5. Document all schema mappings for reference

---

## 10. Success Criteria

✅ All 14 models successfully migrated  
✅ All 16 controllers working with PostgreSQL  
✅ 100% API endpoint compatibility  
✅ Zero data loss in migration  
✅ All business logic preserved  
✅ Performance meets or exceeds MongoDB baseline  
✅ No client-side changes required  
✅ Database properly normalized  
✅ Referential integrity enforced  
✅ Transaction support for multi-step operations  

---

## 11. Post-Migration Improvements (Future)

### Potential Enhancements
- Advanced reporting and analytics
- Complex queries across multiple tables
- Data warehousing capabilities
- Automated backup solutions
- Read replicas for load balancing
- Full-text search on announcements
- Historical data auditing

---

## 12. Appendix

### A. Current Model List
```
User, Batch, Course, Assignment, Submission, Attendance, Marks, Exam,
Timetable, Announcement, Todo, Notification, Event, ODApplication
```

### B. Current Routes List
```
/api/auth, /api/dashboard, /api/courses, /api/assignments, /api/marks,
/api/attendance, /api/timetable, /api/exams, /api/announcements,
/api/od, /api/todos, /api/notifications, /api/events, /api/analytics,
/api/settings, /api/admin
```

### C. Environment Variables Changes
```diff
- MONGO_URI=mongodb://localhost:27017/student_dashboard
+ DB_HOST=localhost
+ DB_PORT=5432
+ DB_NAME=student_dashboard
+ DB_USER=postgres
+ DB_PASSWORD=your_password
+ DB_POOL_SIZE=10
```

---

**Document Version**: 1.0  
**Last Updated**: March 23, 2026  
**Next Review**: After Phase 2 completion
