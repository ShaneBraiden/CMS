const router = require('express').Router();
const { login, register, logout, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
