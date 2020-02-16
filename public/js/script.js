 // adding stylles to pagintion
//  $(document).ready(function () {
    
//   $('ul.pagination').find('li').addClass('page-item');

//   $('li.page-item').find('a').addClass('page-link');

// });

// Material Select Initialization
$(document).ready(function () {
  $('.mdb-select').materialSelect();
});

// Animations initialization
new WOW().init();

// ripple effect  
$('.dark-overlay').ripples({
  dropRadius: 20,
  perturbance: 0.01,
  interactive: true
})

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
  

// Line
var ctx = document.getElementById("myChart").getContext('2d');
var myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
    datasets: [{
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ],
      borderColor: [
        'rgba(255,99,132,1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    }
  }
});

//pie
var ctxP = document.getElementById("pieChart").getContext('2d');
var myPieChart = new Chart(ctxP, {
  type: 'pie',
  data: {
    labels: ["Red", "Green", "Yellow", "Grey", "Dark Grey"],
    datasets: [{
      data: [300, 50, 100, 40, 120],
      backgroundColor: ["#F7464A", "#46BFBD", "#FDB45C", "#949FB1", "#4D5360"],
      hoverBackgroundColor: ["#FF5A5E", "#5AD3D1", "#FFC870", "#A8B3C5", "#616774"]
    }]
  },
  options: {
    responsive: true,
    legend: false
  }
});


//line
var ctxL = document.getElementById("lineChart").getContext('2d');
var myLineChart = new Chart(ctxL, {
  type: 'line',
  data: {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [{
        label: "My First dataset",
        backgroundColor: [
          'rgba(105, 0, 132, .2)',
        ],
        borderColor: [
          'rgba(200, 99, 132, .7)',
        ],
        borderWidth: 2,
        data: [65, 59, 80, 81, 56, 55, 40]
      },
      {
        label: "My Second dataset",
        backgroundColor: [
          'rgba(0, 137, 132, .2)',
        ],
        borderColor: [
          'rgba(0, 10, 130, .7)',
        ],
        data: [28, 48, 40, 19, 86, 27, 90]
      }
    ]
  },
  options: {
    responsive: true
  }
});


//radar
var ctxR = document.getElementById("radarChart").getContext('2d');
var myRadarChart = new Chart(ctxR, {
  type: 'radar',
  data: {
    labels: ["Eating", "Drinking", "Sleeping", "Designing", "Coding", "Cycling", "Running"],
    datasets: [{
      label: "My First dataset",
      data: [65, 59, 90, 81, 56, 55, 40],
      backgroundColor: [
        'rgba(105, 0, 132, .2)',
      ],
      borderColor: [
        'rgba(200, 99, 132, .7)',
      ],
      borderWidth: 2
    }, {
      label: "My Second dataset",
      data: [28, 48, 40, 19, 96, 27, 100],
      backgroundColor: [
        'rgba(0, 250, 220, .2)',
      ],
      borderColor: [
        'rgba(0, 213, 132, .7)',
      ],
      borderWidth: 2
    }]
  },
  options: {
    responsive: true
  }
});

//doughnut
var ctxD = document.getElementById("doughnutChart").getContext('2d');
var myLineChart = new Chart(ctxD, {
  type: 'doughnut',
  data: {
    labels: ["Red", "Green", "Yellow", "Grey", "Dark Grey"],
    datasets: [{
      data: [300, 50, 100, 40, 120],
      backgroundColor: ["#F7464A", "#46BFBD", "#FDB45C", "#949FB1", "#4D5360"],
      hoverBackgroundColor: ["#FF5A5E", "#5AD3D1", "#FFC870", "#A8B3C5", "#616774"]
    }]
  },
  options: {
    responsive: true
  }
});
