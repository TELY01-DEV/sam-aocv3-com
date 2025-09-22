module.exports = mongoose => {
  var ObjectId = mongoose.Schema.Types.ObjectId;
  var Mixed = mongoose.Schema.Types.Mixed;
  var ModelIncrementSchema = mongoose.Schema({
    model: { type: String, required: true, index: { unique: true } },
    idx: { type: Number, default: 0 }
});
var ModelIncrementSchema = mongoose.model('ModelIncrementSchema', ModelIncrementSchema);
  var schema = mongoose.Schema(
    {
      request_code: { type: String, default: '' },
      creater_id: ObjectId,
      creater_type: ObjectId,
      request_type: { type: String, enum : ['EMS', 'REF', 'IN', 'OUT', 'BACK', 'OTHER'], default: 'OTHER' },
      request_count: { type: String },
      driver_ids: [ObjectId],
      doctor_ids: [ObjectId],
      nurse_ids: [ObjectId],
      er_ids: [ObjectId],
      ems_ids: [ObjectId],
      glass_id: ObjectId,
      moniter_id: ObjectId,
      fast_track_id: ObjectId,
      request_note: { type: String, default: '' },
      ambulance_id: ObjectId,
      hospital_id: ObjectId,
      request_status: { type: String, enum : [
        'OPERATION_ASSIGNED',
        'START_OPERATION',
        'DEPART_FROM_BASE_HOSPITAL',
        'ARRIVAL_AT_SCENE',
        'DEPART_FROM_SCENE',
        'GO_TO_BASE_HOSPITAL',
        'ARRIVAL_AT_BASE_HOSPITAL',
        'GO_TO_ANOTHER_HOSPITAL',
        'ARRIVAL_AT_ANOTHER_HOSPITAL',
        'GO_BACK_TO_BASE_HOSPITAL',
        'COME_BACK_TO_BASE_HOSPITAL',
        'COMPLETED',
        'CANCELED',
        'IDEAL'
    ], default: 'IDEAL' },
      request_status_change: [Mixed],
      patient_request_id: ObjectId,
      source: {
          '_id': ObjectId,
          address: { type: String, default: '' },
          location: {
            lat: { type: Number, default: 1 },
            lon: { type: Number, default: 1 }                    
          }
      },
      destination: {
          '_id': ObjectId,
          address: { type: String, default: '' },
          location: {
            lat: { type: Number, default: 1 },
            lon: { type: Number, default: 1 }                    
          }                
      },
      destination_type: { type: String, enum : ['BASE',
      'ANOTHER'] },
      is_trauma: { type: Number, default: 0 },
      is_notify: { type: Number, default: 0 },
      is_nearby_notify: { type: Number, default: 0 },
      is_sync: { type: Number, default: 0 },
      is_scene_notify: { type: Number, default: 0 },
      info: { type: String, default: '' },
    },
    { timestamps: true }
  );
  ModelIncrementSchema.getNextId = async function(modelName, callback) {
    let incr = await this.findOne({ model: modelName });

    if (!incr) incr = await new this({ model: modelName }).save();
    incr.idx++;
    incr.save();
    return incr.idx;
};

schema.pre('save', async function(next) {
    if (this.isNew) {
        const id = String(await ModelIncrementSchema.getNextId('aoc_requests'));
        this.request_count = id.padStart(4, 0); // Incremented
        next();
    } else {
        next();
    }
});
  const AocRequests = mongoose.model("aoc_requests", schema);

  return AocRequests;
};