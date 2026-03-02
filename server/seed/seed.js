const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/User');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Marks = require('../models/Marks');
const Exam = require('../models/Exam');
const Announcement = require('../models/Announcement');
const ODApplication = require('../models/ODApplication');
const Todo = require('../models/Todo');
const Notification = require('../models/Notification');
const Event = require('../models/Event');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear all existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Batch.deleteMany({}),
      Course.deleteMany({}),
      Timetable.deleteMany({}),
      Attendance.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
      Marks.deleteMany({}),
      Exam.deleteMany({}),
      Announcement.deleteMany({}),
      ODApplication.deleteMany({}),
      Todo.deleteMany({}),
      Notification.deleteMany({}),
      Event.deleteMany({})
    ]);
    console.log('All collections cleared.');

    // ─── Create Admin ───
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@sriher.edu.in',
      password_hash: 'Admin@123', // pre-save hook will hash
      role: 'admin'
    });
    console.log('✓ Admin created');

    // ─── Create Teachers ───
    const teacher1 = await User.create({
      name: 'DAA Faculty',
      email: 'daa@sriher.edu.in',
      password_hash: 'teacher123',
      role: 'teacher'
    });
    const teacher2 = await User.create({
      name: 'Python Faculty',
      email: 'python@sriher.edu.in',
      password_hash: 'teacher123',
      role: 'teacher'
    });
    const teacher3 = await User.create({
      name: 'DBMS Faculty',
      email: 'dbms@sriher.edu.in',
      password_hash: 'teacher123',
      role: 'teacher'
    });
    console.log('✓ 3 Teachers created');

    // ─── Create Batch ───
    const batch = await Batch.create({
      name: 'B.Tech CSE 2024',
      year: 2024,
      department: 'Computer Science',
      teacher_id: teacher1._id
    });
    console.log('✓ Batch created');

    // ─── Create Students ───
    const students = [];
    for (let i = 1; i <= 10; i++) {
      const padded = String(i).padStart(3, '0');
      const student = await User.create({
        name: `Student ${padded}`,
        email: `e0324${padded}@sriher.edu.in`,
        password_hash: `E0324${padded}@24`, // pre-save hook will hash
        role: 'student',
        batch_id: batch._id
      });
      students.push(student);
    }
    console.log('✓ 10 Students created');

    // ─── Create Courses ───
    const course1 = await Course.create({
      name: 'Design and Analysis of Algorithms',
      code: 'CS301',
      description: 'Study of algorithm design techniques and analysis',
      credits: 4,
      department: 'Computer Science',
      batches: [
        { batch_id: batch._id, teacher_id: teacher1._id }
      ]
    });
    const course2 = await Course.create({
      name: 'Python Programming',
      code: 'CS302',
      description: 'Introduction to Python programming language',
      credits: 3,
      department: 'Computer Science',
      batches: [
        { batch_id: batch._id, teacher_id: teacher2._id }
      ]
    });
    console.log('✓ 2 Courses created');

    // ─── Create Timetable ───
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
    console.log('✓ Timetable created');

    console.log('\n════════════════════════════════════');
    console.log('  SEED COMPLETE — Default Credentials');
    console.log('════════════════════════════════════');
    console.log('Admin:   admin@sriher.edu.in / Admin@123');
    console.log('Teacher: daa@sriher.edu.in / teacher123');
    console.log('Teacher: python@sriher.edu.in / teacher123');
    console.log('Teacher: dbms@sriher.edu.in / teacher123');
    console.log('Student: e0324001@sriher.edu.in / E0324001@24');
    console.log('  ...through...');
    console.log('Student: e0324010@sriher.edu.in / E0324010@24');
    console.log('════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
