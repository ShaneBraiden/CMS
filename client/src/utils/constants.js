export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

export const NAV_ITEMS = {
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: 'HiOutlineHome' },
    { label: 'Users', path: '/admin/users', icon: 'HiOutlineUsers' },
    { label: 'Batches', path: '/admin/batches', icon: 'HiOutlineCollection' },
    { label: 'Courses', path: '/courses', icon: 'HiOutlineBookOpen' },
    { label: 'Timetable', path: '/timetable', icon: 'HiOutlineCalendar' },
    { label: 'Attendance', path: '/admin/attendance', icon: 'HiOutlineClipboardCheck' },
    { label: 'Exams', path: '/exams', icon: 'HiOutlineDocumentText' },
    { label: 'Announcements', path: '/announcements', icon: 'HiOutlineSpeakerphone' },
    { label: 'Events', path: '/events', icon: 'HiOutlineCalendar' },
    { label: 'Analytics', path: '/analytics', icon: 'HiOutlineChartBar' },
    { label: 'Settings', path: '/settings', icon: 'HiOutlineCog' },
  ],
  teacher: [
    { label: 'Dashboard', path: '/dashboard', icon: 'HiOutlineHome' },
    { label: 'Courses', path: '/courses', icon: 'HiOutlineBookOpen' },
    { label: 'Assignments', path: '/assignments', icon: 'HiOutlineClipboard' },
    { label: 'Marks', path: '/marks', icon: 'HiOutlinePencil' },
    { label: 'Attendance', path: '/attendance', icon: 'HiOutlineClipboardCheck' },
    { label: 'Timetable', path: '/timetable', icon: 'HiOutlineCalendar' },
    { label: 'Exams', path: '/exams', icon: 'HiOutlineDocumentText' },
    { label: 'OD Requests', path: '/od/approvals', icon: 'HiOutlineBadgeCheck' },
    { label: 'Announcements', path: '/announcements', icon: 'HiOutlineSpeakerphone' },
    { label: 'Events', path: '/events', icon: 'HiOutlineCalendar' },
    { label: 'Analytics', path: '/analytics', icon: 'HiOutlineChartBar' },
    { label: 'Settings', path: '/settings', icon: 'HiOutlineCog' },
  ],
  student: [
    { label: 'Dashboard', path: '/dashboard', icon: 'HiOutlineHome' },
    { label: 'Courses', path: '/courses', icon: 'HiOutlineBookOpen' },
    { label: 'Assignments', path: '/assignments', icon: 'HiOutlineClipboard' },
    { label: 'Marks', path: '/marks', icon: 'HiOutlinePencil' },
    { label: 'Attendance', path: '/attendance', icon: 'HiOutlineClipboardCheck' },
    { label: 'Timetable', path: '/timetable', icon: 'HiOutlineCalendar' },
    { label: 'Exams', path: '/exams', icon: 'HiOutlineDocumentText' },
    { label: 'OD Apply', path: '/od', icon: 'HiOutlineBadgeCheck' },
    { label: 'Todos', path: '/todos', icon: 'HiOutlineCheckCircle' },
    { label: 'Announcements', path: '/announcements', icon: 'HiOutlineSpeakerphone' },
    { label: 'Events', path: '/events', icon: 'HiOutlineCalendar' },
    { label: 'Settings', path: '/settings', icon: 'HiOutlineCog' },
  ],
};

export const HOUR_LABELS = [
  '9–10 AM',
  '10–11 AM',
  '11–12 PM',
  '12–1 PM',
  '1–2 PM',
  '2–3 PM',
  '3–4 PM',
];
