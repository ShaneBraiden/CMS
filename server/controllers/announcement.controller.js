const { Announcement, User } = require('../models');
const { createBulkNotifications } = require('../utils/helpers');
const { Op } = require('sequelize');

// @desc    Get announcements
// @route   GET /api/announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      include: [{ model: User, as: 'creator', attributes: ['name'] }],
      order: [['created_at', 'DESC']]
    });

    const formatted = announcements.map(a => {
      const d = a.toJSON(); d._id = d.id;
      if (d.creator) { d.created_by = { _id: d.created_by, name: d.creator.name }; delete d.creator; }
      return d;
    });

    res.json({ success: true, data: formatted });
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
      title, content,
      created_by: req.user.id,
      created_by_name: req.user.name,
      target_audience: target_audience || 'all',
      priority: priority || 'normal'
    });

    // Create notifications for target audience
    let userWhere = {};
    if (target_audience === 'students') userWhere = { role: 'student' };
    else if (target_audience === 'teachers') userWhere = { role: 'teacher' };

    const users = await User.findAll({ where: userWhere, attributes: ['id'] });
    const userIds = users.map(u => u.id);
    await createBulkNotifications(
      userIds,
      `New announcement: "${title || content.substring(0, 50)}"`,
      'announcement',
      announcement.id
    );

    const data = announcement.toJSON(); data._id = data.id;
    res.status(201).json({ success: true, data, message: 'Announcement posted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
exports.updateAnnouncement = async (req, res) => {
  try {
    const { title, content, target_audience, priority } = req.body;
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (target_audience) updateData.target_audience = target_audience;
    if (priority) updateData.priority = priority;
    await announcement.update(updateData);

    const data = announcement.toJSON(); data._id = data.id;
    res.json({ success: true, data, message: 'Announcement updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    await announcement.destroy();
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
