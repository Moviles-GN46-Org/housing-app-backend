const propertyRepository = require("../repositories/propertyRepository");
const userRepository = require("../repositories/userRepository");
const appEvents = require("../events/eventEmitter");
const DistanceFilter = require("../strategies/filtering/distanceFilter");
const logger = require("../utils/logger");
const {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} = require("../utils/errors");

const distanceFilter = new DistanceFilter();

function toBoolean(value) {
  return value === true || value === 'true';
}

function calculateAverageMonthlyRent(properties) {
  if (!properties.length) return null;

  const totalRent = properties.reduce((sum, property) => sum + Number(property.monthlyRent), 0);
  return parseFloat((totalRent / properties.length).toFixed(2));
}

const propertyService = {
  async search(queryParams) {
    const {
      lat,
      lng,
      radiusKm,
      sortBy,
      page = 1,
      limit = 20,
      includeAveragePrice = false, //Nuevo param flag agregado
      ...filters
    } = queryParams;
    const shouldIncludeAveragePrice = toBoolean(includeAveragePrice);

    let properties = await propertyRepository.findByFilters(filters);
    const beforeFilter = properties.length;

    if (lat && lng && radiusKm) {
      properties = distanceFilter.filter(properties, { lat, lng, radiusKm });
      logger.debug("Distance filter applied", {
        beforeFilter,
        afterFilter: properties.length,
        radiusKm,
        lat,
        lng,
      });
    }

    if (sortBy === "price") {
      properties.sort((a, b) => Number(a.monthlyRent) - Number(b.monthlyRent));
    } else if (sortBy === "distance" && lat && lng) {
      properties.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = properties.slice(start, start + limitNum);
    const averageMonthlyRent = shouldIncludeAveragePrice ? calculateAverageMonthlyRent(properties) : undefined; //Lo calcula si la flag es true

    logger.debug('Property search completed', {
      total: properties.length,
      returned: paginated.length,
      filters,
      includeAveragePrice: shouldIncludeAveragePrice,
    });

    logger.debug("Property search completed", {
      total: properties.length,
      returned: paginated.length,
      filters,
    });
    return {
      properties: paginated,
      total: properties.length,
      page: pageNum,
      limit: limitNum,
      ...(shouldIncludeAveragePrice ? { averageMonthlyRent } : {}), //Aca retorna el promedio
    };
  },

  async getById(id) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new NotFoundError("Property not found");
    return property;
  },

  async create(landlordId, data) {
    const user = await userRepository.findById(landlordId);
    if (!user) throw new NotFoundError("User not found");
    if (user.landlordVerification?.status !== "VERIFIED") {
      throw new ForbiddenError("Landlord must be verified to create listings");
    }

    const {
      title,
      description,
      propertyType,
      monthlyRent,
      address,
      neighborhood,
      latitude,
      longitude,
      bedrooms,
      bathrooms,
    } = data;
    if (
      !title ||
      !description ||
      !propertyType ||
      !monthlyRent ||
      !address ||
      !neighborhood ||
      latitude === undefined ||
      longitude === undefined ||
      !bedrooms ||
      !bathrooms
    ) {
      throw new ValidationError("Missing required property fields");
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (
      !Number.isFinite(parsedLatitude) ||
      parsedLatitude < -90 ||
      parsedLatitude > 90
    ) {
      throw new ValidationError("latitude must be a number between -90 and 90");
    }

    if (
      !Number.isFinite(parsedLongitude) ||
      parsedLongitude < -180 ||
      parsedLongitude > 180
    ) {
      throw new ValidationError(
        "longitude must be a number between -180 and 180",
      );
    }

    const property = await propertyRepository.create({
      ...data,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      landlordId,
      status: "ACTIVE",
    });
    appEvents.emit("property:created", {
      property,
      landlord: user,
      propertyId: property.id,
      landlordId,
    });
    logger.info("Property listing created", {
      propertyId: property.id,
      landlordId,
      title,
    });
    return property;
  },

  async update(id, landlordId, data) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new NotFoundError("Property not found");
    if (property.landlordId !== landlordId)
      throw new ForbiddenError("Not your property");

    delete data.landlordId;
    delete data.status;

    const updated = await propertyRepository.update(id, data);
    logger.info("Property updated", { propertyId: id, landlordId });
    return updated;
  },

  async updateStatus(id, landlordId, status) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new NotFoundError("Property not found");
    if (property.landlordId !== landlordId)
      throw new ForbiddenError("Not your property");
    if (!["ACTIVE", "RENTED", "HIDDEN"].includes(status))
      throw new ValidationError("Invalid status");

    const updated = await propertyRepository.updateStatus(id, status);
    logger.info("Property status updated", {
      propertyId: id,
      landlordId,
      status,
    });
    return updated;
  },

  async softDelete(id, landlordId) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new NotFoundError("Property not found");
    if (property.landlordId !== landlordId)
      throw new ForbiddenError("Not your property");

    await propertyRepository.updateStatus(id, "HIDDEN");
    logger.info("Property soft-deleted (hidden)", {
      propertyId: id,
      landlordId,
    });
  },

  async getMyListings(landlordId) {
    return propertyRepository.findByLandlord(landlordId);
  },

  async getTopRatedNearby({ lat, lng, radiusKm, limit, minReviews }) {
    if (lat === undefined || lng === undefined || radiusKm === undefined) {
      throw new ValidationError("lat, lng and radiusKm are required");
    }

    const limitNum = Math.min(parseInt(limit) || 5, 20);
    const minReviewsNum = parseInt(minReviews) || 2;

    let properties = await propertyRepository.findAllActiveWithReviews();
    properties = distanceFilter.filter(properties, { lat, lng, radiusKm });

    const ranked = properties
      .map((p) => {
        const ratings = p.reviews.map((r) => r.rating);
        const reviewCount = ratings.length;
        const averageRating =
          reviewCount > 0
            ? ratings.reduce((a, b) => a + b, 0) / reviewCount
            : 0;
        return { ...p, averageRating, reviewCount };
      })
      .filter((p) => p.reviewCount >= minReviewsNum)
      .sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return b.reviewCount - a.reviewCount;
      })
      .slice(0, limitNum);

    logger.debug("Top-rated nearby search completed", {
      lat,
      lng,
      radiusKm,
      returned: ranked.length,
    });

    return ranked;
  },
};

module.exports = propertyService;
