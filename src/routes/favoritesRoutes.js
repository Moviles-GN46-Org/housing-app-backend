const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favoritesController");
const auth = require("../middleware/auth");

// All favorites routes require authentication
router.use(auth);

// Get all favorites for the current user
router.get("/", favoritesController.getFavorites);

// Get all favorite property IDs for quick checking
router.get("/ids/list", favoritesController.getFavoriteIds);

// Add a property to favorites
router.post("/:propertyId", favoritesController.addToFavorites);

// Remove a property from favorites
router.delete("/:propertyId", favoritesController.removeFromFavorites);

// Toggle favorite status
router.put("/:propertyId", favoritesController.toggleFavorite);

// Check if a property is in favorites
router.get("/:propertyId/check", favoritesController.isFavorited);

module.exports = router;
