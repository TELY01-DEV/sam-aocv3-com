var table = $('#patients-datatable').DataTable({
    "ajax": {
        url: patientData,
        method: 'POST'
    },
    "columns": [
        { "data": "rowCounter"},
        { "data": "Name"},
        { "data": "FirstName"},
        { "data": "Gender"},
        { "data": "Age"},
        { "data": "Type"},
        { "data": "Action"},
    ],
    "columnDefs": [
        {
            "targets": [ 1 ], //first column / numbering column
            "orderable": false, //set not orderable
        },
        {
            "targets": [ 2 ], //first column / numbering column
            "orderable": false, //set not orderable
        },
    ],
});

function exportToExcel(tableID = 'users-datatable', filename = '')
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

function addPatientForm(){
    $("#patient_detail_form")[0].reset();
    $('#myModal').modal('show');
    patient_detail_form_validate();
}

function editPatient(id){
    $.post("editPatient",
    {
        PatientId: id,
    },
    function(data, status){
        $("#patient_detail_form")[0].reset();
        $('#myModal').modal('show');

        data = data.Content;
        $("#Id").val(data._id);
        $("#FirstName").val(data.FirstName);
        $("#Name").val(data.Name);
        $("#Age").val(data.Age);
        $("#Gender").val(data.Gender);
        $("#Type").val(data.Type);

        patient_detail_form_validate(data.SerialNumber);
    })
}

function clearDevice(userId){
    $.post("freeDevice",{
        userId: userId
    },
    function(data, status){
        document.location.reload(true);
    })
}

function patient_detail_form_validate(SerialNumber = ''){
    if(typeof SerialNumber !== 'undefined' && SerialNumber !== ''){
        $('#SerialNumber').empty();
        $('#SerialNumber').append($('<option>',{text: SerialNumber, value: SerialNumber, selected: true }));
    } else {
        $.post("freedeviceData",{},
        function(data, status){
            var data = data.data;
            $('#SerialNumber').empty();
            $('#SerialNumber').append($('<option>',{text: 'No Device Select', value: '' }));
            data.forEach(function (params) {
                $('#SerialNumber').append($('<option>',{text: params.SerialNumber, value: params.SerialNumber }));
            })
    
        })
    }

    var validator = $('#patient_detail_form').validate({
        ignore: [],
        rules: {
            FirstName: "required",
            Name: "required",
            Age: "required",
            Gender: "required",
            Type: "required",
        },
        submitHandler: function(form)
        {
            var formData = $('#patient_detail_form').serializeArray();
            var object = {};

            formData.forEach(function(value, key){
                object[formData[key]['name']] = formData[key]['value'];
            });

            var json = JSON.stringify(object);

            $.post("updatePatient",
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