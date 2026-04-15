const { User, Batch } = require('../models');
const generateToken = require('../utils/generateToken');

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        batch_id: user.batch_id
      },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, is_teacher, role: requestedRole } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide name, email and password' });
    }

    // Email domain restriction
    if (!email.toLowerCase().endsWith('@sriher.edu.in')) {
      return res.status(400).json({ success: false, error: 'Only @sriher.edu.in emails are allowed' });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Accept either `is_teacher: true` or `role: 'teacher'`. Teachers must be approved by admin.
    const wantsTeacher = is_teacher === true || requestedRole === 'teacher';
    const role = wantsTeacher ? 'pending_teacher' : 'student';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash: password, // beforeCreate hook will hash
      role
    });

    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        batch_id: user.batch_id
      },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
exports.logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Batch, as: 'batch', attributes: ['name'] }]
    });
    // Format response to include _id for frontend compatibility
    const userData = user.toJSON();
    userData._id = userData.id;
    if (userData.batch) {
      userData.batch_id = { _id: userData.batch_id, name: userData.batch.name };
    }
    delete userData.batch;
    res.json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
