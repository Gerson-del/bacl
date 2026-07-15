const { getExecutor } = require("../../../config/db");

class FacturasRepository {
  #table = "facturas";

  /**
   * @param {string} id_factura
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object|null>}
   */
  async findById(id_factura, conn = null) {
    const run = getExecutor(conn);
    const rows = await run(
      `SELECT id_factura, total, saldo, saldo_x_aplicar_items, estado FROM ${this.#table} WHERE id_factura = ?`,
      [id_factura],
    );
    return rows[0] ?? null;
  }


}

module.exports = new FacturasRepository();
