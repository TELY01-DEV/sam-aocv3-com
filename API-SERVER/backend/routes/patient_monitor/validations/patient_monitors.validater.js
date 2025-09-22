const { body } = require('express-validator');

exports.validate = (req) => {
  switch (req) {
    case 'postPatientMonitorsDetail': {
      return [
        body("serial_number", "serial_number: Serial Number doesn't exists.").exists(),
        body("is_online", "is_online: is_online doesn't exists.").exists(),
      ]
    }
  }

}