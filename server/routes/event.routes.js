const router = require('express').Router();
const { getEvents, createEvent } = require('../controllers/event.controller');
const { protect } = require('../middleware/auth');
const { isTeacherOrAdmin } = require('../middleware/role');

router.get('/', protect, getEvents);
router.post('/', protect, isTeacherOrAdmin, createEvent);

module.exports = router;
