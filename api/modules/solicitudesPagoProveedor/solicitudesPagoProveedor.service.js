const { CustomError } = require("../../../middleware/errorHandler");
const repository = require("./solicitudesPagoProveedor.repository");
const {
  idSchema,
  createSchema,
  updateSchema,
  actualizarEstadoSchema,
  actualizarEstatusPagosSchema,
} = require("./solicitudesPagoProveedor.schema");

/**
 * @template T
 * @param {import('zod').ZodSchema<T>} schema
 * @param {unknown} data
 * @returns {T}
 */
function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new CustomError(
      result.error.errors[0].message,
      400,
      "VALIDATION_ERROR",
      result.error.errors,
    );
  }
  return result.data;
}

class SolicitudesPagoProveedorService {
  /**
   * @param {object} [filters={}]
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async getAll(filters = {}, conn = null) {
    return repository.findAll(filters, conn);
  }

  /**
   * @param {number} id
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object>}
   */
  async getById(id, conn = null) {
    const validId = validate(idSchema, id);

    const solicitud = await repository.findById(validId, conn);

    if (!solicitud) {
      throw new CustomError(
        `Solicitud con id ${validId} no encontrada`,
        404,
        "SOLICITUD_NOT_FOUND",
      );
    }

    return solicitud;
  }

  /**
   * @param {number} idProveedor
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async getByProveedor(idProveedor, conn = null) {
    const validId = validate(idSchema, idProveedor);
    return repository.findByProveedor(validId, conn);
  }

  /**
   * Crea una solicitud. Calcula saldo y monto_por_facturar automáticamente.
   *
   * @param {object} data
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ insertId: number, data: object }>}
   */
  async create(data, conn = null) {
    const payload = validate(createSchema, data);

    const montoFacurado = Number(payload.monto_facturado ?? 0);

    // Negocio: monto_facturado no puede superar monto_solicitado al crear
    this.#validateMontoFaturado(montoFacurado, payload.monto_solicitado);

    payload.saldo = payload.monto_solicitado - montoFacurado;
    payload.monto_por_facturar = payload.monto_solicitado - montoFacurado;

    const { insertId } = await repository.create(payload, conn);
    return { insertId, data: payload };
  }

  /**
   * Actualiza campos. Recalcula saldo y monto_por_facturar si cambian montos.
   *
   * @param {number} id
   * @param {object} data
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object>}
   */
  async update(id, data, conn = null) {
    const validId = validate(idSchema, id);
    const payload = validate(updateSchema, data);

    const current = await this.getById(validId, conn);

    if ("monto_solicitado" in payload || "monto_facturado" in payload) {
      const montoSolicitado = Number(payload.monto_solicitado ?? current.monto_solicitado);
      const montoFacturado = Number(payload.monto_facturado ?? current.monto_facturado ?? 0);

      this.#validateMontoFaturado(montoFacturado, montoSolicitado);

      payload.saldo = montoSolicitado - montoFacturado;
      payload.monto_por_facturar = montoSolicitado - montoFacturado;
    }

    await repository.update(validId, payload, conn);
    return this.getById(validId, conn);
  }

  /**
   * @param {number} id
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ message: string }>}
   */
  async delete(id, conn = null) {
    const validId = validate(idSchema, id);
    await this.getById(validId, conn);
    await repository.delete(validId, conn);
    return { message: `Solicitud ${validId} eliminada correctamente` };
  }

  /**
   * Cambia el estado_solicitud. Valida que no se reactive una solicitud CANCELADA.
   *
   * @param {number} id
   * @param {object} data  { estado_solicitud, usuario_edit? }
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object>}
   */
  async actualizarEstado(id, data, conn = null) {
    const validId = validate(idSchema, id);
    const payload = validate(actualizarEstadoSchema, data);

    const current = await this.getById(validId, conn);

    if (current.estado_solicitud === "CANCELADA" && payload.estado_solicitud !== "CANCELADA") {
      throw new CustomError(
        "No se puede reactivar una solicitud cancelada",
        409,
        "INVALID_STATE_TRANSITION",
      );
    }

    return repository.actualizarEstados(validId, payload, conn);
  }

  /**
   * Cambia el estatus_pagos.
   *
   * @param {number} id
   * @param {object} data  { estatus_pagos, usuario_edit? }
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object>}
   */
  async actualizarEstatusPagos(id, data, conn = null) {
    const validId = validate(idSchema, id);
    const payload = validate(actualizarEstatusPagosSchema, data);

    await this.getById(validId, conn);

    return repository.actualizarEstados(validId, payload, conn);
  }

  // ─── Reglas de negocio ────────────────────────────────────────────────────

  /**
   * @param {number} montoFacturado
   * @param {number} montoSolicitado
   */
  #validateMontoFaturado(montoFacturado, montoSolicitado) {
    if (montoFacturado > montoSolicitado) {
      throw new CustomError(
        `monto_facturado (${montoFacturado}) no puede ser mayor que monto_solicitado (${montoSolicitado})`,
        400,
        "AMOUNT_EXCEEDS_REQUESTED",
      );
    }
  }
}

module.exports = new SolicitudesPagoProveedorService();
