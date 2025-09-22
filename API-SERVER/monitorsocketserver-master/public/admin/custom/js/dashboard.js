$(document).ready(function() {
    $.post("dashboardData",{},
    function(data, status){
        $('#DashboardTotalPatient').html('<b class="counter" >'+data.TotalPatient+'</b>');
        $('#DashboardTotalDevice').html('<b class="counter" >'+data.TotalDevice+'</b>');
    });
})