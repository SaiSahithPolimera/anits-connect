const express = require('express');
const router = express.Router();
const jobOpeningController = require('../controllers/jobOpeningController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, jobOpeningController.getAllOpenings);
router.post('/', authenticate, jobOpeningController.createOpening);
router.put('/:id', authenticate, jobOpeningController.updateOpening);
router.delete('/:id', authenticate, jobOpeningController.deleteOpening);

module.exports = router;
