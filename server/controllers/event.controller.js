const Event = require('../models/Event');

// @desc    Get events
// @route   GET /api/events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('created_by', 'name')
      .sort({ event_date: 1 });

    res.json({ success: true, data: events });
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

    const event = await Event.create({
      title,
      description,
      event_date,
      location,
      event_type,
      created_by: req.user._id
    });

    res.status(201).json({ success: true, data: event, message: 'Event created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
