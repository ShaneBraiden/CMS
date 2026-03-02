const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/settings
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password_hash')
      .populate('batch_id', 'name');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update profile (name only)
// @route   PUT /api/settings
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters' });
    }

    const user = await User.findById(req.user._id);
    user.name = name;
    await user.save();

    res.json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/settings/password
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(current_password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password_hash = new_password; // pre-save hook will hash
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
