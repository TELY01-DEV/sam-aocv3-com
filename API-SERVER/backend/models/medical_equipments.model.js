module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        name: { type: String, default: '' },
        medical_equipment_image: { type: String, default: '' },
        icon_image: { type: String, default: '' },
        remark: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : { type: Boolean, default: false }
      },
      { timestamps: true }
    );

    const MedicalEquipments = mongoose.model("medical_equipments", schema);
  
    return MedicalEquipments;
  };