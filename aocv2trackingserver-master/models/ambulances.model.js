module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema(
      {
        name1: { type: String, default: '' },
        name2: { type: String, default: '' },
        number: { type: String, default: '' },
        ambulance_box_code: { type: String, unique: true, default: '' },
        ambulance_phone: { type: String, default: '' },
        type_id: { type: String, default: '' },
        zone_id: { type: String, default: '' },
        hospital_id: ObjectId,
        isactive: { type: Number, default: 1 },
        isonline: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false},
        ambulance_picture: {type: Boolean, default: false},
      },
      { timestamps: true }
    );

    const Ambulances = mongoose.model("ambulances", schema);
  
    return Ambulances;
  };