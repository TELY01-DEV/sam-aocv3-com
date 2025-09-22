module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var schema = mongoose.Schema(
      {
        province_id: ObjectId,
        district_id: ObjectId,
        code: { type: String, default: '' },
        name1: { type: String, default: '',index:true },
        name2: { type: String, default: '' ,index:true},
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false},
      },
      { timestamps: true }
    );

    schema.index({ province_id: 1, district_id: 1, isactive: 1, isdeleted: 1 });
    const SubDistricts = mongoose.model("subdistricts", schema);
    return SubDistricts;
  };