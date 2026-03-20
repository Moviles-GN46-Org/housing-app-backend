const reviewService = require('../services/reviewService');
const { toReviewDTO } = require('../dtos/review.dto');

const reviewController = {
  async listForProperty(req, res, next) {
    try {
      const reviews = await reviewService.listForProperty(req.params.id);
      res.json({ success: true, data: reviews.map(toReviewDTO) });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const review = await reviewService.create(req.params.id, req.user.userId, req.body);
      res.status(201).json({ success: true, data: toReviewDTO(review) });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reviewController;
