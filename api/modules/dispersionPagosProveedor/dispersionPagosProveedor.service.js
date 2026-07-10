/**
 * @fileoverview Servicio para dispersion_pagos_proveedor.
 *
 * Valida el formato de entrada con Zod y aplica las reglas de negocio.
 * Acepta `conn` opcional en todos los métodos para participar en
 * transacciones externas coordinadas por un orchestrator.
 */

const { CustomError } = require("../../../middleware/errorHandler");
const repository = require("./dispersionPagosProveedor.repository");
const {
  idSchema,
  createSchema,
  updateSchema,
  registrarPagoSchema,
} = require("./dispersionPagosProveedor.schema");

/**
 * Valida `data` con el schema dado.
 * Convierte ZodError en CustomError para que errorHandler lo capture.
 *
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

class DispersionPagosProveedorService {
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

    const dispersion = await repository.findById(validId, conn);

    if (!dispersion) {
      throw new CustomError(
        `Dispersión con id ${validId} no encontrada`,
        404,
        "DISPERSION_NOT_FOUND",
      );
    }

    return dispersion;
  }

  /**
   * @param {number} idSolicitudProveedor
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async getBySolicitudProveedor(idSolicitudProveedor, conn = null) {
    const validId = validate(idSchema, idSolicitudProveedor);
    return repository.findBySolicitudProveedor(validId, conn);
  }

  /**
   * Crea una dispersión. Calcula saldo si viene monto_pagado.
   *
   * @param {object} data
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ insertId: number, data: object }>}
   */
  async create(data, conn = null) {
    const payload = validate(createSchema, data);

    if (payload.monto_pagado != null) {
      this.#validateMontoPagado(payload.monto_pagado, payload.monto_solicitado);
      payload.saldo = payload.monto_solicitado - payload.monto_pagado;
    }

    const { insertId } = await repository.create(payload, conn);
    return { insertId, data: payload };
  }

  /**
   * Actualiza campos de una dispersión. Recalcula saldo si cambian los montos.
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

    if ("monto_solicitado" in payload || "monto_pagado" in payload) {
      const montoSolicitado = payload.monto_solicitado ?? Number(current.monto_solicitado);
      const montoPagado = payload.monto_pagado ?? Number(current.monto_pagado ?? 0);

      this.#validateMontoPagado(montoPagado, montoSolicitado);
      payload.saldo = montoSolicitado - montoPagado;
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
    return { message: `Dispersión ${validId} eliminada correctamente` };
  }

  /**
   * Registra el pago de forma atómica. Valida que no supere el monto solicitado.
   *
   * @param {number} id
   * @param {object} pagoData
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object>}
   */
  async registrarPago(id, pagoData, conn = null) {
    const validId = validate(idSchema, id);
    const payload = validate(registrarPagoSchema, pagoData);

    const current = await this.getById(validId, conn);

    this.#validateMontoPagado(payload.monto_pagado, Number(current.monto_solicitado));

    return repository.registrarPago(
      validId,
      payload.monto_pagado,
      payload.url_comprobante,
      payload.codigo_dispersion,
      conn,
    );
  }

  // ─── Reglas de negocio ────────────────────────────────────────────────────

  /**
   * @param {number} montoPagado
   * @param {number} montoSolicitado
   */
  #validateMontoPagado(montoPagado, montoSolicitado) {
    if (montoPagado > montoSolicitado) {
      throw new CustomError(
        `monto_pagado (${montoPagado}) no puede ser mayor que monto_solicitado (${montoSolicitado})`,
        400,
        "AMOUNT_EXCEEDS_REQUESTED",
      );
    }
  }
}

module.exports = new DispersionPagosProveedorService();
