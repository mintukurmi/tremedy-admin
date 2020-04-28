
// password toggler

function passToggler(e){
    let isHidden;
    e.querySelector('i').classList.forEach( item => {
    
      if(item === 'fa-eye'){
          isHidden = true
      }
      if(item === 'fa-eye-slash'){
          isHidden = false
      }
  });
  
  if(isHidden){
    e.querySelector('i').classList.remove('fa-eye')
    e.querySelector('i').classList.add('fa-eye-slash')
    e.querySelector('input').setAttribute('type', 'text')
    e.querySelector('i').setAttribute('title', 'Hidden')
  }
  else{
    e.querySelector('i').classList.remove('fa-eye-slash')
    e.querySelector('i').classList.add('fa-eye')
    e.querySelector('input').setAttribute('type', 'password')
    e.querySelector('i').setAttribute('title', 'Visible')
  }
  
}


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