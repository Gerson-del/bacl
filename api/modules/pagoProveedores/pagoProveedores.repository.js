const { getExecutor, runTransaction } = require("../../../config/db");

class PagoProveedoresRepository {
  #table = "pago_proveedores";

  /**
   * @param {object} [filters={}]
   * @param {number}  [filters.id_solicitud_proveedor]
   * @param {number}  [filters.id_pago_dispersion]
   * @param {string}  [filters.estatus]
   * @param {string}  [filters.codigo_dispersion]
   * @param {string}  [filters.origen_pago]
   * @param {string}  [filters.fecha_inicio]  YYYY-MM-DD
   * @param {string}  [filters.fecha_fin]     YYYY-MM-DD
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

    if (filters.id_pago_dispersion) {
      conditions.push("id_pago_dispersion = ?");
      params.push(filters.id_pago_dispersion);
    }

    if (filters.estatus) {
      conditions.push("estatus = ?");
      params.push(filters.estatus);
    }

    if (filters.codigo_dispersion) {
      conditions.push("codigo_dispersion = ?");
      params.push(filters.codigo_dispersion);
    }

    if (filters.origen_pago) {
      conditions.push("origen_pago = ?");
      params.push(filters.origen_pago);
    }

    if (filters.fecha_inicio) {
      conditions.push("DATE(fecha_pago) >= ?");
      params.push(filters.fecha_inicio);
    }

    if (filters.fecha_fin) {
      conditions.push("DATE(fecha_pago) <= ?");
      params.push(filters.fecha_fin);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return run(
      `SELECT * FROM ${this.#table} ${where} ORDER BY fecha_emision DESC`,
      params,
    );
  }

  /**
   * @param {number} id
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object|null>}
   */
  async findById(id, conn = null) {
    const run = getExecutor(conn);
    const rows = await run(
      `SELECT * FROM ${this.#table} WHERE id_pago_proveedores = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  /**
   * @param {number} idSolicitudProveedor
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async findBySolicitud(idSolicitudProveedor, conn = null) {
    const run = getExecutor(conn);
    return run(
      `SELECT * FROM ${this.#table} WHERE id_solicitud_proveedor = ? ORDER BY fecha_emision DESC`,
      [idSolicitudProveedor],
    );
  }

  /**
   * @param {number} idPagoDispersion
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async findByDispersion(idPagoDispersion, conn = null) {
    const run = getExecutor(conn);
    return run(
      `SELECT * FROM ${this.#table} WHERE id_pago_dispersion = ? ORDER BY fecha_emision DESC`,
      [idPagoDispersion],
    );
  }

  /**
   * @param {object} data
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ insertId: number }>}
   */
  async create(data, conn = null) {
    const run = getExecutor(conn);

    const columns = [
      "id_pago_dispersion",
      "id_solicitud_proveedor",
      "codigo_dispersion",
      "monto_pagado",
      "fecha_pago",
      "url_pdf",
      "monto_facturado",
      "url_factura",
      "id_factura",
      "user_created",
      "numero_comprobante",
      "cuenta_origen",
      "cuenta_destino",
      "monto",
      "moneda",
      "concepto",
      "metodo_de_pago",
      "referencia_pago",
      "nombre_pagador",
      "rfc_pagador",
      "domicilio_pagador",
      "nombre_beneficiario",
      "domicilio_beneficiario",
      "descripcion",
      "iva",
      "total",
      "estatus",
      "origen_pago",
      "pago_proveedores",
      "razon_social",
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
   * @param {number} id
   * @param {object} data
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ affectedRows: number }>}
   */
  async update(id, data, conn = null) {
    const run = getExecutor(conn);

    const updatableColumns = [
      "codigo_dispersion",
      "monto_pagado",
      "fecha_pago",
      "url_pdf",
      "monto_facturado",
      "url_factura",
      "id_factura",
      "user_update",
      "numero_comprobante",
      "cuenta_origen",
      "cuenta_destino",
      "monto",
      "moneda",
      "concepto",
      "metodo_de_pago",
      "referencia_pago",
      "nombre_pagador",
      "rfc_pagador",
      "domicilio_pagador",
      "nombre_beneficiario",
      "domicilio_beneficiario",
      "descripcion",
      "iva",
      "total",
      "estatus",
      "origen_pago",
      "pago_proveedores",
      "razon_social",
    ];

    const fields = updatableColumns.filter((col) => col in data);
    const sets = fields.map((col) => `${col} = ?`).join(", ");
    const values = fields.map((col) => data[col]);

    const result = await run(
      `UPDATE ${this.#table} SET ${sets} WHERE id_pago_proveedores = ?`,
      [...values, id],
    );

    return { affectedRows: result.affectedRows };
  }

  /**
   * @param {number} id
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ affectedRows: number }>}
   */
  async delete(id, conn = null) {
    const run = getExecutor(conn);
    const result = await run(
      `DELETE FROM ${this.#table} WHERE id_pago_proveedores = ?`,
      [id],
    );
    return { affectedRows: result.affectedRows };
  }

  /**
   * Cancela un pago de forma atómica usando FOR UPDATE.
   *
   * @param {number} id
   * @param {string} [userUpdate]
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object>}
   */
  async cancelar(id, userUpdate, conn = null) {
    const inner = async (connection) => {
      const run = getExecutor(connection);

      await run(
        `SELECT id_pago_proveedores FROM ${this.#table} WHERE id_pago_proveedores = ? FOR UPDATE`,
        [id],
      );

      await run(
        `UPDATE ${this.#table} SET estatus = 'cancelada', user_update = ? WHERE id_pago_proveedores = ?`,
        [userUpdate ?? null, id],
      );

      const rows = await run(
        `SELECT * FROM ${this.#table} WHERE id_pago_proveedores = ?`,
        [id],
      );

      return rows[0];
    };

    return conn ? inner(conn) : runTransaction(inner);
  }
}

module.exports = new PagoProveedoresRepository();
