function restoreCustomerSession(storage, axios) {
  if (!storage || typeof storage.getItem !== 'function') return null;

  const token = storage.getItem('token');
  const rawUser = storage.getItem('user');
  if (!token || !rawUser) return null;

  let user;
  try {
    user = JSON.parse(rawUser);
  } catch (_) {
    return null;
  }

  if (!user || typeof user !== 'object' || Array.isArray(user)) return null;

  if (axios && typeof axios.setHeader === 'function') {
    axios.setHeader('Authorization', `Bearer ${token}`);
  }

  return { token, user };
}

module.exports = restoreCustomerSession;
