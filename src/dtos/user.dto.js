function toUserDTO(user) {
  const isVerified =
    user.role === 'STUDENT'
      ? user.studentVerification?.status === 'VERIFIED'
      : user.role === 'LANDLORD'
      ? user.landlordVerification?.status === 'VERIFIED'
      : true; // ADMIN always verified

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || null,
    role: user.role,
    profilePictureUrl: user.profilePictureUrl || null,
    isVerified,
    authProvider: user.authProvider,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

module.exports = { toUserDTO };
