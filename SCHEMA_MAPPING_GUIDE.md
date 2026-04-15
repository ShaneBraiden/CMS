# MongoDB to PostgreSQL Schema Mapping Guide

**Purpose**: Detailed reference for converting each MongoDB model to PostgreSQL with Sequelize  
**Date**: March 23, 2026  
**Version**: 1.0

---

## Quick Reference: Type Mapping

| MongoDB | PostgreSQL | Sequelize |
|---------|------------|-----------|
| ObjectId | INTEGER (SERIAL) or UUID | DataTypes.INTEGER / DataTypes.UUID |
| String | VARCHAR(255) | DataTypes.STRING |
| Number | INTEGER / DECIMAL | DataTypes.INTEGER / DataTypes.DECIMAL |
| Boolean | BOOLEAN | DataTypes.BOOLEAN |
| Date | TIMESTAMP | DataTypes.DATE |
| Array | JSON or separate table | DataTypes.JSON or hasMany |
| Embedded Object | Separate table | hasOne / belongsTo |
| Enum | VARCHAR with CHECK or ENUM | DataTypes.ENUM |
| Unique Index | UNIQUE constraint | unique: true |
| Sparse Unique | UNIQUE NULLS NOT DISTINCT | allowNull: true, unique: true |

---

## 1. USER MODEL

### MongoDB Schema (Current)
```javascript
{
  _id: ObjectId,
  name: { type: String, required: true, minlength: 2, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student', 'pending_teacher'], default: 'student' },
  batch_id: { type: ObjectId, ref: 'Batch', default: null },
  created_at: { type: Date, default: Date.now }
}
```

### PostgreSQL Schema (Target)
```sql
CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL CHECK (length("name") >= 2),
  "email" VARCHAR(255) NOT NULL UNIQUE COLLATE NOCASE,
  "password_hash" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) NOT NULL CHECK ("role" IN ('admin', 'teacher', 'student', 'pending_teacher')) DEFAULT 'student',
  "batch_id" INTEGER REFERENCES "Batches"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON "Users"("email");
CREATE INDEX idx_users_batch_id ON "Users"("batch_id");
```

### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [2, 255] },
      trim: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      lowercase: true
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'teacher', 'student', 'pending_teacher'),
      defaultValue: 'student'
    },
    batch_id: {
      type: DataTypes.INTEGER,
      references: { model: 'Batches', key: 'id' },
      onDelete: 'SET NULL'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    indexes: [
      { fields: ['email'] },
      { fields: ['batch_id'] }
    ]
  });

  return User;
};
```

### Migration Notes
- ✅ _id → id (auto-increment INTEGER)
- ✅ Email now COLLATE NOCASE for case-insensitive comparison
- ✅ Add updated_at timestamp field (commonly used in SQL)
- ✅ Add foreign key constraint for batch_id with CASCADE delete
- ⚠️ Case-insensitive email storage: handle in application or use LOWER() function

---

## 2. BATCH MODEL

### MongoDB Schema
```javascript
{
  _id: ObjectId,
  name: { type: String, required: true, trim: true },
  year: { type: String, default: '' },
  department: { type: String, default: '' },
  teacher_id: { type: ObjectId, ref: 'User', default: null },
  created_at: { type: Date, default: Date.now }
}
```

### PostgreSQL Schema
```sql
CREATE TABLE "Batches" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "year" VARCHAR(50) DEFAULT '',
  "department" VARCHAR(255) DEFAULT '',
  "teacher_id" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_batches_teacher_id ON "Batches"("teacher_id");
```

### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const Batch = sequelize.define('Batch', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    year: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    department: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['teacher_id'] }
    ]
  });

  return Batch;
};
```

---

## 3. COURSE MODEL (Complex: Nested Batches → Junction Table)

### MongoDB Schema (Current - with nested array)
```javascript
{
  _id: ObjectId,
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true, sparse: true, trim: true },
  description: { type: String, default: '' },
  credits: { type: Number, default: 0 },
  department: { type: String, default: '' },
  semester: { type: Number, default: null },
  year: { type: Number, default: null },
  regulation: { type: String, default: '', trim: true },
  batches: [{
    batch_id: { type: ObjectId, ref: 'Batch', required: true },
    teacher_id: { type: ObjectId, ref: 'User', required: true }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}
```

### PostgreSQL Schema (Normalized with Junction Table)
```sql
CREATE TABLE "Courses" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(50) UNIQUE NULLS NOT DISTINCT,
  "description" TEXT DEFAULT '',
  "credits" INTEGER DEFAULT 0,
  "department" VARCHAR(255) DEFAULT '',
  "semester" INTEGER,
  "year" INTEGER,
  "regulation" VARCHAR(50) DEFAULT '',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CourseBatchTeachers" (
  "id" SERIAL PRIMARY KEY,
  "course_id" INTEGER NOT NULL REFERENCES "Courses"("id") ON DELETE CASCADE,
  "batch_id" INTEGER NOT NULL REFERENCES "Batches"("id") ON DELETE CASCADE,
  "teacher_id" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("course_id", "batch_id", "teacher_id")
);

CREATE INDEX idx_courses_code ON "Courses"("code");
CREATE INDEX idx_coursebatchteachers_course ON "CourseBatchTeachers"("course_id");
CREATE INDEX idx_coursebatchteachers_batch ON "CourseBatchTeachers"("batch_id");
CREATE INDEX idx_coursebatchteachers_teacher ON "CourseBatchTeachers"("teacher_id");
```

### Sequelize Models
```javascript
// Course Model
module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    credits: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    department: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    semester: DataTypes.INTEGER,
    year: DataTypes.INTEGER,
    regulation: {
      type: DataTypes.STRING,
      defaultValue: ''
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Course;
};

// Junction Table
module.exports = (sequelize, DataTypes) => {
  const CourseBatchTeacher = sequelize.define('CourseBatchTeacher', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    course_id: {
      type: DataTypes.INTEGER,
      references: { model: 'Courses', key: 'id' },
      onDelete: 'CASCADE'
    },
    batch_id: {
      type: DataTypes.INTEGER,
      references: { model: 'Batches', key: 'id' },
      onDelete: 'CASCADE'
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    }
  }, {
    timestamps: false,
    indexes: [
      { fields: ['course_id', 'batch_id', 'teacher_id'], unique: true }
    ]
  });

  return CourseBatchTeacher;
};
```

### Controller Response Transformation
```javascript
// When fetching courses, transform flatten the batches:
const course = await Course.findByPk(courseId, {
  include: [
    {
      model: CourseBatchTeacher,
      as: 'courseBatches',
      include: ['Batch', 'Teacher']
    }
  ]
});

// Transform to MongoDB format for response:
const response = {
  ...course.toJSON(),
  batches: course.courseBatches.map(cb => ({
    batch_id: cb.batch_id,
    teacher_id: cb.teacher_id
  }))
};
```

### Migration Notes
- ✅ Nested `batches` array → separate `CourseBatchTeachers` junction table
- ✅ Composite unique constraint on (course_id, batch_id, teacher_id)
- ✅ Cascade delete for referential integrity
- ⚠️ Response formatting must flatten back to original structure for API compatibility

---

## 4. ASSIGNMENT MODEL

### MongoDB Schema
```javascript
{
  _id: ObjectId,
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  course_id: { type: ObjectId, ref: 'Course', required: true },
  teacher_id: { type: ObjectId, ref: 'User' },
  due_date: { type: Date },
  total_marks: { type: Number, default: 100 },
  created_at: { type: Date, default: Date.now }
}
```

### PostgreSQL Schema
```sql
CREATE TABLE "Assignments" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT DEFAULT '',
  "course_id" INTEGER NOT NULL REFERENCES "Courses"("id") ON DELETE CASCADE,
  "teacher_id" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
  "due_date" TIMESTAMP,
  "total_marks" INTEGER DEFAULT 100,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignments_course ON "Assignments"("course_id");
CREATE INDEX idx_assignments_teacher ON "Assignments"("teacher_id");
```

### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const Assignment = sequelize.define('Assignment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Courses', key: 'id' },
      onDelete: 'CASCADE'
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    },
    due_date: DataTypes.DATE,
    total_marks: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Assignment;
};
```

---

## 5. SUBMISSION MODEL (with Unique Constraint)

### MongoDB Schema
```javascript
{
  _id: ObjectId,
  assignment_id: { type: ObjectId, ref: 'Assignment', required: true },
  student_id: { type: ObjectId, ref: 'User', required: true },
  student_name: String,
  file_path: String,
  filename: String,
  comments: { type: String, default: '' },
  submitted_at: { type: Date, default: Date.now },
  status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
  marks: { type: Number, default: null },
  feedback: { type: String, default: '' },
  graded_by: { type: ObjectId, ref: 'User', default: null },
  graded_at: Date
}

// Index: { assignment_id: 1, student_id: 1 }, { unique: true }
```

### PostgreSQL Schema
```sql
CREATE TABLE "Submissions" (
  "id" SERIAL PRIMARY KEY,
  "assignment_id" INTEGER NOT NULL REFERENCES "Assignments"("id") ON DELETE CASCADE,
  "student_id" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "student_name" VARCHAR(255),
  "file_path" VARCHAR(500),
  "filename" VARCHAR(255),
  "comments" TEXT DEFAULT '',
  "submitted_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "status" VARCHAR(50) NOT NULL CHECK ("status" IN ('submitted', 'graded')) DEFAULT 'submitted',
  "marks" DECIMAL(5,2),
  "feedback" TEXT DEFAULT '',
  "graded_by" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
  "graded_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("assignment_id", "student_id")
);

CREATE INDEX idx_submissions_student ON "Submissions"("student_id");
CREATE INDEX idx_submissions_status ON "Submissions"("status");
```

### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const Submission = sequelize.define('Submission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    assignment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Assignments', key: 'id' },
      onDelete: 'CASCADE'
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    student_name: DataTypes.STRING,
    file_path: DataTypes.STRING,
    filename: DataTypes.STRING,
    comments: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    submitted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('submitted', 'graded'),
      defaultValue: 'submitted'
    },
    marks: DataTypes.DECIMAL(5, 2),
    feedback: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    graded_by: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    },
    graded_at: DataTypes.DATE
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['assignment_id', 'student_id'], unique: true },
      { fields: ['student_id'] },
      { fields: ['status'] }
    ]
  });

  return Submission;
};
```

### Migration Notes
- ✅ Unique constraint on (assignment_id, student_id) - one submission per student per assignment
- ⚠️ Handle duplicate key error gracefully in controller (student re-submitting)

---

## 6. ATTENDANCE MODEL (with Array JSON)

### MongoDB Schema
```javascript
{
  _id: ObjectId,
  student_id: { type: ObjectId, ref: 'User', required: true },
  course_id: { type: ObjectId, ref: 'Course', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent'], default: 'absent' },
  hourly_status: { type: [String], default: ['N', 'N', 'N', 'N', 'N', 'N', 'N'] },
  marked_by: { type: ObjectId, ref: 'User' },
  marked_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}

// Index: { student_id: 1, course_id: 1, date: 1 }, { unique: true }
```

### PostgreSQL Schema
```sql
CREATE TABLE "Attendances" (
  "id" SERIAL PRIMARY KEY,
  "student_id" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "course_id" INTEGER NOT NULL REFERENCES "Courses"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "status" VARCHAR(20) NOT NULL CHECK ("status" IN ('present', 'absent')) DEFAULT 'absent',
  "hourly_status" JSON DEFAULT '["N","N","N","N","N","N","N"]',
  "marked_by" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
  "marked_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("student_id", "course_id", "date")
);

CREATE INDEX idx_attendances_student ON "Attendances"("student_id");
CREATE INDEX idx_attendances_course ON "Attendances"("course_id");
CREATE INDEX idx_attendances_date ON "Attendances"("date");
CREATE INDEX idx_attendances_student_course_date ON "Attendances"("student_id", "course_id", "date");
```

### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Courses', key: 'id' },
      onDelete: 'CASCADE'
    },
    date: {
      type: DataTypes.DATEONLY, // Date without time
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('present', 'absent'),
      defaultValue: 'absent'
    },
    hourly_status: {
      type: DataTypes.JSON,
      defaultValue: ['N', 'N', 'N', 'N', 'N', 'N', 'N']
    },
    marked_by: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    },
    marked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['student_id', 'course_id', 'date'], unique: true },
      { fields: ['student_id'] },
      { fields: ['course_id'] },
      { fields: ['date'] }
    ]
  });

  return Attendance;
};
```

### Migration Notes
- ✅ hourly_status stored as JSON array in PostgreSQL
- ✅ Use DATEONLY type for date (no time component)
- ✅ Composite unique index prevents duplicate attendance records
- ⚠️ When querying date ranges, use: `where: { date: { [Op.between]: [startDate, endDate] } }`

---

## 7. MARKS MODEL

### MongoDB Schema
```javascript
{
  _id: ObjectId,
  student_id: { type: ObjectId, ref: 'User', required: true },
  course_id: { type: ObjectId, ref: 'Course', required: true },
  exam_type: { type: String, default: '' },
  marks: { type: Number, required: true },
  max_marks: { type: Number, default: 100 },
  date: Date,
  remarks: { type: String, default: '' },
  updated_at: { type: Date, default: Date.now }
}
```

### PostgreSQL Schema
```sql
CREATE TABLE "Marks" (
  "id" SERIAL PRIMARY KEY,
  "student_id" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "course_id" INTEGER NOT NULL REFERENCES "Courses"("id") ON DELETE CASCADE,
  "exam_type" VARCHAR(100) DEFAULT '',
  "marks" DECIMAL(5,2) NOT NULL,
  "max_marks" DECIMAL(5,2) DEFAULT 100,
  "date" DATE,
  "remarks" TEXT DEFAULT '',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marks_student ON "Marks"("student_id");
CREATE INDEX idx_marks_course ON "Marks"("course_id");
```

### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const Marks = sequelize.define('Marks', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Courses', key: 'id' },
      onDelete: 'CASCADE'
    },
    exam_type: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    marks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    max_marks: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100
    },
    date: DataTypes.DATEONLY,
    remarks: {
      type: DataTypes.TEXT,
      defaultValue: ''
    }
  }, {
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['student_id'] },
      { fields: ['course_id'] }
    ]
  });

  return Marks;
};
```

---

## 8. EXAM MODEL

### MongoDB Schema
```javascript
{
  _id: ObjectId,
  course_id: { type: ObjectId, ref: 'Course' },
  exam_date: Date,
  start_time: String,
  duration: String,
  venue: { type: String, default: '' },
  exam_type: { type: String, default: '' },
  created_by: { type: ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
}
```

### PostgreSQL Schema
```sql
CREATE TABLE "Exams" (
  "id" SERIAL PRIMARY KEY,
  "course_id" INTEGER REFERENCES "Courses"("id") ON DELETE SET NULL,
  "exam_date" DATE,
  "start_time" TIME,
  "duration" VARCHAR(100),
  "venue" VARCHAR(255) DEFAULT '',
  "exam_type" VARCHAR(100) DEFAULT '',
  "created_by" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exams_course ON "Exams"("course_id");
CREATE INDEX idx_exams_date ON "Exams"("exam_date");
```

### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const Exam = sequelize.define('Exam', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    course_id: {
      type: DataTypes.INTEGER,
      references: { model: 'Courses', key: 'id' },
      onDelete: 'SET NULL'
    },
    exam_date: DataTypes.DATEONLY,
    start_time: DataTypes.TIME,
    duration: DataTypes.STRING,
    venue: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    exam_type: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    created_by: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Exam;
};
```

### Migration Notes
- ✅ start_time stored as TIME type (HH:MM:SS format)
- ✅ duration stored as VARCHAR (flexible format)

---

## 9. TIMETABLE MODEL (Complex: Nested Days Structure)

### MongoDB Schema (Current - nested by day)
```javascript
{
  _id: ObjectId,
  batch_id: { type: ObjectId, ref: 'Batch', required: true, unique: true },
  timetable: {
    Monday: [
      { hour: Number, subject: String, faculty: String, room: String },
      ...
    ],
    Tuesday: [...],
    Wednesday: [...],
    Thursday: [...],
    Friday: [...]
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}
```

### PostgreSQL Schema (Normalized: Separate slots table)
```sql
CREATE TABLE "Timetables" (
  "id" SERIAL PRIMARY KEY,
  "batch_id" INTEGER NOT NULL UNIQUE REFERENCES "Batches"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "TimetableSlots" (
  "id" SERIAL PRIMARY KEY,
  "timetable_id" INTEGER NOT NULL REFERENCES "Timetables"("id") ON DELETE CASCADE,
  "day" VARCHAR(20) NOT NULL CHECK ("day" IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
  "hour" INTEGER NOT NULL,
  "subject" VARCHAR(255) DEFAULT '',
  "faculty" VARCHAR(255) DEFAULT '',
  "room" VARCHAR(100) DEFAULT '',
  UNIQUE("timetable_id", "day", "hour")
);

CREATE INDEX idx_timetableslots_timetable ON "TimetableSlots"("timetable_id");
```

### Sequelize Models
```javascript
// Timetable Model
module.exports = (sequelize, DataTypes) => {
  const Timetable = sequelize.define('Timetable', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'Batches', key: 'id' },
      onDelete: 'CASCADE'
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Timetable;
};

// TimetableSlot Model
module.exports = (sequelize, DataTypes) => {
  const TimetableSlot = sequelize.define('TimetableSlot', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    timetable_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Timetables', key: 'id' },
      onDelete: 'CASCADE'
    },
    day: {
      type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
      allowNull: false
    },
    hour: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    faculty: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    room: {
      type: DataTypes.STRING,
      defaultValue: ''
    }
  }, {
    timestamps: false,
    indexes: [
      { fields: ['timetable_id', 'day', 'hour'], unique: true }
    ]
  });

  return TimetableSlot;
};
```

### Controller Response Transformation
```javascript
// When fetching, transform from rows to day-based structure:
const timetable = await Timetable.findByPk(timetableId, {
  include: ['TimetableSlots']
});

// Transform to MongoDB format for response:
const response = {
  id: timetable.id,
  batch_id: timetable.batch_id,
  timetable: {
    Monday: timetable.TimetableSlots.filter(s => s.day === 'Monday').sort((a,b) => a.hour - b.hour),
    Tuesday: timetable.TimetableSlots.filter(s => s.day === 'Tuesday').sort((a,b) => a.hour - b.hour),
    // ... etc
  },
  created_at: timetable.created_at,
  updated_at: timetable.updated_at
};
```

### Migration Notes
- ✅ Timetable nested structure decomposed into normalized slots
- ✅ Response transformation maintains API compatibility
- ✅ Unique constraint per day/hour combination

---

## 10. ANNOUNCEMENT MODEL

### MongoDB Schema
```javascript
{
  _id: ObjectId,
  title: { type: String, default: '' },
  content: { type: String, required: true },
  created_by: { type: ObjectId, ref: 'User' },
  created_by_name: String,
  created_at: { type: Date, default: Date.now },
  target_audience: { type: String, enum: ['all', 'students', 'teachers'], default: 'all' },
  priority: { type: String, enum: ['high', 'normal', 'low'], default: 'normal' }
}
```

### PostgreSQL Schema
```sql
CREATE TABLE "Announcements" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) DEFAULT '',
  "content" TEXT NOT NULL,
  "created_by" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
  "created_by_name" VARCHAR(255),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "target_audience" VARCHAR(50) CHECK ("target_audience" IN ('all', 'students', 'teachers')) DEFAULT 'all',
  "priority" VARCHAR(50) CHECK ("priority" IN ('high', 'normal', 'low')) DEFAULT 'normal',
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_created_at ON "Announcements"("created_at" DESC);
CREATE INDEX idx_announcements_priority ON "Announcements"("priority");
```

### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define('Announcement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    },
    created_by_name: DataTypes.STRING,
    target_audience: {
      type: DataTypes.ENUM('all', 'students', 'teachers'),
      defaultValue: 'all'
    },
    priority: {
      type: DataTypes.ENUM('high', 'normal', 'low'),
      defaultValue: 'normal'
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Announcement;
};
```

---

## 11-14. REMAINING MODELS (Brief References)

### TODO MODEL
```javascript
{
  user_id (FK to Users), title, description, due_date, completed (BOOLEAN),
  created_at, updated_at
}
// Index: user_id
```

### NOTIFICATION MODEL
```javascript
{
  user_id (FK), message, type (ENUM), reference_id, read (BOOLEAN),
  created_at
}
// Index: (user_id, read) - for filtering unread notifications
```

### EVENT MODEL
```javascript
{
  title, description, event_date, location, event_type,
  created_by (FK to Users), created_at, updated_at
}
```

### ODAPPLICATION MODEL
```javascript
{
  student_id (FK), start_date, end_date, reason, status (ENUM),
  approved_by (FK), remarks, created_at, updated_at
}
// Index: student_id, status
```

---

## Common Query Patterns: MongoDB → Sequelize

### Find One
```javascript
// MongoDB
const user = await User.findOne({ email });

// Sequelize
const user = await User.findOne({ where: { email } });
```

### Find with Filter
```javascript
// MongoDB
const courses = await Course.find({ 'batches.teacher_id': teacherId });

// Sequelize (with association)
const courses = await Course.findAll({
  include: [{
    model: CourseBatchTeacher,
    where: { teacher_id: teacherId }
  }]
});
```

### Populate/Include Relations
```javascript
// MongoDB
const user = await User.findById(id).populate('batch_id');

// Sequelize
const user = await User.findByPk(id, {
  include: ['Batch']
});
```

### Create
```javascript
// MongoDB
const user = await User.create(data);

// Sequelize
const user = await User.create(data);
```

### Update
```javascript
// MongoDB
await Assignment.findByIdAndUpdate(id, updateData);

// Sequelize
await Assignment.update(updateData, { where: { id } });
```

### Delete
```javascript
// MongoDB
await Course.findByIdAndDelete(id);

// Sequelize
await Course.destroy({ where: { id } });
```

### Count
```javascript
// MongoDB
const count = await User.countDocuments({ role: 'student' });

// Sequelize
const count = await User.count({ where: { role: 'student' } });
```

### Aggregate
```javascript
// MongoDB
const stats = await Marks.aggregate([
  { $match: { course_id: courseId } },
  { $group: { _id: null, avg: { $avg: '$marks' } } }
]);

// Sequelize (with raw SQL or sequelize.fn)
const stats = await Marks.findAll({
  attributes: [
    [sequelize.fn('AVG', sequelize.col('marks')), 'avg']
  ],
  where: { course_id: courseId },
  raw: true
});
```

---

## Summary Checklist

Before starting migration:
- [ ] All models documented
- [ ] All relationships mapped
- [ ] Response transformations planned (especially for nested structures)
- [ ] Complex queries identified
- [ ] Unique constraints documented
- [ ] Indexes defined
- [ ] Migration script outlined
- [ ] Team reviewed schema

---

**Version** 1.0  
**Last Updated**: March 23, 2026  
**Next Update**: After Phase 1 model creation
