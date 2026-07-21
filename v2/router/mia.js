const router = require("express").Router();
const pagoProveedor = require("./mia/pagoProveedor");

router.use("/pago_proveedor", pagoProveedor);

module.exports = router;
