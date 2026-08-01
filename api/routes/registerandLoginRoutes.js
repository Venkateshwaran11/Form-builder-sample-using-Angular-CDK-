const express = require('express')
const router = express.Router();
const auth=require('../middlewares/auth.middleware');
const registerAndLoginController = require('../controllers/registerAndLoginController');

router.post('/register',registerAndLoginController.registerUser);
router.post('/login',registerAndLoginController.loginUser);

router.get('/profile',auth,(req,res)=>{

    res.json({
        message:'Protected Data',
        user:req.user
    });

});
module.exports = router;