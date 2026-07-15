const { getExecutor } = require("../../../../config/db");

class FacturasPagosRepository {
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
        SUM(fps.monto) AS monto_asignado,
        p.*
      FROM facturas_pagos_y_saldos fps
        LEFT JOIN pagos p ON fps.id_pago = p.id_pago
      WHERE fps.id_factura = ?
      GROUP BY fps.id_pago, fps.id_factura
      `,
      [id_factura],
    );
  }
}

module.exports = new FacturasPagosRepository();
