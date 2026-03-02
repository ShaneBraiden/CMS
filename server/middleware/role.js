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

const isTeacherOrAdmin = isTeacher;

module.exports = { isAdmin, isTeacher, isStudent, isTeacherOrAdmin };
