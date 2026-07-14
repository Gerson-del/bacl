const { getExecutor } = require("../../../../config/db");

class FacturasItemsRepository {
  /**
   * @param {string[]} ids_relacion
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  /**
   * @param {{ id_item: string, id_factura: string, monto: number }} data
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ insertId: number }>}
   */
  async insert({ id_item, id_factura, monto }, conn = null) {
    const run = getExecutor(conn);
    const result = await run(
      `INSERT INTO items_facturas (id_item, id_factura, monto) VALUES (?, ?, ?)`,
      [id_item, id_factura, monto],
    );
    return { insertId: result.insertId };
  }

  async findPendientesByRelaciones(ids_relacion, conn = null) {
    const run = getExecutor(conn);
    const placeholders = ids_relacion.map(() => "?").join(", ");

    return run(
      `
      SELECT
        i.id_item,
        i.id_relacion,
        i.total,
        COALESCE(SUM(fi.monto), 0) AS monto_facturado,
        (i.total - COALESCE(SUM(fi.monto), 0)) AS monto_por_facturar
      FROM items i
        LEFT JOIN items_facturas fi ON fi.id_item = i.id_item
      WHERE i.id_relacion IN (${placeholders}) AND i.total > 0
      GROUP BY i.id_item
      HAVING monto_por_facturar > 0
      `,
      ids_relacion,
    );
  }
}

module.exports = new FacturasItemsRepository();
