const { toPropertyDTO } = require("./property.dto");

function toFavoriteDTO(favorite) {
  return {
    id: favorite.id,
    propertyId: favorite.propertyId,
    userId: favorite.userId,
    property: favorite.property ? toPropertyDTO(favorite.property) : null,
    createdAt: favorite.createdAt,
  };
}

function toFavoritesListDTO(favorites) {
  return favorites.map(toFavoriteDTO);
}

module.exports = { toFavoriteDTO, toFavoritesListDTO };
