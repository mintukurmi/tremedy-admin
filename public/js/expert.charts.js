// Bar
$.ajax({
    url: "/stats/postStats"
  })
    .done(function (res) {
      $('.bar-loader').remove()
      // Line 
      var ctx = document.getElementById("expertChart").getContext('2d');
      var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: res.postStats.labels,
          datasets: [{
            label: '# of Post',
            data: res.postStats.data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(78, 212, 114, 0.2)'
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(235, 129, 64, 1)',
              'rgba(78, 212, 114, 1)'
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
      
    });


    $.ajax({
      url: "/stats/postStats/count"
  })
      .done(function (res) {
  
          $('.pie-loader').remove()
  
          //pie
          var ctxP = document.getElementById("expertPieChart").getContext('2d');
          var myPieChart = new Chart(ctxP, {
              type: 'pie',
              data: {
                  labels: res.postStats.labels,
                  datasets: [{
                      data: res.postStats.data,
                      backgroundColor: ["#F7464A", "#46BFBD", "#FDB45C", "#949FB1", "#4D5360"],
                      hoverBackgroundColor: ["#FF5A5E", "#5AD3D1", "#FFC870", "#A8B3C5", "#616774"]
                  }]
              },
              options: {
                  responsive: true,
                  legend: false
              }
          });
  
      });