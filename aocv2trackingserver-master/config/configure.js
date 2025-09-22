const fs = require('fs');
const https = require('https')
 
exports.getDistanceFromTwoLocation = function (fromLocation, toLocation) {
    return new Promise ((resolve)=> {
        var lat1 = fromLocation.lat;
        var lat2 = toLocation.lat;
        var lon1 = fromLocation.lon;
        var lon2 = toLocation.lon;

        var R = 6371; // km (change this constant to get miles)
        var dLat = ((lat2 - lat1) * (Math.PI/180));
        var dLon = ((lon2 - lon1) * (Math.PI/180));
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1) * (Math.PI/180)) * Math.cos((lat2) * (Math.PI/180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        resolve((R * c));
    }).catch(err=> {
        return(err);
    })
};

exports.random = (length, type) => {
    return new Promise((resolve) => {
        var result = '';
        switch (type) {
            case 'Number':
                var characters = '0123456789';
                break;

            case 'String':
                var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
                break;

            default:
                var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        }

        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        resolve(result);
    })
}

exports.fsUpload = (target, file) => {
    var mimetype = (file.originalname).split('.');
    var uploadPath = target + '.' + mimetype[1];

    try {
        if (fs.existsSync(uploadPath)) {
            fs.unlink(uploadPath, function (err) {
                if(err) console.log(err);
                fs.writeFile(uploadPath.toString(), file.buffer, function (err, resp) {
                    if(err) console.log(err);
                })
            })
        } else {
            fs.writeFile(uploadPath.toString(), file.buffer, function (err, resp) {
                if(err) console.log(err);
            })
        }
    } catch (err) {
        console.error(err)
    }

    return (target + '.' + mimetype[1]);
}

exports.sendPushnotification = (aoc_request_id,ambulance_id,notification_type)=>{
    const data = new TextEncoder().encode(
      JSON.stringify({
        aoc_request_id: aoc_request_id,
        ambulance_id:ambulance_id,
        notification_type:notification_type
      })
    )
    
    const options = {
      hostname: 'opera.aocv2.com',
      port: 443,
      path: '/api/notification/postAmbulanceSpeedNotification',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }
    
    const req = https.request(options, res => {
      res.on('data', d => {
        // process.stdout.write(d);
      })
    })
    
    req.on('error', error => {
      console.error(error);
    })
    
    req.write(data)
    req.end()

}