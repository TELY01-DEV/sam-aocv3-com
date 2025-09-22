module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema(
      {
        name: { type: String, default: '' },
        brand: { type: String, default: '' },
        model: { type: String, default: '' },
        picture: { type: String, default: '' },
        image: { type: String, default: '' },
        remark: { type: String, default: '' },
        ambulance_equipment_catalogy_id: ObjectId,
        created_by: { type: String, default: '' },
        updated_by: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false}
      },
      { timestamps: true }
    );

    const AmbulanceServiceMaintenances = mongoose.model("ambulance_service_maintenances", schema);
  
    return AmbulanceServiceMaintenances;
  };