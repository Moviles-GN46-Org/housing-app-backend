const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const auth = require('../middleware/auth');

router.post('/:propertyId', auth, favoriteController.toggleFavorite);
router.get('/', auth, favoriteController.listFavorites);

module.exports = router;
