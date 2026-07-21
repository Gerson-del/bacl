const router = require("express").Router();
const mia = require("./mia");

router.use("/mia", mia);

module.exports = router;
