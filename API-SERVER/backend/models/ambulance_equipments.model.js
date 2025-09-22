module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema(
      {
        name: { type: String, default: '' },
        // brand: { type: String, default: '' },
        // model: { type: String, default: '' },
        profile_image: { type: String, default: '' },
        icon_image: { type: String, default: '' },
        remark: { type: String, default: '' },
        // ambulance_equipment_catalogy_id: ObjectId,
        // created_by: { type: String, default: '' },
        // updated_by: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false}
      },
      { timestamps: true }
    );

    const AmbulanceEquipments = mongoose.model("ambulance_equipments", schema);
  
    return AmbulanceEquipments;
  };