const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');

router.post('/', responseController.saveResponse);
router.get('/:formId', responseController.getResponsesByFormId);
router.delete('/:id', responseController.deleteResponseById);
router.delete('/form/:formId', responseController.deleteAllResponsesForForm);

module.exports = router;
