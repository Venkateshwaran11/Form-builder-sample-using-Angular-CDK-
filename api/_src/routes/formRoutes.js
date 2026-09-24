const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const auth = require('../middlewares/auth.middleware');

router.post('/', auth, formController.saveOrUpdateForm);
router.post('/draft', auth, formController.saveDraft);

router.get('/',auth,  formController.getAllForms);
router.get('/:id', auth, formController.getFormById);
router.get('/publicForms/:id', formController.getFormById);
router.delete('/:name', auth, formController.deleteForm);

// Versioning Endpoints
router.post('/:id/publish', auth, formController.publishVersion);
router.get('/:id/versions', auth, formController.getFormVersions);
router.get('/:id/versions/compare', auth, formController.compareVersions);
router.post('/:id/versions/:version/restore', auth, formController.restoreVersion);

module.exports = router;
