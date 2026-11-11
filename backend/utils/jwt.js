const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (user) => {
  const payload = {
    id: user.id,
    ficha: user.ficha,
    nombre: user.nombre,
    rol: user.rol,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiration,
  });
};

module.exports = {
  generateToken,
};
