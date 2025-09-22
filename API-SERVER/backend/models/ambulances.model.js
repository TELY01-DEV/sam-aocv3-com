module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema(
      {
        name1: { type: String, default: '' },
        name2: { type: String, default: '' },
        number: { type: String, default: '' },
        ambulance_box_code: { type: String, unique: true, default: '' },
        profile_picture :{ type: String, default: '' },
        is_box_tracking :{type:Number,default :1},
        ambulance_phone: { type: String, default: '' },
        type_id: { type: String, default: '' },
        zone_id:ObjectId,
        hospital_id: ObjectId,
        is_online: { type: Number, default: 1 },
        isactive: { type: Number, default: 1 },
        isdeleted: {type: Boolean, default: false},
        ambulance_picture: {type: Boolean, default: false},
        medical_equipment_ids: [ObjectId]
      },
      { timestamps: true }
    );

    schema.index({ hospital_id: 1, isactive: 1, isdeleted: 1, ambulance_box_code: 1 });
    const Ambulances = mongoose.model("ambulances", schema);
  
    return Ambulances;
  };