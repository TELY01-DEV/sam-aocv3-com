var GlobalData={
    AjaxResponse : function(StatusCode,Success,ResponceData,Message){
        return {
          "StatusCode":StatusCode,
          "Success":Success,
          "Content":ResponceData,
          "Message":Message
        };
    },
}

module.exports = GlobalData; 