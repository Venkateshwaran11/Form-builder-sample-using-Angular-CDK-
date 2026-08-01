const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const auth = require('../middlewares/auth.middleware');

router.post('/', auth, formController.saveOrUpdateForm);
router.get('/',auth,  formController.getAllForms);
router.get('/:id', auth, formController.getFormById);
router.delete('/:name', auth, formController.deleteForm);

module.exports = router;
