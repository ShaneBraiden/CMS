# Complete File Update Guide - MongoDB to PostgreSQL Migration

**Purpose**: Systematic guide of ALL files that need updates and what changes are required  
**Date**: March 23, 2026  
**Total Files to Update**: 50+ files  

---

## PART 1: SERVER-SIDE FILES (Backend - Node.js/Express)

### Configuration Files (3 files)

#### 1. `server/config/config.js` ⚠️ CRITICAL
**Status**: Must Update  
**Current**: Uses MongoDB connection string  
**Changes Required**:
```javascript
// BEFORE:
module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/student_dashboard',
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
  ...
};

// AFTER:
module.exports = {
  port: process.env.PORT || 5000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'student_dashboard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },
  poolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
  ...
};
```
**Impact**: High - affects all database connections

---

#### 2. `server/config/db.js` ⚠️ CRITICAL
**Status**: Complete Rewrite  
**Current**: Uses Mongoose connection  
**Changes Required**:
```javascript
// BEFORE:
const mongoose = require('mongoose');
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      maxPoolSize: 20,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
module.exports = connectDB;

// AFTER:
const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    pool: {
      max: config.poolSize,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    logging: false // Set to console.log for query debugging
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`PostgreSQL Connected: ${config.database.host}:${config.database.port}/${config.database.name}`);
    return sequelize;
  } catch (error) {
    console.error(`PostgreSQL Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, sequelize };
```
**Impact**: Critical

---

#### 3. `server/.env` ⚠️ CRITICAL
**Status**: Update Environment Variables  
**Current Content**:
```
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

**New Content**:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_dashboard
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_POOL_SIZE=10
JWT_SECRET=mern_student_dashboard_jwt_secret_key_2024
JWT_EXPIRE=7d
UPLOAD_FOLDER=uploads
MAX_FILE_SIZE=16777216
ADMIN_EMAIL=admin@sriher.edu.in
ALLOWED_EXTENSIONS=pdf,doc,docx,txt,zip,jpg,png
NODE_ENV=development
```

---

### Package Dependencies (1 file)

#### 4. `server/package.json` ⚠️ CRITICAL
**Status**: Must Update  
**Changes Required**:
```json
{
  "dependencies": {
    // REMOVE:
    "mongoose": "^9.2.2",
    
    // ADD:
    "sequelize": "^6.35.0",
    "pg": "^8.11.0",
    "pg-hstore": "^2.3.4"
  }
}
```
**Action**: Run `npm install` after update

---

### Model Files (14 files → Complete Rewrite/Creation)

Each model needs to be rewritten from Mongoose to Sequelize. Format is standardized:

#### 5-18. Models Directory: `server/models/*.js`

All 14 files need updating:

| File | Type | Key Changes |
|------|------|-------------|
| User.js | Rewrite | Remove mongoose schema, add Sequelize model with UUID/SERIAL |
| Batch.js | Rewrite | Add foreign key for teacher_id |
| Course.js | Rewrite | Create separate CourseBatchTeacher junction table |
| **CourseBatchTeacher.js** | **NEW FILE** | Many-to-many relationship table |
| Assignment.js | Rewrite | Update foreign key syntax |
| Submission.js | Rewrite | Keep unique constraint (assignment_id, student_id) |
| Attendance.js | Rewrite | Store hourly_status as JSON, add date index |
| Marks.js | Rewrite | Use DECIMAL for marks |
| Exam.js | Rewrite | Convert time to TIME type |
| Timetable.js | Rewrite | Remove nested structure, create slots table |
| **TimetableSlot.js** | **NEW FILE** | Normalized slots table |
| Announcement.js | Rewrite | Keep enums and relationships |
| Todo.js | Rewrite | Keep structure, update foreign key |
| Notification.js | Rewrite | Keep indexes on (user_id, read) |
| Event.js | Rewrite | Keep structure |
| ODApplication.js | Rewrite | Keep structure |

**Common Changes in ALL Models**:
- Replace `const mongoose = require('mongoose')` with Sequelize import
- Replace `mongoose.Schema` with Sequelize `define`
- Replace `mongoose.model()` export with Sequelize model export
- Add `timestamps: true` with `createdAt: 'created_at'`, `updatedAt: 'updated_at'`
- Add all foreign keys with `onDelete: 'CASCADE'` or `'SET NULL'`
- Add indexes explicitly
- Remove pre/post hooks - move to controller or model methods

**Example Template**:
```javascript
// server/models/Example.js
module.exports = (sequelize, DataTypes) => {
  const Example = sequelize.define('Example', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    user_id: { 
      type: DataTypes.INTEGER, 
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    }
    // ... other fields
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ fields: ['user_id'] }]
  });

  return Example;
};
```

#### 19. `server/models/index.js` - NEW FILE ✅ NEW
**Purpose**: Export all models and set up associations  
**Content Template**:
```javascript
const fs = require('fs');
const path = require('path');
const { sequelize, Sequelize } = require('../config/db');

const db = {};

// Load all models
fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && file !== 'index.js')
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
```

---

### Controller Files (16 files → Update Queries)

#### 20-35. Controllers: `server/controllers/*.js`

All controller files need query updates from Mongoose to Sequelize:

| Controller | File | Key Changes |
|-----------|------|-------------|
| Auth | auth.controller.js | User.findOne → findOne({ where }), password hashing logic |
| Batch | (if exists) | Batch CRUD operations |
| Course | course.controller.js | Complex: handle junction table for batches |
| Assignment | assignment.controller.js | Find, create, update, delete |
| Submission | (if in assignment) | Grading workflow with transactions |
| Attendance | attendance.controller.js | Date queries, hourly_status JSON handling |
| Marks | marks.controller.js | Bulk updates, aggregations |
| Exam | exam.controller.js | Date/time queries |
| Timetable | timetable.controller.js | **CRITICAL**: Transform slots ↔ days structure |
| Announcement | announcement.controller.js | Filter by audience |
| Todo | todo.controller.js | User-specific queries |
| Notification | notification.controller.js | Index on (user_id, read) |
| Event | event.controller.js | Basic CRUD |
| OD App | od.controller.js | Status workflow |
| Admin | admin.controller.js | User/batch/course management |
| Dashboard | dashboard.controller.js | Stats aggregation |
| Analytics | analytics.controller.js | Complex queries |
| Settings | settings.controller.js | Configuration queries |

**Common Query Pattern Changes**:
```javascript
// BEFORE (Mongoose):
const user = await User.findById(id);
const users = await User.find({ role: 'student' });
await User.create({ name, email });
await User.findByIdAndUpdate(id, data);

// AFTER (Sequelize):
const user = await User.findByPk(id);
const users = await User.findAll({ where: { role: 'student' } });
await User.create({ name, email });
await User.update(data, { where: { id } });
```

**CRITICAL: Timetable Controller** - Must transform between formats:
```javascript
// When fetching:
const tt = await Timetable.findByPk(id, { include: ['TimetableSlots'] });
// Group TimetableSlots by day for response

// When creating/updating:
// Parse day structure from request, insert individual slots
```

---

### Route Files (16 files → Verify Structure)

#### 36-51. Routes: `server/routes/*.js`

**Status**: ✅ NO CHANGES NEEDED  
**Reason**: Routes use controller methods which will be updated. Route definitions stay the same.

**Verification Checklist**:
- [ ] auth.routes.js - No changes
- [ ] course.routes.js - No changes
- [ ] assignment.routes.js - No changes
- [ ] attendance.routes.js - No changes
- [ ] marks.routes.js - No changes
- [ ] timetable.routes.js - No changes
- [ ] exam.routes.js - No changes
- [ ] announcement.routes.js - No changes
- [ ] od.routes.js - No changes
- [ ] todo.routes.js - No changes
- [ ] notification.routes.js - No changes
- [ ] event.routes.js - No changes
- [ ] analytics.routes.js - No changes
- [ ] settings.routes.js - No changes
- [ ] admin.routes.js - No changes
- [ ] dashboard.routes.js - No changes

---

### Middleware Files (4 files)

#### 52. `server/middleware/auth.js` ⚠️ UPDATE
**Status**: Update Query  
**Current**:
```javascript
req.user = await User.findById(decoded.id).select('-password_hash');
```
**Changes**:
```javascript
req.user = await User.findByPk(decoded.id, {
  attributes: { exclude: ['password_hash'] }
});
```

#### 53. `server/middleware/role.js` ✅ Verify
**Status**: No DB changes, verify role checking works

#### 54. `server/middleware/upload.js` ✅ Verify
**Status**: No changes (file upload logic independent)

#### 55. `server/middleware/errorHandler.js` ✅ Minor Update
**Status**: Update to handle Sequelize validation errors
**Changes**:
```javascript
// Handle Sequelize validation errors
if (error.name === 'SequelizeValidationError') {
  return res.status(400).json({ 
    success: false, 
    error: error.errors.map(e => e.message).join(', ')
  });
}
if (error.name === 'SequelizeUniqueConstraintError') {
  return res.status(400).json({ 
    success: false, 
    error: `${error.fields.join(', ')} already exists`
  });
}
```

---

### Utility Files (2 files)

#### 56. `server/utils/generateToken.js` ✅ No Changes
**Status**: Unchanged (JWT generation independent of DB)

#### 57. `server/utils/helpers.js` ⚠️ Check Queries
**Status**: Review - update if it contains database queries

---

### Main Server File (1 file)

#### 58. `server/server.js` ⚠️ UPDATE
**Status**: Update database initialization  
**Current**:
```javascript
const connectDB = require('./config/db');
// ...
connectDB(); // Called in app startup
```

**Changes**:
```javascript
const { connectDB, sequelize } = require('./config/db');
// ...
const startServer = async () => {
  const db = await connectDB();
  // Sync/migrate database
  await sequelize.sync({ alter: false }); // or use migrations
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
```

---

### Seed File (1 file)

#### 59. `server/seed/seed.js` ⚠️ CRITICAL REWRITE
**Status**: Complete Rewrite  
**Current**: Uses Mongoose  
**Changes**: Rewrite for Sequelize  
**Key Requirements**:
- Import Sequelize models
- Connect to PostgreSQL database
- Clear all tables (use truncate)
- Insert test data in correct order (foreign key dependencies!)
- Handle transactions for complex operations
- Create admin user, students, teachers, courses, etc.
- Create relationships through junction tables

**Insert Order** (important for FK constraints):
1. Users (no FK dependencies)
2. Batches (depends on Users for teacher_id)
3. Courses (no FK dependencies)
4. CourseBatchTeachers (junction - depends on Courses, Batches, Users)
5. Assignments (depends on Course, User)
6. Submissions (depends on Assignment, User)
7. Attendance (depends on User, Course)
8. Marks (depends on User, Course)
9. Exams (depends on Course, User)
10. Timetables (depends on Batch)
11. TimetableSlots (depends on Timetable)
12. Announcements (depends on User)
13. Todos (depends on User)
14. Notifications (depends on User)
15. Events (depends on User)
16. ODApplications (depends on User)

---

## PART 2: CLIENT-SIDE FILES (Frontend - React)

### Client Files: ✅ NO CHANGES EXPECTED

All client files should work unchanged because:
- API endpoint URLs remain the same
- API response format maintained
- Authentication flow unchanged

**Verification checklist** (test after server migration):
- [ ] Login flows work
- [ ] Data displays correctly
- [ ] All API calls return expected data
- [ ] No 404 or 500 errors

#### Files to Verify (not modify):
- `client/src/api/axios.js` - Request/response handling
- `client/src/App.jsx` - Main component
- `client/src/pages/**/*.jsx` - All page components (16 page folders)
- `client/src/components/*.jsx` - Layout, Route guards
- `client/src/context/AuthContext.jsx` - Auth state
- `client/src/utils/*.js` - Utility functions
- `client/package.json` - No new dependencies needed

---

## PART 3: DOCUMENTATION FILES (NEW)

#### 60. `DATABASE_SCHEMA.md` - NEW FILE ✅
**Purpose**: Document final PostgreSQL schema  
**Content**: SQL DDL for all tables, indexes, constraints

#### 61. `SEQUELIZE_MODELS.md` - NEW FILE ✅
**Purpose**: Document Sequelize model structure  
**Content**: Model definitions, associations, hooks

#### 62. `MIGRATION_STEPS.md` - NEW FILE ✅
**Purpose**: Step-by-step migration instructions  
**Content**: How to run migrations, backup, restore

#### 63. `TROUBLESHOOTING.md` - NEW FILE ✅
**Purpose**: Common issues and solutions  
**Content**: Error handling, debugging guide

#### 64. `.env.example` - UPDATE
**Status**: Add new environment variables  
**Content**: PostgreSQL connection variables

---

## PART 4: PROJECT SETUP FILES

#### 65. `README.md` ⚠️ UPDATE
**Status**: Update setup instructions  
**Current**: Explains MongoDB setup  
**Changes**: Add PostgreSQL setup, update DB connection steps

---

## SUMMARY TABLE: ALL FILES

### By Category

| Category | Count | Files | Action |
|----------|-------|-------|--------|
| **Config** | 3 | config.js, db.js, .env | Rewrite |
| **Package** | 1 | package.json | Update deps |
| **Models** | 16 | 14 existing + 2 new | Rewrite/Create |
| **Controllers** | 16 | All controllers | Update queries |
| **Routes** | 16 | All routes | Verify only |
| **Middleware** | 4 | auth.js, role.js, upload.js, errorHandler.js | Mostly verify |
| **Utils** | 2 | generateToken.js, helpers.js | Verify |
| **Server** | 1 | server.js | Update |
| **Seed** | 1 | seed/seed.js | Rewrite |
| **Client** | 20+ | All React files | Verify only |
| **Docs** | 5+ | New docs + updates | Create/Update |
| **TOTAL** | **85+** | | |

---

## PRIORITY MAPPING

### Phase 1: FOUNDATION (Must do first)
- ✅ Update package.json
- ✅ Create new config files (config.js, db.js)
- ✅ Update .env with PostgreSQL variables
- ✅ Install dependencies

### Phase 2: MODELS (Before controllers)
- ✅ Create all Sequelize models (16 total)
- ✅ Create models/index.js with associations
- ✅ Verify model structure

### Phase 3: CONTROLLERS (Before routes become functional)
- ✅ Update all 16 controllers with Sequelize queries
- ✅ Add error handling for SQL errors
- ✅ Verify response formats match

### Phase 4: GLUE (Connect everything)
- ✅ Update server.js for Sequelize
- ✅ Update middleware (auth.js priority)
- ✅ Rewrite seed.js
- ✅ Verify routes (no changes but test)

### Phase 5: VERIFICATION
- ✅ Test all endpoints
- ✅ Test client/server integration
- ✅ Performance testing

---

## FILE COMPLEXITY MATRIX

| File | Complexity | Est. Time | Notes |
|------|-----------|-----------|-------|
| config.js | High | 30min | Must be perfect |
| db.js | High | 1h | Connection pooling |
| package.json | Low | 5min | Just add/remove deps |
| User model | Medium | 45min | Foundation model |
| Course model | **Very High** | 2h | Complex relationships |
| Timetable model | **Very High** | 2h | Restructured |
| Controllers (each) | Medium | 1-2h | Repetitive patterns |
| auth.controller | High | 2h | Critical for system |
| timetable.controller | **Very High** | 3h | Complex transformation |
| seed.js | High | 2-3h | Many insertions |

---

## CRITICAL SUCCESS FACTORS

1. ✅ **Maintain Response Format** - API compatibility is key
2. ✅ **Handle Complex Relationships** - Course, Timetable transformations
3. ✅ **Preserve Unique Constraints** - Attendance, Submission deduplication
4. ✅ **Maintain Error Handling** - User feedback consistency
5. ✅ **Test Thoroughly** - Each controller endpoint
6. ✅ **Backup Original Data** - Before migration
7. ✅ **Document Extensively** - For future maintenance

---

## ROLLOUT STRATEGY

### Pre-Migration (Day 1)
- [ ] Backup MongoDB
- [ ] Set up PostgreSQL test environment
- [ ] Create new branch/repo for work
- [ ] Team code review of plans

### Migration Phase (Days 2-10)
- [ ] Execute migrations in order
- [ ] Test each phase
- [ ] Document issues/solutions
- [ ] Internal testing

### Deployment (Day 11-12)
- [ ] Final backup MongoDB
- [ ] Deploy to staging
- [ ] Full regression testing
- [ ] Deploy to production (during maintenance window)
- [ ] Monitor 24 hours

### Post-Migration (Day 13+)
- [ ] Archive MongoDB (30-day safety window)
- [ ] Performance optimization
- [ ] Team debrief
- [ ] Documentation finalization

---

**Document Version**: 1.0  
**Last Updated**: March 23, 2026  
**Maintained By**: Development Team  
**Review Frequency**: After each phase completion
