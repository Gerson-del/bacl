const {
  executeQuery,
  getExecutor,
  runTransaction,
} = require("../../../config/db");

class DispersionPagosProveedorRepository {
  /** @type {string} */
  #table = "dispersion_pagos_proveedor";

  /**
   * Devuelve todas las dispersiones con filtros opcionales.
   *
   * @param {object} [filters={}]
   * @param {number} [filters.id_solicitud_proveedor]
   * @param {string} [filters.codigo_dispersion]
   * @param {string} [filters.fecha_inicio]  YYYY-MM-DD
   * @param {string} [filters.fecha_fin]     YYYY-MM-DD
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async findAll(filters = {}, conn = null) {
    const run = getExecutor(conn);

    const conditions = [];
    const params = [];

    if (filters.id_solicitud_proveedor) {
      conditions.push("id_solicitud_proveedor = ?");
      params.push(filters.id_solicitud_proveedor);
    }

    if (filters.codigo_dispersion) {
      conditions.push("codigo_dispersion = ?");
      params.push(filters.codigo_dispersion);
    }

    if (filters.fecha_inicio) {
      conditions.push("fecha_pago >= ?");
      params.push(filters.fecha_inicio);
    }

    if (filters.fecha_fin) {
      conditions.push("fecha_pago <= ?");
      params.push(filters.fecha_fin);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return run(
      `SELECT * FROM ${this.#table} ${where} ORDER BY created_at DESC`,
      params,
    );
  }

  /**
   * Busca una dispersión por su llave primaria.
   *
   * @param {number} id
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object|null>}
   */
  async findById(id, conn = null) {
    const run = getExecutor(conn);
    const rows = await run(
      `SELECT * FROM ${this.#table} WHERE id_dispersion_pagos_proveedor = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  /**
   * Devuelve todas las dispersiones de una solicitud de proveedor.
   *
   * @param {number} idSolicitudProveedor
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async findBySolicitudProveedor(idSolicitudProveedor, conn = null) {
    const run = getExecutor(conn);
    return run(
      `SELECT * FROM ${this.#table} WHERE id_solicitud_proveedor = ? ORDER BY created_at DESC`,
      [idSolicitudProveedor],
    );
  }

  /**
   * Inserta un nuevo registro de dispersión.
   *
   * @param {object} data
   * @param {number}  data.id_solicitud_proveedor  - requerido
   * @param {number}  data.monto_solicitado         - requerido
   * @param {number}  [data.saldo]
   * @param {number}  [data.monto_pagado]
   * @param {string}  [data.codigo_dispersion]
   * @param {string}  [data.fecha_pago]             YYYY-MM-DD
   * @param {string}  [data.url_comprobante]
   * @param {string}  [data.id_proveedor_cuenta]
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ insertId: number }>}
   */
  async create(data, conn = null) {
    const run = getExecutor(conn);

    const columns = [
      "id_solicitud_proveedor",
      "monto_solicitado",
      "saldo",
      "monto_pagado",
      "codigo_dispersion",
      "fecha_pago",
      "url_comprobante",
      "id_proveedor_cuenta",
    ];

    const values = columns.map((col) => data[col] ?? null);
    const placeholders = columns.map(() => "?").join(", ");

    const result = await run(
      `INSERT INTO ${this.#table} (${columns.join(", ")}) VALUES (${placeholders})`,
      values,
    );

    return { insertId: result.insertId };
  }

  /**
   * Actualiza los campos indicados. Solo toca las claves presentes en `data`.
   *
   * @param {number} id
   * @param {object} data  Campos a actualizar (parcial)
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ affectedRows: number }>}
   */
  async update(id, data, conn = null) {
    const run = getExecutor(conn);

    const updatableColumns = [
      "monto_solicitado",
      "saldo",
      "monto_pagado",
      "codigo_dispersion",
      "fecha_pago",
      "url_comprobante",
      "id_proveedor_cuenta",
    ];

    const fields = updatableColumns.filter((col) => col in data);
    const sets = fields.map((col) => `${col} = ?`).join(", ");
    const values = fields.map((col) => data[col]);

    const result = await run(
      `UPDATE ${this.#table} SET ${sets} WHERE id_dispersion_pagos_proveedor = ?`,
      [...values, id],
    );

    return { affectedRows: result.affectedRows };
  }

  /**
   * Elimina una dispersión por id.
   *
   * @param {number} id
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ affectedRows: number }>}
   */
  async delete(id, conn = null) {
    const run = getExecutor(conn);
    const result = await run(
      `DELETE FROM ${this.#table} WHERE id_dispersion_pagos_proveedor = ?`,
      [id],
    );
    return { affectedRows: result.affectedRows };
  }

  /**
   * Registra el pago y recalcula el saldo.
   *
   * Si recibe `conn` externa participa en esa transacción.
   * Si no, crea su propia transacción con FOR UPDATE para evitar race conditions.
   *
   * @param {number} id
   * @param {number} montoPagado
   * @param {string} [urlComprobante]
   * @param {string} [codigoDispersion]
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object>}
   */
  async registrarPago(
    id,
    montoPagado,
    urlComprobante,
    codigoDispersion,
    conn = null,
  ) {
    const inner = async (connection) => {
      // getExecutor funciona igual dentro de runTransaction:
      // connection es la misma que usaría para commit/rollback
      const run = getExecutor(connection);

      const rows = await run(
        `SELECT * FROM ${this.#table} WHERE id_dispersion_pagos_proveedor = ? FOR UPDATE`,
        [id],
      );

      const nuevoSaldo = Number(rows[0].monto_solicitado) - Number(montoPagado);

      await run(
        `UPDATE ${this.#table}
         SET monto_pagado = ?, saldo = ?, fecha_pago = CURDATE(),
             url_comprobante = ?, codigo_dispersion = ?
         WHERE id_dispersion_pagos_proveedor = ?`,
        [
          montoPagado,
          nuevoSaldo,
          urlComprobante ?? null,
          codigoDispersion ?? null,
          id,
        ],
      );

      const updated = await run(
        `SELECT * FROM ${this.#table} WHERE id_dispersion_pagos_proveedor = ?`,
        [id],
      );

      return updated[0];
    };

    // conn externa → participa sin abrir una nueva transacción
    // sin conn    → runTransaction maneja begin/commit/rollback
    return conn ? inner(conn) : runTransaction(inner);
  }
}

module.exports = new DispersionPagosProveedorRepository();
