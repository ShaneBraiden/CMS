require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { connectDB, sequelize } = require('../config/db');
const db = require('../models');

const {
  User, Batch, Course, CourseBatchTeacher,
  Timetable, TimetableSlot, Attendance, Marks, ODApplication
} = db;

// ─── Helpers ───
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const hashPassword = async (plain) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
};

// Given a JS Date, add N days and return YYYY-MM-DD
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const toDateOnly = (d) => d.toISOString().slice(0, 10);

// ─── Static data definitions ───
const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Saanvi', 'Myra', 'Aadhya', 'Aanya', 'Pari', 'Kiara', 'Riya', 'Sara',
  'Rohan', 'Kabir', 'Dhruv', 'Rahul', 'Priya', 'Neha', 'Pooja', 'Isha', 'Meera', 'Tara'
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Iyer', 'Reddy', 'Nair', 'Menon', 'Pillai', 'Kumar', 'Gupta', 'Singh',
  'Patel', 'Rao', 'Joshi', 'Mehta', 'Shetty', 'Das', 'Mishra', 'Agarwal', 'Chopra', 'Kapoor'
];

const COURSE_DEFS = [
  { name: 'Design and Analysis of Algorithms', code: 'CS301', credits: 4, faculty: 'DAA Faculty', email: 'daa@sriher.edu.in', short: 'DAA' },
  { name: 'Python Programming',                code: 'CS302', credits: 3, faculty: 'Python Faculty', email: 'python@sriher.edu.in', short: 'Python' },
  { name: 'Database Management Systems',       code: 'CS303', credits: 4, faculty: 'DBMS Faculty', email: 'dbms@sriher.edu.in', short: 'DBMS' },
  { name: 'Operating Systems',                 code: 'CS304', credits: 4, faculty: 'OS Faculty', email: 'os@sriher.edu.in', short: 'OS' },
  { name: 'Computer Networks',                 code: 'CS305', credits: 3, faculty: 'Networks Faculty', email: 'networks@sriher.edu.in', short: 'CN' },
  { name: 'Software Engineering',              code: 'CS306', credits: 3, faculty: 'SE Faculty', email: 'se@sriher.edu.in', short: 'SE' },
  { name: 'Web Technologies',                  code: 'CS307', credits: 3, faculty: 'Web Faculty', email: 'web@sriher.edu.in', short: 'Web' },
  { name: 'Machine Learning',                  code: 'CS308', credits: 4, faculty: 'ML Faculty', email: 'ml@sriher.edu.in', short: 'ML' },
  { name: 'Theory of Computation',             code: 'CS309', credits: 3, faculty: 'TOC Faculty', email: 'toc@sriher.edu.in', short: 'TOC' },
  { name: 'Cloud Computing',                   code: 'CS310', credits: 3, faculty: 'Cloud Faculty', email: 'cloud@sriher.edu.in', short: 'Cloud' }
];

const BATCH_DEFS = [
  { name: 'B.Tech CSE - 1st Year', year: '2025', prefix: 'e0125', department: 'Computer Science' },
  { name: 'B.Tech CSE - 2nd Year', year: '2024', prefix: 'e0224', department: 'Computer Science' },
  { name: 'B.Tech CSE - 3rd Year', year: '2023', prefix: 'e0323', department: 'Computer Science' },
  { name: 'B.Tech CSE - 4th Year', year: '2022', prefix: 'e0422', department: 'Computer Science' }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const ROOMS = ['CS-101', 'CS-102', 'CS-103', 'CS-104', 'Lab-1', 'Lab-2', 'Lab-3'];
const OD_REASONS = [
  'Representing college in inter-college hackathon',
  'Attending technical symposium at IIT',
  'Medical appointment',
  'Family function',
  'Participating in coding competition',
  'Cultural fest at partner college',
  'Workshop on AI/ML'
];

const seedDB = async () => {
  try {
    await connectDB();
    console.log('Connected to PostgreSQL for seeding...');

    await sequelize.sync({ force: true });
    console.log('Database synced (tables recreated).');

    // ─── Admin ───
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@sriher.edu.in',
      password_hash: 'Admin@123',
      role: 'admin'
    });
    console.log('✓ Admin created');

    // ─── Teachers (one per course) ───
    const teacherHash = await hashPassword('teacher123');
    const teacherRows = COURSE_DEFS.map(c => ({
      name: c.faculty,
      email: c.email,
      password_hash: teacherHash,
      role: 'teacher'
    }));
    const teachers = await User.bulkCreate(teacherRows, { returning: true });
    const teacherByEmail = Object.fromEntries(teachers.map(t => [t.email, t]));
    console.log(`✓ ${teachers.length} Teachers created`);

    // ─── Courses ───
    const courseRows = COURSE_DEFS.map(c => ({
      name: c.name,
      code: c.code,
      description: `${c.name} — core CSE course`,
      credits: c.credits,
      department: 'Computer Science'
    }));
    const courses = await Course.bulkCreate(courseRows, { returning: true });
    const courseByCode = Object.fromEntries(courses.map(c => [c.code, c]));
    console.log(`✓ ${courses.length} Courses created`);

    // ─── Batches ───
    const batches = [];
    for (let i = 0; i < BATCH_DEFS.length; i++) {
      const def = BATCH_DEFS[i];
      const leadTeacher = teachers[i % teachers.length];
      const batch = await Batch.create({
        name: def.name,
        year: def.year,
        department: def.department,
        teacher_id: leadTeacher.id
      });
      batches.push({ ...def, model: batch });
    }
    console.log(`✓ ${batches.length} Batches created`);

    // ─── Students (20 per batch) ───
    const studentHashCache = {};
    const allStudents = [];
    for (const b of batches) {
      const rows = [];
      for (let i = 1; i <= 20; i++) {
        const padded = String(i).padStart(3, '0');
        const fname = pick(FIRST_NAMES);
        const lname = pick(LAST_NAMES);
        const email = `${b.prefix}${padded}@sriher.edu.in`;
        const plainPwd = `${b.prefix.toUpperCase()}${padded}@24`;
        if (!studentHashCache[plainPwd]) {
          studentHashCache[plainPwd] = await hashPassword(plainPwd);
        }
        rows.push({
          name: `${fname} ${lname}`,
          email,
          password_hash: studentHashCache[plainPwd],
          role: 'student',
          batch_id: b.model.id
        });
      }
      const created = await User.bulkCreate(rows, { returning: true });
      b.students = created;
      allStudents.push(...created);
    }
    console.log(`✓ ${allStudents.length} Students created (20 per batch)`);

    // ─── Course-Batch-Teacher associations ───
    // Every batch takes every course
    const cbtRows = [];
    for (const b of batches) {
      for (const c of COURSE_DEFS) {
        cbtRows.push({
          course_id: courseByCode[c.code].id,
          batch_id: b.model.id,
          teacher_id: teacherByEmail[c.email].id
        });
      }
    }
    await CourseBatchTeacher.bulkCreate(cbtRows);
    console.log(`✓ ${cbtRows.length} Course-Batch-Teacher associations created`);

    // ─── Timetables (one per batch) ───
    const allSlots = [];
    for (const b of batches) {
      const timetable = await Timetable.create({ batch_id: b.model.id });
      // 5 days × 7 hours. First 5 hours = subjects, last 2 = Free.
      for (const day of DAYS) {
        // Pick 5 random distinct courses for the day
        const shuffled = [...COURSE_DEFS].sort(() => Math.random() - 0.5).slice(0, 5);
        for (let hour = 1; hour <= 7; hour++) {
          if (hour <= 5) {
            const c = shuffled[hour - 1];
            allSlots.push({
              timetable_id: timetable.id,
              day,
              hour,
              subject: c.short,
              faculty: c.faculty,
              room: pick(ROOMS)
            });
          } else {
            allSlots.push({
              timetable_id: timetable.id,
              day,
              hour,
              subject: 'Free',
              faculty: '',
              room: ''
            });
          }
        }
      }
    }
    await TimetableSlot.bulkCreate(allSlots);
    console.log(`✓ Timetables created (${allSlots.length} slots across ${batches.length} batches)`);

    // ─── Attendance: 80 working days per (student, course) ───
    // Build 80 dates going back from today, skipping weekends.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const workingDates = [];
    let cursor = addDays(today, -1);
    while (workingDates.length < 80) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) workingDates.push(new Date(cursor));
      cursor = addDays(cursor, -1);
    }
    workingDates.reverse();

    const attendanceRows = [];
    for (const b of batches) {
      for (const student of b.students) {
        for (const c of COURSE_DEFS) {
          const courseId = courseByCode[c.code].id;
          for (const d of workingDates) {
            // Generate hourly status for 7 periods: P, A, or N (not scheduled)
            // Student attends this course ~1-2 hours per day if scheduled
            const hourly = ['N', 'N', 'N', 'N', 'N', 'N', 'N'];
            // 70% chance the course appears on a given day, 1-2 hours
            if (Math.random() < 0.6) {
              const h1 = rand(0, 6);
              // 85% present
              hourly[h1] = Math.random() < 0.85 ? 'P' : 'A';
              if (Math.random() < 0.4) {
                let h2 = rand(0, 6);
                if (h2 === h1) h2 = (h2 + 1) % 7;
                hourly[h2] = Math.random() < 0.85 ? 'P' : 'A';
              }
            }
            const anyPresent = hourly.includes('P');
            const anyMarked = hourly.some(h => h !== 'N');
            if (!anyMarked) continue; // skip days where student had no class
            attendanceRows.push({
              student_id: student.id,
              course_id: courseId,
              date: toDateOnly(d),
              status: anyPresent ? 'present' : 'absent',
              hourly_status: hourly,
              marked_by: teacherByEmail[c.email].id,
              marked_at: new Date()
            });
          }
        }
      }
    }
    // Insert in chunks to avoid huge single query
    const CHUNK = 2000;
    for (let i = 0; i < attendanceRows.length; i += CHUNK) {
      await Attendance.bulkCreate(attendanceRows.slice(i, i + CHUNK), { ignoreDuplicates: true });
    }
    console.log(`✓ ${attendanceRows.length} Attendance records created`);

    // ─── Marks: CAT-1, CAT-2, Model per (student, course) ───
    const EXAM_TYPES = ['CAT-1', 'CAT-2', 'Model'];
    const marksRows = [];
    for (const b of batches) {
      for (const student of b.students) {
        for (const c of COURSE_DEFS) {
          const courseId = courseByCode[c.code].id;
          for (const et of EXAM_TYPES) {
            marksRows.push({
              student_id: student.id,
              course_id: courseId,
              exam_type: et,
              marks: rand(45, 98),
              max_marks: 100,
              date: toDateOnly(addDays(today, -rand(5, 70))),
              remarks: ''
            });
          }
        }
      }
    }
    for (let i = 0; i < marksRows.length; i += CHUNK) {
      await Marks.bulkCreate(marksRows.slice(i, i + CHUNK));
    }
    console.log(`✓ ${marksRows.length} Marks records created`);

    // ─── OD Applications: ~3 per batch ───
    const odRows = [];
    for (const b of batches) {
      for (let i = 0; i < 3; i++) {
        const student = pick(b.students);
        const start = addDays(today, -rand(1, 60));
        const end = addDays(start, rand(0, 3));
        const statusPick = pick(['pending', 'approved', 'approved', 'rejected']);
        odRows.push({
          student_id: student.id,
          start_date: toDateOnly(start),
          end_date: toDateOnly(end),
          reason: pick(OD_REASONS),
          status: statusPick,
          approved_by: statusPick === 'pending' ? null : admin.id,
          remarks: statusPick === 'rejected' ? 'Insufficient documentation' : ''
        });
      }
    }
    await ODApplication.bulkCreate(odRows);
    console.log(`✓ ${odRows.length} OD Applications created`);

    console.log('\n════════════════════════════════════');
    console.log('  SEED COMPLETE — Default Credentials');
    console.log('════════════════════════════════════');
    console.log('Admin:   admin@sriher.edu.in / Admin@123');
    console.log('Teachers (password: teacher123):');
    COURSE_DEFS.forEach(c => console.log(`  - ${c.email}`));
    console.log('Students (20 per batch, 4 batches = 80 total):');
    BATCH_DEFS.forEach(b => {
      console.log(`  ${b.name}: ${b.prefix}001@sriher.edu.in ... ${b.prefix}020@sriher.edu.in`);
      console.log(`    password pattern: ${b.prefix.toUpperCase()}<nnn>@24   (e.g. ${b.prefix.toUpperCase()}001@24)`);
    });
    console.log('════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
