const { getExecutor } = require("../../../../config/db");

class FacturasSaldosRepository {
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
        s.*
      FROM facturas_pagos_y_saldos fps
        LEFT JOIN saldos_a_favor s ON fps.id_saldo_a_favor = s.id_saldos
      WHERE fps.id_factura = ?
      GROUP BY fps.id_saldo_a_favor, fps.id_factura
      `,
      [id_factura],
    );
  }
}

module.exports = new FacturasSaldosRepository();
