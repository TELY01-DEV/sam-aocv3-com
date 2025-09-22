module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var schema = mongoose.Schema(
      {
        name1: { type: String, default: '' },
        name2: { type: String, default: '' },
        check_name: { type: String, default: '' },
        phone: { type: String, default: '' },
        is_panel: { type: String, default: '' },
        geofence: { type: [[Number]], default: [] },
        created_by: { type: String, default: '' },
        updated_by: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false}
      },
      { timestamps: true }
    );

    const AocZones = mongoose.model("aoc_zones", schema);
  
    return AocZones;
  };