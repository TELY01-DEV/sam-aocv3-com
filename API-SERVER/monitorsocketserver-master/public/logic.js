(function() {
    console.log('Socket connecting...');
    setTimeout(() => {
        var socket = io.connect('http://202.183.192.145:5000');

        socket.on('connection', function (data) {
            console.log('Server Connected '+data);
        });

        var text_ECG_I = 'EcgI';
        var text_ECG_II = 'EcgII';
        var text_ECG_III = 'EcgIII';
        var text_ECG_SPO2 = 'Spo2';

        socket.on('data', function (rowdata) {
            dataStr = rowdata.toString();
            dataStr = dataStr.trim('\n');
            dataStr = dataStr.replaceAll('}','}abc');
            dataStr = dataStr.replaceAll('}abc}abc','}}abc');
            dataStr = dataStr.replaceAll('abc]}abc',']}');
            dataStr = dataStr.replaceAll('abc,',',');
            var dataArray = dataStr.split('abc');

            dataArray = dataArray.filter(function(d){ return d != '' });
            if(dataArray.length){
                dataArray.forEach(d => {
                    if(d !== ""){
                        d = d.trim('\n');
                        try {
                            data = JSON.parse(d);
                            switch (String(data.Key)) {
                                case 'vital':
                                    try {
                                        var ValueArray = (data.Value);
                                        var isHRzero = false;
                                        ValueArray.forEach(V => {
                                            var showValue = (parseFloat(V.Value) !== 0)?parseFloat(V.Value):'--';
                                            var showUnit = (V.Unit);
                                            switch (V.TrendName) {
                                                case 'HR':
                                                    if (showValue == '--') {
                                                        isHRzero = true;
                                                    }
                                                    document.getElementById("hr").innerHTML = String(showValue);
                                                    break;
                                                
                                                case "SPO2 Pulse":
                                                    if (isHRzero) {
                                                        document.getElementById("hr").innerHTML = String(showValue);
                                                    }
                                                    break;
                                                    
                                                case "ETCO2":
                                                    document.getElementById("etco2").innerHTML = String(showValue);
                                                    break;
            
                                                case "SPO2":
                                                    document.getElementById("spo2").innerHTML = String(showValue);
                                                    break;
            
                                                case "NIBP Sys":
                                                    document.getElementById("nibpsys").innerHTML = String(showValue);
                                                    break;
            
                                                case "NIBP Dia":
                                                    document.getElementById("nibpdia").innerHTML = String(showValue);
                                                    break;
            
                                                case "NIBP Map":
                                                    document.getElementById("nibpmap").innerHTML = String(showValue);
                                                    break;
                                            
                                                default:
                                                    break;
                                            }
                                        });
                                    } catch (error) {
                                        console.log(error)
                                    }
                                    break;
                                
                                case 'alarm':
                                
                                    break;
                                
                                case text_ECG_I:
                                    try {
                                        var Value = (data.Value);
                                        var ValueArray = Value.split(',');
                                        if(ValueArray.length){
                                            ValueArray.forEach(V => {
                                                var data = Number(V);
                                                chart2line1.append(new Date().getTime(), data);
                                            })
                                        }
                                    } catch (err) {
                                        console.log(text_ECG_I+' Data Parse ERROR: ', err)
                                    }
                                    break;
                                
                                case text_ECG_II:
                                    try {
                                        var Value = (data.Value);
                                        var ValueArray = Value.split(',');
                                        if(ValueArray.length){
                                            ValueArray.forEach(V => {
                                                var data = Number(V)
                                                chart1line1.append(new Date().getTime(), data);
                                            })
                                        }
                                    } catch (err) {
                                        console.log(text_ECG_II+' Data Parse ERROR: ', err)
                                    }
                                    break;
        
                                case text_ECG_III:
                                    try {
                                        var Value = (data.Value);
                                        var ValueArray = Value.split(',');
                                        if(ValueArray.length){
                                            ValueArray.forEach(V => {
                                                var data = Number(V);
                                                chart3line1.append(new Date().getTime(), data);
                                            })
                                        }
                                    } catch (err) {
                                        console.log(text_ECG_III+' Data Parse ERROR: ', err)
                                    }
                                    break;
        
                                case text_ECG_SPO2:
                                    try {
                                        var Value = (data.Value);
                                        var ValueArray = Value.split(',');
                                        if(ValueArray.length){
                                            ValueArray.forEach(V => {
                                                var data = Number(V);
                                                chart4line1.append(new Date().getTime(), data);
                                            })
                                        }
                                    } catch (err) {
                                        console.log(text_ECG_SPO2+' Data Parse ERROR: ', err)
                                    }
                                    break;
                            
                                default:
                                    break;
                            }
                        } catch (err) {
                            console.log('Data Parse ERROR: ', err)
                        }
                    }
                });
            }
        });
    }, 2000);
})();