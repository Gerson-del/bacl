/**
 * @fileoverview Schemas de validación Zod para dispersion_pagos_proveedor.
 *
 * Se usan como middleware `validateBody(schema)` en el router cuando
 * se agregue el controller. El service no los importa.
 */

const { z } = require("zod");

const idSchema = z.number({ coerce: true }).int().positive("El id debe ser un entero positivo");

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)");

const createSchema = z.object({
  id_solicitud_proveedor: z.number().int().positive(),
  monto_solicitado: z.number().positive(),
  monto_pagado: z.number().nonnegative().optional(),
  codigo_dispersion: z.string().max(45).optional(),
  fecha_pago: fecha.optional(),
  url_comprobante: z.string().url().optional(),
  id_proveedor_cuenta: z.string().max(45).optional(),
});

const updateSchema = z.object({
  monto_solicitado: z.number().positive().optional(),
  monto_pagado: z.number().nonnegative().optional(),
  codigo_dispersion: z.string().max(45).optional(),
  fecha_pago: fecha.optional(),
  url_comprobante: z.string().url().optional(),
  id_proveedor_cuenta: z.string().max(45).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Debe enviar al menos un campo para actualizar",
});

const registrarPagoSchema = z.object({
  monto_pagado: z.number().positive(),
  url_comprobante: z.string().url().optional(),
  codigo_dispersion: z.string().max(45).optional(),
});

module.exports = { idSchema, createSchema, updateSchema, registrarPagoSchema };
