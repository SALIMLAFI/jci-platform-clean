import { getUserFromRequest } from './auth';
import dbConnect from './dbConnect';
import User from '../models/User';

/**
 * Middleware d'authentification pour les routes API
 * Vérifie le token JWT et retourne l'utilisateur authentifié
 * 
 * @param {Request} request - L'objet request Next.js
 * @returns {Promise<Object|null>} L'utilisateur authentifié ou null
 */
export async function authMiddleware(request) {
  const userPayload = getUserFromRequest(request);
  
  if (!userPayload) {
    return null;
  }

  await dbConnect();
  
  // Vérifier que l'utilisateur existe toujours
  const user = await User.findById(userPayload.id).select('-password');
  
  if (!user) {
    return null;
  }

  return user;
}

/**
 * Middleware qui protège les routes et renvoie une erreur 401 si non authentifié
 * 
 * @param {Request} request - L'objet request Next.js
 * @returns {Promise<Object>} L'utilisateur authentifié
 * @throws {Error} Si non authentifié
 */
export async function requireAuth(request) {
  const user = await authMiddleware(request);
  
  if (!user) {
    const error = new Error('Non authentifié');
    error.statusCode = 401;
    throw error;
  }

  return user;
}

/**
 * Middleware qui vérifie les rôles autorisés
 * 
 * @param {Request} request - L'objet request Next.js
 * @param {string[]} allowedRoles - Liste des rôles autorisés
 * @returns {Promise<Object>} L'utilisateur authentifié
 * @throws {Error} Si non authentifié ou rôle non autorisé
 */
export async function requireRole(request, allowedRoles) {
  const user = await requireAuth(request);
  
  if (!allowedRoles.includes(user.role)) {
    const error = new Error('Accès non autorisé');
    error.statusCode = 403;
    throw error;
  }

  return user;
}
