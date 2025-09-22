module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        name: { type: String, default: '' },
        ip_address: { type: String, default: '' },
        domain_name: { type: String, default: '' },
        // created_by: { type: String, default: '' },
        // updated_by: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false}
      },
      { timestamps: true }
    );

    schema.index({ isactive: 1, isdeleted: 1 });
    const StreamServers = mongoose.model("stream_servers", schema);
  
    return StreamServers;
  };