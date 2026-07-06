import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

export function generateToken(user, rememberMe = false) {
  const expiresIn = rememberMe ? '30d' : '1d'; // 30 jours si remember me, sinon 1 jour
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, authProvider: user.authProvider, hasLocalPassword: user.hasLocalPassword },
    JWT_SECRET,
    { expiresIn }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getUserFromRequest(request) {
  // First try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    return verifyToken(token);
  }

  // Then try cookie
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    if (cookies.auth_token) {
      return verifyToken(cookies.auth_token);
    }
  }

  return null;
}

export function setAuthCookie(response, token, rememberMe = false) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 jours ou 1 jour en secondes
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/'
  });
}

export function clearAuthCookie(response) {
  response.cookies.delete('auth_token');
}
