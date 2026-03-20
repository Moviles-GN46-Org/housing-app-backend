function toReviewDTO(review) {
  return {
    id: review.id,
    propertyId: review.propertyId,
    rating: review.rating,
    comment: review.comment,
    author: review.author,
    createdAt: review.createdAt,
  };
}

module.exports = { toReviewDTO };
