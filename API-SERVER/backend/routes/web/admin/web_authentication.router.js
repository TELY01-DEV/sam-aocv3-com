module.exports = (app) => {
  const web_authentication = require("../../../controllers/web/admin/web_authentication.controller");

  var router = require("express").Router();

  router.post("/signIn", web_authentication.signIn);
  router.post("/signOut", web_authentication.signOut);

  app.use(
    "/api/master",
    (req, res, next) => {
      next();
    },
    router
  );
};
