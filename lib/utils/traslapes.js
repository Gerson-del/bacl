const { executeQuery } = require("../../config/db");

async function buscarTraslapes(id_viajero, check_in, check_out) {
  return await executeQuery(
    `SELECT id_confirmacion as codigo_confirmacion, check_in, check_out, type
     FROM vw_details_booking
     WHERE id_viajero = ?
       AND estado <> 'Cancelada'
       AND ? < check_out AND ? > check_in`,
    [id_viajero, check_in, check_out],
  );
}

module.exports = {
  buscarTraslapes,
};
