module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        ip_address: { type: String, default: '' },
        domain: { type: String, default: '' },
        created_by: { type: String, default: '' },
        updated_by: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false},
      },
      { timestamps: true }
    );

    const IpServerCommunications = mongoose.model("ip_server_communications", schema);
  
    return IpServerCommunications;
  };