module.exports = app => {
  const index = require("../controllers/index.controller.js");
  var router = require("express").Router();

  // Create a new Tutorial
  router.get("/", index.index);
  router.get("/error_codes", index.error_codes);

  app.use('/', (req, res, next) => {
      next(); 
  },router);
};