var table = $('#devices-datatable').DataTable({
    "ajax": {
        url: deviceData,
        method: 'POST'
    },
    "columns": [
        { "data": "rowCounter"},
        { "data": "SerialNumber"},
        { "data": "Action"},
    ],
    "columnDefs": [
        {
            "targets": [ 1 ], //first column / numbering column
            "orderable": false, //set not orderable
        },
    ],
});

function exportToExcel(tableID = 'devices-datatable', filename = '')
{
    var tab_text="<table border='2px'><tr bgcolor='#87AFC6'>";
    var j=0;
    var tab = document.getElementById(tableID); // id of table

    for(j = 0 ; j < tab.rows.length ; j++) 
    {     
        tab_text=tab_text+tab.rows[j].innerHTML+"</tr>";
    }

    tab_text=tab_text+"</table>";
    tab_text= tab_text.replace(/<A[^>]*>|<\/A>/g, ""); //remove if u want links in your table
    tab_text= tab_text.replace(/<img[^>]*>/gi,""); // remove if u want images in your table
    tab_text= tab_text.replace(/<input[^>]*>|<\/input>/gi, ""); // reomves input params

    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE "); 

    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) // If Internet Explorer
    {
        txtArea1.document.open("txt/html","replace");
        txtArea1.document.write(tab_text);
        txtArea1.document.close();
        txtArea1.focus(); 
        sa=txtArea1.document.execCommand("SaveAs",true,"Say Thanks to Sumit.xls");
    }  
    else  //other browser not tested on IE 11
        sa = window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tab_text));  

    return (sa);
}

function addDeviceForm(){
    $("#device_detail_form")[0].reset();
    $('#myModal').modal('show');
    device_detail_form_validate();
}

function deleteDevice(id){
    $.post("deleteDevice",
    {
        DeviceId: id,
    },
    function(data, status){
        document.location.reload(true);
        if(data.Success) {
        }
    })
}

function device_detail_form_validate(){
    var validator = $('#device_detail_form').validate({
        ignore: [],
        rules: {
            SerialNumber: "required",
        },
        submitHandler: function(form)
        {
            var formData = $('#device_detail_form').serializeArray();
            var object = {};

            formData.forEach(function(value, key){
                object[formData[key]['name']] = formData[key]['value'];
            });

            var json = JSON.stringify(object);

            $.post("updateDevice",
            {
                json,
            },
            function(data){
                $('#myModal').modal('hide');
                if(data.Success) {
                    document.location.reload(true);
                }
            });
        }   
    })
    validator.resetForm();
    $('.error').removeClass('error');
}