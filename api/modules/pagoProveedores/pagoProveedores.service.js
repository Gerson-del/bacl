const { CustomError } = require("../../../middleware/errorHandler");
const repository = require("./pagoProveedores.repository");
const { idSchema, createSchema, updateSchema } = require("./pagoProveedores.schema");

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

class PagoProveedoresService {
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

    const pago = await repository.findById(validId, conn);

    if (!pago) {
      throw new CustomError(
        `Pago con id ${validId} no encontrado`,
        404,
        "PAGO_NOT_FOUND",
      );
    }

    return pago;
  }

  /**
   * @param {number} idSolicitudProveedor
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async getBySolicitud(idSolicitudProveedor, conn = null) {
    const validId = validate(idSchema, idSolicitudProveedor);
    return repository.findBySolicitud(validId, conn);
  }

  /**
   * @param {number} idPagoDispersion
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async getByDispersion(idPagoDispersion, conn = null) {
    const validId = validate(idSchema, idPagoDispersion);
    return repository.findByDispersion(validId, conn);
  }

  /**
   * Crea un pago. Calcula `total = monto + iva` si no viene explícito.
   *
   * @param {object} data
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ insertId: number, data: object }>}
   */
  async create(data, conn = null) {
    const payload = validate(createSchema, data);

    if (payload.monto != null && payload.iva != null && payload.total == null) {
      payload.total = Number(payload.monto) + Number(payload.iva);
    }

    const { insertId } = await repository.create(payload, conn);
    return { insertId, data: payload };
  }

  /**
   * Actualiza campos. No permite modificar un pago cancelado.
   * Recalcula `total` si cambian `monto` o `iva`.
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

    if (current.estatus === "cancelada") {
      throw new CustomError(
        "No se puede modificar un pago cancelado",
        409,
        "PAGO_CANCELADO",
      );
    }

    if ("monto" in payload || "iva" in payload) {
      const monto = Number(payload.monto ?? current.monto ?? 0);
      const iva = Number(payload.iva ?? current.iva ?? 0);
      payload.total = monto + iva;
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
    return { message: `Pago ${validId} eliminado correctamente` };
  }

  /**
   * Cancela un pago. No permite cancelar uno ya cancelado.
   *
   * @param {number} id
   * @param {string} [userUpdate]
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object>}
   */
  async cancelar(id, userUpdate, conn = null) {
    const validId = validate(idSchema, id);

    const current = await this.getById(validId, conn);

    if (current.estatus === "cancelada") {
      throw new CustomError(
        `El pago ${validId} ya está cancelado`,
        409,
        "PAGO_YA_CANCELADO",
      );
    }

    return repository.cancelar(validId, userUpdate, conn);
  }
}

module.exports = new PagoProveedoresService();
