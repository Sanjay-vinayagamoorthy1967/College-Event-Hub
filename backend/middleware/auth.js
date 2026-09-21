const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verification
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_here_for_event_hub_2026');
      
      req.user = {
        id: decoded.id,
        role: decoded.role,
        type: decoded.type
      };
      
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
const auth = protect;
module.exports.auth = auth;
