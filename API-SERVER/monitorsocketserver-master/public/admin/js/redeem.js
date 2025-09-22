

    //Buttons examples
    // var table = $('#datatable-buttons').DataTable({
    //     lengthChange: true,
    //     buttons: ['copy', 'excel', 'pdf']
    // });

    var table = $('#redeem_request_table').DataTable({
//        "ajax": 'http://localhost/Projects/CI/8BallPoolChamps/Admin/AdminController/redeemData',
        "ajax": redeemData,
        "bDestroy": true,
        "serverSide": true,
        "order": [
            [ 0, 'desc' ],
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

    /*function deleteModal(id){
        $("#dialogConfirm").attr('onclick','deleteUser('+id+')');
    }

    function deleteUser(id){
        $.post("http://localhost/Projects/CI/8BallPoolChamps/Admin/AdminController/user/delete",
        {
            UserID: id,
        },
        function(data, status){
            if(data ==1){
                $('#myModal').modal('hide');
                // var table = $('#datatable-buttons').DataTable();
                // table.row('#usr_'+id).remove().draw();
                table.ajax.reload( null, false );
            }
        });
    } */
