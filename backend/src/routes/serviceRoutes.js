const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.get('/', serviceController.getServices);
router.get('/document-types', serviceController.getDocumentTypes);
router.get('/:serviceId/requirements', serviceController.getServiceRequirements);

module.exports = router;
