const { toUserDTO } = require('./user.dto');

function toAuthResponseDTO(user, accessToken, refreshToken) {
  return {
    user: toUserDTO(user),
    accessToken,
    refreshToken,
  };
}

module.exports = { toAuthResponseDTO };
