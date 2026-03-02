const router = require('express').Router();
const {
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/settings.controller');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
