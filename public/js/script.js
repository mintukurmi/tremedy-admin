
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

// Line
// $.ajax({
//   url: "http://localhost:3000/stats"
// })
//   .done(function (res) {
//     $('.loader').remove()
//     console.log(res)
//     // Line 
//     var ctx = document.getElementById("myChart").getContext('2d');
//     var myChart = new Chart(ctx, {
//       type: 'bar',
//       data: {
//         labels: res.userStats.labels,
//         datasets: [{
//           label: '# of Users Registered',
//           data: res.userStats.data,
//           backgroundColor: [
//             'rgba(255, 99, 132, 0.2)',
//             'rgba(54, 162, 235, 0.2)',
//             'rgba(255, 206, 86, 0.2)',
//             'rgba(75, 192, 192, 0.2)',
//             'rgba(153, 102, 255, 0.2)',
//             'rgba(255, 159, 64, 0.2)',
//             'rgba(78, 212, 114, 0.2)'
//           ],
//           borderColor: [
//             'rgba(255,99,132,1)',
//             'rgba(54, 162, 235, 1)',
//             'rgba(255, 206, 86, 1)',
//             'rgba(75, 192, 192, 1)',
//             'rgba(153, 102, 255, 1)',
//             'rgba(235, 129, 64, 1)',
//             'rgba(78, 212, 114, 1)',
//           ],
//           borderWidth: 1
//         }]
//       },
//       options: {
//         scales: {
//           yAxes: [{
//             ticks: {
//               beginAtZero: true
//             }
//           }]
//         }
//       }
//     });

//     //pie
//     var ctxP = document.getElementById("pieChart").getContext('2d');
//     var myPieChart = new Chart(ctxP, {
//       type: 'pie',
//       data: {
//         labels: res.postStats.labels,
//         datasets: [{
//           data: res.postStats.data,
//           backgroundColor: ["#F7464A", "#46BFBD", "#FDB45C", "#949FB1", "#4D5360"],
//           hoverBackgroundColor: ["#FF5A5E", "#5AD3D1", "#FFC870", "#A8B3C5", "#616774"]
//         }]
//       },
//       options: {
//         responsive: true,
//         legend: false
//       }
//     });

    
  // });
