const propertyRepository = require('../repositories/propertyRepository');
const userRepository = require('../repositories/userRepository');
const appEvents = require('../events/eventEmitter');
const DistanceFilter = require('../strategies/filtering/distanceFilter');
const logger = require('../utils/logger');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

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
      includeAveragePrice = false,
      ...filters
    } = queryParams;
    const shouldIncludeAveragePrice = toBoolean(includeAveragePrice);

    let properties = await propertyRepository.findByFilters(filters);
    const beforeFilter = properties.length;

    if (lat && lng && radiusKm) {
      properties = distanceFilter.filter(properties, { lat, lng, radiusKm });
      logger.debug('Distance filter applied', {
        beforeFilter,
        afterFilter: properties.length,
        radiusKm,
        lat,
        lng,
      });
    }

    if (sortBy === 'price') {
      properties.sort((a, b) => Number(a.monthlyRent) - Number(b.monthlyRent));
    } else if (sortBy === 'distance' && lat && lng) {
      properties.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = properties.slice(start, start + limitNum);
    const averageMonthlyRent = shouldIncludeAveragePrice ? calculateAverageMonthlyRent(properties) : undefined;

    logger.debug('Property search completed', {
      total: properties.length,
      returned: paginated.length,
      filters,
      includeAveragePrice: shouldIncludeAveragePrice,
    });

    return {
      properties: paginated,
      total: properties.length,
      page: pageNum,
      limit: limitNum,
      ...(shouldIncludeAveragePrice ? { averageMonthlyRent } : {}),
    };
  },

  async getById(id) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new NotFoundError('Property not found');
    return property;
  },

  async create(landlordId, data) {
    const user = await userRepository.findById(landlordId);
    if (!user) throw new NotFoundError('User not found');
    if (user.landlordVerification?.status !== 'VERIFIED') {
      throw new ForbiddenError('Landlord must be verified to create listings');
    }

    const { title, description, propertyType, monthlyRent, address, neighborhood, latitude, longitude, bedrooms, bathrooms } = data;
    if (!title || !description || !propertyType || !monthlyRent || !address || !neighborhood || latitude === undefined || longitude === undefined || !bedrooms || !bathrooms) {
      throw new ValidationError('Missing required property fields');
    }

    const property = await propertyRepository.create({ ...data, landlordId, status: 'ACTIVE' });
    appEvents.emit('property:created', {
      property,
      landlord: user,
      propertyId: property.id,
      landlordId,
    });
    logger.info('Property listing created', { propertyId: property.id, landlordId, title });
    return property;
  },

  async update(id, landlordId, data) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new NotFoundError('Property not found');
    if (property.landlordId !== landlordId) throw new ForbiddenError('Not your property');

    delete data.landlordId;
    delete data.status;

    const updated = await propertyRepository.update(id, data);
    logger.info('Property updated', { propertyId: id, landlordId });
    return updated;
  },

  async updateStatus(id, landlordId, status) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new NotFoundError('Property not found');
    if (property.landlordId !== landlordId) throw new ForbiddenError('Not your property');
    if (!['ACTIVE', 'RENTED', 'HIDDEN'].includes(status)) throw new ValidationError('Invalid status');

    const updated = await propertyRepository.updateStatus(id, status);
    logger.info('Property status updated', { propertyId: id, landlordId, status });
    return updated;
  },

  async softDelete(id, landlordId) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new NotFoundError('Property not found');
    if (property.landlordId !== landlordId) throw new ForbiddenError('Not your property');

    await propertyRepository.updateStatus(id, 'HIDDEN');
    logger.info('Property soft-deleted (hidden)', { propertyId: id, landlordId });
  },

  async getMyListings(landlordId) {
    return propertyRepository.findByLandlord(landlordId);
  },
};

module.exports = propertyService;
