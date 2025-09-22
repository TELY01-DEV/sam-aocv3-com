module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema(
      {
        creater_id: ObjectId,
        patient_id: ObjectId,
        sickness_type: { type: String, default: '' },
        severity_level: { type: Number, default: 1 },
        hospital_id: ObjectId,
        zone_id: ObjectId,
        is_trauma: { type: Number, default: 1 },
        diagnosis_note: { type: String, default: '' },
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
        distance: { type: Number, default: 0 },
        request_status: { type: String, enum : [
            'START_OPERATION',
            'COMPLETED',
            'CANCELED',
            'IDEAL'
        ], default: 'IDEAL' },
      },
      { timestamps: true }
    );

    const PatientRequests = mongoose.model("patient_requests", schema);
    return PatientRequests;
  };