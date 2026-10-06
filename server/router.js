const express = require("express");

const router = express.Router();

// ===================== SERVER STATUS =====================

router.get("/", (req, res) => {
  res
    .status(200)
    .send({
      response: "Server is up and running."
    });
});

// ===================== EXPORT =====================

module.exports = router;