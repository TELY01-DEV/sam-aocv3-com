module.exports = app => {
  const controller = require("../controllers/index.controller");
  var router = require("express").Router();

  // Create a new Tutorial
  router.get("/", controller.index);

  app.use('/', (req, res, next) => {
      next(); 
  },router);
};