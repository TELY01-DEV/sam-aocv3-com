module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var schema = mongoose.Schema(
      {
        full_name: { type: String, default: '' },
        name1: { type: String, default: '' },
        name2: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        province_id: ObjectId,
        district_id: ObjectId,
        subdistrict_id: ObjectId,
        password: { type: String, default: '' },
        image: { type: String, default: '' },
        address: { type: String, default: '' },
        voip_number: { type: String, default: '' },
        remark: { type: String, default: '' },
        contact_address: { type: String, default: '' },
        type: { type: String, default: '' },
        hospital_area_type: { type: String, default: '' },
        organization_code: { type: String, default: '' },
        zone_id: ObjectId,
        location: {
            lat: { type: Number, default: 0 },
            lon: { type: Number, default: 0 },
        },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false},
        created_by: { type: String, default: '' },
        updated_by: { type: String, default: '' },
      },
      { timestamps: true }
    );

    const Hospitals = mongoose.model("hospitals", schema);
    return Hospitals;
  };