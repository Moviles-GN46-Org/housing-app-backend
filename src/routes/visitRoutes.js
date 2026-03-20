const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const auth = require('../middleware/auth');

router.get('/', auth, visitController.list);
router.patch('/:id/status', auth, visitController.cancel);

module.exports = router;
