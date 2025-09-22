module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {
      id_number: { type: String, default: "" },
      name: { type: String, default: "" },
      remark: { type: String, default: "" },
      created_by: { type: String, default: "" },
      updated_by: { type: String, default: "" },
      isactive: { type: Number, default: 1 },
      isdeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
  );

  const AmbulanceEquipmentCatalogies = mongoose.model(
    "ambulance_equipment_catalogies",
    schema
  );

  return AmbulanceEquipmentCatalogies;
};
