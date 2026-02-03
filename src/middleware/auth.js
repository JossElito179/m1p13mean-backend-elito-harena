const { verifyToken } = require('../utils/jwt');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Accès refusé. Token manquant.'
    });
  }

  const token = authHeader.split(' ')[1];

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré.'
    });
  }

  req.user = decoded;
  next();
};

module.exports = auth;