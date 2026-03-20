const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const { roleGuard, verifiedOnly } = require('../middleware/roleGuard');

// Property CRUD
router.get('/', auth, propertyController.search);
router.get('/my', auth, roleGuard('LANDLORD'), propertyController.getMyListings);
router.get('/:id', auth, propertyController.getById);
router.post('/', auth, roleGuard('LANDLORD'), verifiedOnly, propertyController.create);
router.put('/:id', auth, roleGuard('LANDLORD'), verifiedOnly, propertyController.update);
router.patch('/:id/status', auth, roleGuard('LANDLORD'), verifiedOnly, propertyController.updateStatus);
router.delete('/:id', auth, roleGuard('LANDLORD'), verifiedOnly, propertyController.softDelete);

// Reviews nested under properties
router.get('/:id/reviews', auth, reviewController.listForProperty);
router.post('/:id/reviews', auth, roleGuard('STUDENT'), verifiedOnly, reviewController.create);

module.exports = router;
