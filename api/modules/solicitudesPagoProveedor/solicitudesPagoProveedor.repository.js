const { getExecutor, runTransaction } = require("../../../config/db");

class SolicitudesPagoProveedorRepository {
  #table = "solicitudes_pago_proveedor";

  /**
   * @param {object} [filters={}]
   * @param {number}  [filters.id_proveedor]
   * @param {string}  [filters.estado_solicitud]
   * @param {string}  [filters.estatus_pagos]
   * @param {string}  [filters.id_creador]
   * @param {number}  [filters.consolidado]
   * @param {string}  [filters.fecha_inicio]  YYYY-MM-DD
   * @param {string}  [filters.fecha_fin]     YYYY-MM-DD
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async findAll(filters = {}, conn = null) {
    const run = getExecutor(conn);
    const conditions = [];
    const params = [];

    if (filters.id_proveedor) {
      conditions.push("id_proveedor = ?");
      params.push(filters.id_proveedor);
    }

    if (filters.estado_solicitud) {
      conditions.push("estado_solicitud = ?");
      params.push(filters.estado_solicitud);
    }

    if (filters.estatus_pagos) {
      conditions.push("estatus_pagos = ?");
      params.push(filters.estatus_pagos);
    }

    if (filters.id_creador) {
      conditions.push("id_creador = ?");
      params.push(filters.id_creador);
    }

    if (filters.consolidado !== undefined) {
      conditions.push("consolidado = ?");
      params.push(filters.consolidado);
    }

    if (filters.fecha_inicio) {
      conditions.push("fecha_solicitud >= ?");
      params.push(filters.fecha_inicio);
    }

    if (filters.fecha_fin) {
      conditions.push("fecha_solicitud <= ?");
      params.push(filters.fecha_fin);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return run(
      `SELECT * FROM ${this.#table} ${where} ORDER BY created_at DESC`,
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
      `SELECT * FROM ${this.#table} WHERE id_solicitud_proveedor = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  /**
   * @param {number} idProveedor
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async findByProveedor(idProveedor, conn = null) {
    const run = getExecutor(conn);
    return run(
      `SELECT * FROM ${this.#table} WHERE id_proveedor = ? ORDER BY created_at DESC`,
      [idProveedor],
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
      "fecha_solicitud",
      "monto_solicitado",
      "saldo",
      "forma_pago_solicitada",
      "id_tarjeta_solicitada",
      "id_enviado",
      "usuario_solicitante",
      "usuario_generador",
      "comentarios",
      "estado_solicitud",
      "estado_facturacion",
      "estatus_pagos",
      "id_proveedor",
      "monto_facturado",
      "monto_por_facturar",
      "comentario_CXP",
      "id_creador",
      "consolidado",
      "is_ajuste",
      "comentario_ajuste",
      "comentario_AP",
      "notas_internas",
      "id_booking",
      "codigo_confirmacion",
      "propina",
      "monto_adicional",
      "monto_original",
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
   * @param {object} data  Campos a actualizar (parcial)
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ affectedRows: number }>}
   */
  async update(id, data, conn = null) {
    const run = getExecutor(conn);

    const updatableColumns = [
      "fecha_solicitud",
      "monto_solicitado",
      "saldo",
      "forma_pago_solicitada",
      "id_tarjeta_solicitada",
      "id_enviado",
      "usuario_solicitante",
      "usuario_generador",
      "comentarios",
      "estado_solicitud",
      "estado_facturacion",
      "estatus_pagos",
      "monto_facturado",
      "monto_por_facturar",
      "comentario_CXP",
      "consolidado",
      "is_ajuste",
      "comentario_ajuste",
      "comentario_AP",
      "notas_internas",
      "usuario_edit",
      "id_booking",
      "codigo_confirmacion",
      "propina",
      "monto_adicional",
      "monto_original",
    ];

    const fields = updatableColumns.filter((col) => col in data);
    const sets = fields.map((col) => `${col} = ?`).join(", ");
    const values = fields.map((col) => data[col]);

    const result = await run(
      `UPDATE ${this.#table} SET ${sets} WHERE id_solicitud_proveedor = ?`,
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
      `DELETE FROM ${this.#table} WHERE id_solicitud_proveedor = ?`,
      [id],
    );
    return { affectedRows: result.affectedRows };
  }

  /**
   * Actualiza estado_solicitud y estatus_pagos de forma atómica.
   * Útil para orchestrators que coordinan pagos.
   *
   * @param {number} id
   * @param {{ estado_solicitud?: string, estatus_pagos?: string, usuario_edit?: string }} campos
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object>}
   */
  async actualizarEstados(id, campos, conn = null) {
    const inner = async (connection) => {
      const run = getExecutor(connection);

      await run(
        `UPDATE ${this.#table}
         SET estado_solicitud  = COALESCE(?, estado_solicitud),
             estatus_pagos     = COALESCE(?, estatus_pagos),
             usuario_edit      = COALESCE(?, usuario_edit)
         WHERE id_solicitud_proveedor = ?`,
        [
          campos.estado_solicitud ?? null,
          campos.estatus_pagos ?? null,
          campos.usuario_edit ?? null,
          id,
        ],
      );

      const rows = await run(
        `SELECT * FROM ${this.#table} WHERE id_solicitud_proveedor = ?`,
        [id],
      );

      return rows[0];
    };

    return conn ? inner(conn) : runTransaction(inner);
  }
}

module.exports = new SolicitudesPagoProveedorRepository();
