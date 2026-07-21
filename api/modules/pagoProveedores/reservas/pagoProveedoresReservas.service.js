const { CustomError } = require("../../../../middleware/errorHandler");
const repository = require("./pagoProveedoresReservas.repository");

class PagoProveedoresReservasService {
  /**
   * @param {object} [filters={}]
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async getAll(filters = {}, conn = null) {
    const page = filters.page !== undefined ? Number(filters.page) : undefined;
    const length =
      filters.length !== undefined ? Number(filters.length) : undefined;

    if (page !== undefined && (!Number.isFinite(page) || page < 1)) {
      throw new CustomError("page debe ser un número mayor a 0", 400, "VALIDATION_ERROR");
    }
    if (length !== undefined && (!Number.isFinite(length) || length < 1)) {
      throw new CustomError("length debe ser un número mayor a 0", 400, "VALIDATION_ERROR");
    }

    return repository.findAll(filters, conn);
  }
}

module.exports = new PagoProveedoresReservasService();
