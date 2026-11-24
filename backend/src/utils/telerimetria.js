/**
 * Al terminar cada petición, marca quién la hizo para contar usuarios activos en Azure.
 *
 * `req.usuario` lo pone el middleware `autenticar`; si no hay sesión no se marca nada.
 * Solo se envía el UUID y el rol: nunca nombre, correo ni token.
 */
function identificarUsuario(span, req) {
  if (!req.usuario) return;

  span.setAttributes({
    'enduser.pseudo.id': req.usuario.id, // llega a Application Insights como user_Id
    'timecheck.rol': req.usuario.rol,
  });
}

module.exports = { identificarUsuario };