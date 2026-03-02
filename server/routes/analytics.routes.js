const router = require('express').Router();
const { getAnalytics } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth');

// All authenticated users can view analytics (role-based data returned)
router.get('/', protect, getAnalytics);

module.exports = router;
