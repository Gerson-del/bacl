const router = require("express").Router();
const { getReservas } = require("../../controller/pagoProveedor.controller");

router.get("/reservas", getReservas);

module.exports = router;
