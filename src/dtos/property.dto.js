function toPropertyDTO(property) {
  const ratings = property.reviews?.map((r) => r.rating) || [];
  const averageRating = ratings.length > 0
    ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
    : null;

  return {
    id: property.id,
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    status: property.status,
    monthlyRent: Number(property.monthlyRent),
    depositAmount: property.depositAmount ? Number(property.depositAmount) : null,
    includesUtilities: property.includesUtilities,
    address: property.address,
    neighborhood: property.neighborhood,
    city: property.city,
    latitude: property.latitude,
    longitude: property.longitude,
    sizeM2: property.sizeM2,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    furnished: property.furnished,
    petFriendly: property.petFriendly,
    hasParking: property.hasParking,
    hasLaundry: property.hasLaundry,
    hasWifi: property.hasWifi,
    imageUrls: property.imageUrls,
    landlord: property.landlord
      ? {
          id: property.landlord.id,
          firstName: property.landlord.firstName,
          lastName: property.landlord.lastName,
          profilePictureUrl: property.landlord.profilePictureUrl || null,
          isVerified: property.landlord.landlordVerification?.status === 'VERIFIED',
        }
      : null,
    averageRating,
    reviewCount: ratings.length,
    publishedAt: property.publishedAt,
    createdAt: property.createdAt,
  };
}

function toPropertyDetailDTO(property) {
  const dto = toPropertyDTO(property);
  dto.reviews = (property.reviews || []).map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    author: r.author,
    createdAt: r.createdAt,
  }));
  return dto;
}

module.exports = { toPropertyDTO, toPropertyDetailDTO };
