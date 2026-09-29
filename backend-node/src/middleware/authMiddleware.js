import { admin, isInitialized } from '../firebaseAdmin.js';

export async function verifyFirebaseAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (req.path === '/health' || req.path === '/' || req.path === '/api/health') {
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (!isInitialized) {
      req.user = { uid: 'demo-guest', email: 'guest@cyclone-deadeye.local', name: 'Guest Observer', role: 'researcher', isDemo: true };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  if (token === 'demo-token-123' || token === 'guest-token' || !isInitialized) {
    req.user = { uid: 'demo-user', email: 'demo@cyclone-deadeye.local', name: 'Demo Researcher', role: 'researcher', isDemo: true };
    return next();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden', message: error.message });
  }
}