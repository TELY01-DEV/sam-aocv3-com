! function(i) {
    "use strict";
    var e = function() {};
    e.prototype.init = function() {
        i("#basic-datepicker").flatpickr(),
        i("#datetime-datepicker").flatpickr({
            enableTime: !0,
            dateFormat: "Y-m-d H:i"
        }),
        i("#datetime-datepickerr").flatpickr({
            enableTime: !0,
            dateFormat: "Y-m-d H:i"
        })
    }, i.FormPickers = new e, i.FormPickers.Constructor = e
}(window.jQuery),
function(e) {
    "use strict";
    window.jQuery.FormPickers.init()
}();