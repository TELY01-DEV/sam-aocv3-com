module.exports = (app) => {
  const dashboard = require("../../../controllers/web/admin/dashboard.controller");

  var router = require("express").Router();

  router.post("/getDashboardDetail", dashboard.getDashboardDetails);

  app.use(
    "/api/dashboard",
    (req, res, next) => {
      next();
    },
    router
  );
};
