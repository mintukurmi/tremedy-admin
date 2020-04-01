
const results = {
    userStats: { },
    postStats: { }
}

$.ajax({
    url: "/stats/userStats"
}).done( function(res) {
    
    results.userStats = res.userStats
    
    $.ajax({
        url: "/stats/postStats"
    }).done(function (res) {
       
        results.postStats = res.postStats

        $('.bar-loader').remove()
        //line
        var ctxL = document.getElementById("myChart").getContext('2d');
        var myLineChart = new Chart(ctxL, {
            type: 'line',
            data: {
                labels: results.userStats.labels,
                datasets: [{
                    label: "# users Registered",
                    data: results.userStats.data,
                    backgroundColor: [
                        'rgba(105, 0, 132, .2)',
                    ],
                    borderColor: [
                        'rgba(200, 99, 132, .7)',
                    ],
                    borderWidth: 2
                },
                {
                    label: "# posts",
                    data: results.postStats.data,
                    backgroundColor: [
                        'rgba(0, 137, 132, .2)',
                    ],
                    borderColor: [
                        'rgba(0, 10, 130, .7)',
                    ],
                    borderWidth: 2
                }
                ]
            },
            options: {
                responsive: true
            }
        });
    })
})



$.ajax({
    url: "/stats/postStats/count"
})
    .done(function (res) {

        $('.pie-loader').remove()

        //pie
        var ctxP = document.getElementById("pieChart").getContext('2d');
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
