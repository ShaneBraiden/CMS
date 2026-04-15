const { Event, User } = require('../models');

// @desc    Get events
// @route   GET /api/events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [{ model: User, as: 'creator', attributes: ['name'] }],
      order: [['event_date', 'ASC']]
    });

    const formatted = events.map(e => {
      const d = e.toJSON(); d._id = d.id;
      if (d.creator) { d.created_by = { _id: d.created_by, name: d.creator.name }; delete d.creator; }
      return d;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create event
// @route   POST /api/events
exports.createEvent = async (req, res) => {
  try {
    const { title, description, event_date, location, event_type } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const event = await Event.create({ title, description, event_date, location, event_type, created_by: req.user.id });
    const data = event.toJSON(); data._id = data.id;
    res.status(201).json({ success: true, data, message: 'Event created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
