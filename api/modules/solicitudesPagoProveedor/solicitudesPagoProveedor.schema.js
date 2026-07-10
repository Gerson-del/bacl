const { z } = require("zod");

const idSchema = z.number({ coerce: true }).int().positive("El id debe ser un entero positivo");

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)");

const FORMA_PAGO = ["credit", "transfer", "card", "link"];

const ESTADO_SOLICITUD = [
  "CARTA_ENVIADA",
  "PAGADO TARJETA",
  "TRANSFERENCIA_SOLICITADA",
  "PAGADO TRANSFERENCIA",
  "PAGADO LINK",
  "CUPON ENVIADO",
  "CANCELADA",
  "DISPERSION",
  "SOLICITADA",
];

const ESTATUS_PAGOS = ["enviado_a_pago", "pagado", "dispersado"];

const createSchema = z.object({
  monto_solicitado: z.number().positive(),
  id_proveedor: z.number().int().positive(),
  id_creador: z.string().min(1),
  fecha_solicitud: fecha.optional(),
  forma_pago_solicitada: z.enum(FORMA_PAGO).optional(),
  id_tarjeta_solicitada: z.string().uuid().optional(),
  usuario_solicitante: z.string().uuid().optional(),
  usuario_generador: z.string().uuid().optional(),
  comentarios: z.string().optional(),
  estado_solicitud: z.enum(ESTADO_SOLICITUD).optional(),
  estado_facturacion: z.string().max(45).optional(),
  estatus_pagos: z.enum(ESTATUS_PAGOS).optional(),
  monto_facturado: z.number().nonnegative().optional(),
  monto_por_facturar: z.number().nonnegative().optional(),
  comentario_CXP: z.string().optional(),
  consolidado: z.number().int().min(0).max(1).optional(),
  is_ajuste: z.number().int().min(0).max(1).optional(),
  comentario_ajuste: z.string().optional(),
  comentario_AP: z.string().max(45).optional(),
  notas_internas: z.string().max(45).optional(),
  id_booking: z.string().max(45).optional(),
  codigo_confirmacion: z.string().max(45).optional(),
  propina: z.number().int().min(0).max(1).optional(),
  monto_adicional: z.number().nonnegative().optional(),
  monto_original: z.number().nonnegative().optional(),
});

const updateSchema = z
  .object({
    fecha_solicitud: fecha.optional(),
    monto_solicitado: z.number().positive().optional(),
    monto_facturado: z.number().nonnegative().optional(),
    monto_por_facturar: z.number().nonnegative().optional(),
    monto_adicional: z.number().nonnegative().optional(),
    monto_original: z.number().nonnegative().optional(),
    forma_pago_solicitada: z.enum(FORMA_PAGO).optional(),
    id_tarjeta_solicitada: z.string().uuid().optional(),
    usuario_solicitante: z.string().uuid().optional(),
    usuario_generador: z.string().uuid().optional(),
    comentarios: z.string().optional(),
    estado_solicitud: z.enum(ESTADO_SOLICITUD).optional(),
    estado_facturacion: z.string().max(45).optional(),
    estatus_pagos: z.enum(ESTATUS_PAGOS).optional(),
    comentario_CXP: z.string().optional(),
    consolidado: z.number().int().min(0).max(1).optional(),
    is_ajuste: z.number().int().min(0).max(1).optional(),
    comentario_ajuste: z.string().optional(),
    comentario_AP: z.string().max(45).optional(),
    notas_internas: z.string().max(45).optional(),
    usuario_edit: z.string().max(45).optional(),
    id_booking: z.string().max(45).optional(),
    codigo_confirmacion: z.string().max(45).optional(),
    propina: z.number().int().min(0).max(1).optional(),
    id_enviado: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

const actualizarEstadoSchema = z.object({
  estado_solicitud: z.enum(ESTADO_SOLICITUD),
  usuario_edit: z.string().max(45).optional(),
});

const actualizarEstatusPagosSchema = z.object({
  estatus_pagos: z.enum(ESTATUS_PAGOS),
  usuario_edit: z.string().max(45).optional(),
});

module.exports = {
  idSchema,
  createSchema,
  updateSchema,
  actualizarEstadoSchema,
  actualizarEstatusPagosSchema,
  ESTADO_SOLICITUD,
  ESTATUS_PAGOS,
};
