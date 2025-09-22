module.exports = app => {
  const index = require("../controllers/index.controller.js");
  var router = require("express").Router();

  // Create a new Tutorial
  router.get("/", index.index);
  router.get("/error_codes", index.error_codes);
  router.post("/kmltest", index.kmltest);
  router.post("/pushtest", index.pushtest);
  router.post("/clear_redis_data", index.clear_redis_data);

  app.use('/', (req, res, next) => {
      next(); 
  },router);
};