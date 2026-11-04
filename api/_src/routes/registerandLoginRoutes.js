const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const registerAndLoginController = require('../controllers/registerAndLoginController');

router.post('/register', registerAndLoginController.registerUser);
router.post('/login', registerAndLoginController.loginUser);

router.get('/profile', auth, registerAndLoginController.getProfile);
router.put('/profile', auth, registerAndLoginController.updateProfile);

module.exports = router;
