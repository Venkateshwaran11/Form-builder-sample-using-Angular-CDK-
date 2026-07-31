const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');

router.post('/', formController.saveOrUpdateForm);
router.get('/', formController.getAllForms);
router.get('/:id', formController.getFormById);
router.delete('/:name', formController.deleteForm);

module.exports = router;
