const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { createBulkNotifications } = require('../utils/helpers');

// @desc    Get announcements
// @route   GET /api/announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('created_by', 'name')
      .sort({ created_at: -1 });

    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, target_audience, priority } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      created_by: req.user._id,
      created_by_name: req.user.name,
      target_audience: target_audience || 'all',
      priority: priority || 'normal'
    });

    // Create notifications for target audience
    let userQuery = {};
    if (target_audience === 'students') {
      userQuery = { role: 'student' };
    } else if (target_audience === 'teachers') {
      userQuery = { role: 'teacher' };
    }

    const users = await User.find(userQuery).select('_id');
    const userIds = users.map(u => u._id);
    await createBulkNotifications(
      userIds,
      `New announcement: "${title || content.substring(0, 50)}"`,
      'announcement',
      announcement._id
    );

    res.status(201).json({ success: true, data: announcement, message: 'Announcement posted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
exports.updateAnnouncement = async (req, res) => {
  try {
    const { title, content, target_audience, priority } = req.body;
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    announcement.title = title || announcement.title;
    announcement.content = content || announcement.content;
    announcement.target_audience = target_audience || announcement.target_audience;
    announcement.priority = priority || announcement.priority;
    await announcement.save();

    res.json({ success: true, data: announcement, message: 'Announcement updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
