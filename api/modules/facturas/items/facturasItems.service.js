const { CustomError } = require("../../../../middleware/errorHandler");
const repository = require("./facturasItems.repository");

class FacturasItemsService {
  /**
   * @param {{ id_item: string, id_factura: string, monto: number }} data
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<{ insertId: number }>}
   */
  async asignarItemAFactura({ id_item, id_factura, monto }, conn = null) {
    if (!id_item || !id_factura) {
      throw new CustomError(
        "id_item e id_factura son requeridos",
        400,
        "VALIDATION_ERROR",
      );
    }

    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      throw new CustomError(
        "monto debe ser un número mayor a 0",
        400,
        "VALIDATION_ERROR",
      );
    }

    return repository.insert({ id_item, id_factura, monto: montoNum }, conn);
  }

  /**
   * @param {string|string[]} ids_relacion  Un id o array de ids
   * @param {import('mysql2/promise').PoolConnection} [conn]
   * @returns {Promise<object[]>}
   */
  async getPendientesByRelaciones(ids_relacion, conn = null) {
    const ids = Array.isArray(ids_relacion) ? ids_relacion : [ids_relacion];

    const validos = ids.map((id) => String(id ?? "").trim()).filter(Boolean);

    if (validos.length === 0) {
      throw new CustomError(
        "Se requiere al menos un id_relacion",
        400,
        "VALIDATION_ERROR",
      );
    }

    return repository.findPendientesByRelaciones(validos, conn);
  }
}

module.exports = new FacturasItemsService();
