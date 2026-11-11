// En producción la URL llega al arrancar el contenedor (public/env-config.js);
// si no, se usa la del build o la local
const API_URL =
  window.__ENV__?.REACT_APP_API_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000/api';

export default API_URL;
