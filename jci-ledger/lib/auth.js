import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

export function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '1d' }
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
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}
