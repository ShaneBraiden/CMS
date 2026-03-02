const router = require('express').Router();
const { getDashboard } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getDashboard);

module.exports = router;
