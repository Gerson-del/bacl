const { z } = require("zod");

const idSchema = z.number({ coerce: true }).int().positive("El id debe ser un entero positivo");

const ESTATUS = ["derivada", "cancelada", "activo"];

const createSchema = z.object({
  id_pago_dispersion: z.number({ coerce: true }).int().positive().optional(),
  id_solicitud_proveedor: z.number({ coerce: true }).int().positive().optional(),
  codigo_dispersion: z.string().max(45).optional(),
  monto_pagado: z.number().nonnegative().optional(),
  fecha_pago: z.string().datetime({ offset: true }).optional(),
  url_pdf: z.string().url().max(255).optional(),
  monto_facturado: z.number().nonnegative().optional(),
  url_factura: z.string().url().max(255).optional(),
  id_factura: z.string().max(45).optional(),
  user_created: z.string().max(255).optional(),
  numero_comprobante: z.string().max(255).optional(),
  cuenta_origen: z.string().max(45).optional(),
  cuenta_destino: z.string().max(45).optional(),
  monto: z.number().nonnegative().optional(),
  moneda: z.string().max(45).optional(),
  concepto: z.string().max(255).optional(),
  metodo_de_pago: z.string().max(45).optional(),
  referencia_pago: z.string().max(255).optional(),
  nombre_pagador: z.string().max(255).optional(),
  rfc_pagador: z.string().max(45).optional(),
  domicilio_pagador: z.string().optional(),
  nombre_beneficiario: z.string().max(255).optional(),
  domicilio_beneficiario: z.string().optional(),
  descripcion: z.string().optional(),
  iva: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  estatus: z.enum(ESTATUS).optional(),
  origen_pago: z.string().max(45).optional(),
  pago_proveedores: z.string().max(45).optional(),
  razon_social: z.string().max(45).optional(),
});

const updateSchema = z
  .object({
    codigo_dispersion: z.string().max(45).optional(),
    monto_pagado: z.number().nonnegative().optional(),
    fecha_pago: z.string().datetime({ offset: true }).optional(),
    url_pdf: z.string().url().max(255).optional(),
    monto_facturado: z.number().nonnegative().optional(),
    url_factura: z.string().url().max(255).optional(),
    id_factura: z.string().max(45).optional(),
    user_update: z.string().max(255).optional(),
    numero_comprobante: z.string().max(255).optional(),
    cuenta_origen: z.string().max(45).optional(),
    cuenta_destino: z.string().max(45).optional(),
    monto: z.number().nonnegative().optional(),
    moneda: z.string().max(45).optional(),
    concepto: z.string().max(255).optional(),
    metodo_de_pago: z.string().max(45).optional(),
    referencia_pago: z.string().max(255).optional(),
    nombre_pagador: z.string().max(255).optional(),
    rfc_pagador: z.string().max(45).optional(),
    domicilio_pagador: z.string().optional(),
    nombre_beneficiario: z.string().max(255).optional(),
    domicilio_beneficiario: z.string().optional(),
    descripcion: z.string().optional(),
    iva: z.number().nonnegative().optional(),
    total: z.number().nonnegative().optional(),
    estatus: z.enum(ESTATUS).optional(),
    origen_pago: z.string().max(45).optional(),
    pago_proveedores: z.string().max(45).optional(),
    razon_social: z.string().max(45).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

module.exports = { idSchema, createSchema, updateSchema, ESTATUS };
