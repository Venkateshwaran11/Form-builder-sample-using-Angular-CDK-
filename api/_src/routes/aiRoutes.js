const express = require('express');
const auth = require('../middlewares/auth.middleware');
const router = express.Router();
const AIcontroller = require('../controllers/aiController')

router.post("/generate-form", auth, AIcontroller.callAIservice);
module.exports = router;
