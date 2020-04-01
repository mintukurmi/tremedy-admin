
// Material Select Initialization
$(document).ready(function () {
  $('.mdb-select').materialSelect();
  
});

// Animations initialization
new WOW().init();

// Tooltips Initialization
$(function () {
  $('[data-toggle="tooltip"]').tooltip()
  })

  // input type file .. display filename
$('input[type="file"]').change(function (e) {
        var $this = $(e.target);
        var $fileField = $this.closest('.file-field');
        var $pathInput = $fileField.find('input.file-path');
        var fileNames = [];

        fileNames.push(e.target.files[0].name);

        $pathInput.val(fileNames.join(', '));
        $pathInput.trigger('change');
   });

$(document).ready(function () {
  $('.editText').focus(function () {
    $('.textPreview').fadeIn(600);
  }).focusout(function () {
    $('.textPreview').fadeOut(600);
  });
});
