module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        name1: { type: String, default: '' },
        name2: { type: String, default: '' },
        created_by: { type: String, default: '' },
        updated_by: { type: String, default: '' },
        is_online: { type: String, default: '' },
        number: { type: String, default: '' },
        phone: { type: Number, default: 1 },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false}
      },
      { timestamps: true }
    );

    const AmbulanceTypes = mongoose.model("ambulance_types", schema);
  
    return AmbulanceTypes;
  };