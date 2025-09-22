const { body } = require('express-validator');
const db = require("../../../../config/db.config");


exports.validate = (req) => {
    switch (req) {
      
      case 'registerWebEjunApp': {
        return [ 
          body("device_code", "device_code: device_code doesn't exists.").exists(),
          body("mac_address", "mac_address:Mac Address doesn't exists.").exists()
        ]  
      }
      
    //   case 'postUserAppointmentDetail': {
    //     return [ 
    //       body("user_id", "user_id: User Id doesn't exists.").exists()
    //     ]  
    //   }
    }
  }