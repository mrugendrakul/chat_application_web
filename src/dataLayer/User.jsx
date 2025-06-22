function User({
  fcmToken = "",
  profilePic = "",
  password = "",
  uniqueId = "",
  username = "",
  docId = "",
  publicRSAKey = "",
  privateEncryptedRSAKey = "",
  salt = "",
  devicePrivateRSAKey = null,
  isMigrated = false
} = {}) {
  return {
    fcmToken,
    profilePic,
    password,
    uniqueId,
    username,
    docId,
    publicRSAKey,
    privateEncryptedRSAKey,
    salt,
    devicePrivateRSAKey,
    isMigrated
  };
}

export default User;