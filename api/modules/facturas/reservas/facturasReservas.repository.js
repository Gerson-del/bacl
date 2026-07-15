const { getExecutor } = require("../../../../config/db");

class FacturasReservasRepository {
  /**
   * @param {string} id_factura
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async findByFactura(id_factura, conn = null) {
    const run = getExecutor(conn);
    return run(
      `
      SELECT
        SUM(fi.monto)          AS monto_asignado,
        fi.id_relacion,
        vw.id_booking,
        vw.id_agente,
        vw.nombre_agente,
        vw.id_confirmacion     AS codigo_confirmacion,
        vw.proveedor,
        vw.total,
        vw.nombre_viajero
      FROM items_facturas fi
        LEFT JOIN vw_details_booking vw ON vw.id_relacion = fi.id_relacion
      WHERE fi.id_factura = ?
      GROUP BY fi.id_relacion
      `,
      [id_factura],
    );
  }
}

module.exports = new FacturasReservasRepository();
