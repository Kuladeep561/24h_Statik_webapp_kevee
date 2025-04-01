const express = require("express");
const { userRegisterMiddleware, loginMiddleware } = require("./../utils/auth.js");

let router = express.Router();

router.post("/api/register", userRegisterMiddleware, (req, res) => {
  res.status(200).send({ auth: true, token: req.token, user: req.user });
});

router.post("/api/login", loginMiddleware, (req, res) => {
  res.status(200).send({ auth: true, token: req.token, user: req.user });
});

module.exports = router;
