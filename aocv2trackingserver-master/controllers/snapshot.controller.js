const { socket, redisClient } = require("../server");

var fs = require('fs');
const db = require("../config/db.config");
const configure = require("../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Ambulances = db.ambulances;
const AmbulanceImages = db.ambulance_images;
const AmbulanceImageHistories = db.ambulance_image_histories;

exports.postAmbulanceImageUpload = (req, res) => {
    var now = new Date(Date.now());
    var dir = '../public/uploads/ambulance_images/'+String(req.body.ambulance_id)+'/'+(now.getFullYear())+'/'+String(now.getMonth()+1)+'/'+String(now.getDate())+'/'+String(now.getHours() + '_' + now.getMinutes());

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if(req.files.length){
        var imagesObj = {};
        (req.files).map((key, i) => {
            configure.random(4, 'Number').then(async (ran) =>{ 
                var name = 'image' + i;
                imagesObj[name] = configure.fsUpload(dir+'/'+String(now.getMinutes() + '_' + now.getSeconds() + '_')+ran, key);
                imagesObj[name] = (imagesObj[name].split("/")).slice(1).join("/");
              	
                imagesObj[name] = imagesObj[name].replace("public/", "")
            })
        })

        Ambulances.findOne({ ambulance_box_code: String(req.body.ambulance_id) }).then((ambulance_data) => {
            if(ambulance_data){
                AmbulanceImages.findOne({ ambulance_id: ambulance_data._id}).then((ambulance_images_data) => {
                    if(ambulance_images_data){
                        var ambulance_image_histories = new AmbulanceImageHistories({
                            ambulance_id: ObjectId(ambulance_data._id),
                            images: ambulance_images_data.images,
                            createdAt: ambulance_images_data.createdAt
                        });
            
                        ambulance_image_histories
                        .save(ambulance_image_histories)
                        .then((ambulance_image_histories_data)=>{
                            AmbulanceImages.findOneAndUpdate({ '_id': ObjectId(ambulance_images_data._id)}, { $set: {
                                images: imagesObj,
                                ambulance_image_histories_id: ObjectId(ambulance_image_histories_data._id)
                            } }, { new: true }).then(ambulance_images_data => {
                                // redisClient.hmset(String(ambulance_data._id), 'ambulanceImagesDetail', JSON.stringify(ambulance_images_data));
								
                            }).catch((err)=> console.log(err));
                        }).catch(err=>{
                            console.log("Add image in History table error ", err)
                        })
                    } else {
                        var ambulance_images = new AmbulanceImages({
                            ambulance_id: ObjectId(ambulance_data._id),
                            images: imagesObj
                        });
            
                        ambulance_images
                        .save(ambulance_images)
                        .then()
                    }
					socket.emit("snap", {body:req.body,imagesObj:imagesObj});
                })
            }
        })
    }

    res.status(200).send();
}
