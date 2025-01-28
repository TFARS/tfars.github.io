//从域名后缀获取当前rank
function getQueryParam(param) {
    var searchParams = new URLSearchParams(window.location.search);
    console.log(param);
    /*searchParams = Math.min(0, Number(searchParams));*/
    var a = searchParams.get(param);
    if (a == null) {
        a = 0;
    }
    return a;
}

//数据反向检索
function findItemById(items, id) {
    return items.find(item => item.desc === id);
}

//更新显示数据
function dataUpdate() {
    //ID相关
    headName.textContent = data.members[rank].tfaName;
    document.getElementById('index').textContent = data.members[rank].tfaIndex;

    //积分排名相关
    document.getElementById('rank').textContent = '#' + data.members[rank].rank;
    document.getElementById('mmr').textContent = data.members[rank].currentMMR;
    //赛事数据相关
    document.getElementById('tours').textContent = data.members[rank].showInfo.toursCount;
    document.getElementById('lastTour').textContent = data.members[rank].showInfo.lastTour;
    document.getElementById('lastStanding').textContent = data.members[rank].showInfo.lastTourRank;

    //胜率相关
    matches.textContent = data.members[rank].totalMatches[0];
    wins.textContent = data.members[rank].totalWinMatches[0];
    document.getElementById('winRate').textContent = (Number(wins.textContent) / Number(matches.textContent) * 100).toFixed(2) + '%';
}



var data;
var rank = getQueryParam('rank') - 1; // 获取rank参数
//var globalSeason = getQueryParam('globalSeason') ; // 获取rank参数

//获取页面布局元素id
var headName = document.getElementById('name');
var matches = document.getElementById('matches');
var wins = document.getElementById('wins');

var tableTour = document.querySelector('#tourTable > tbody');
var tableVersus = document.querySelector('#rivalTable > tbody');

//var container = document.getElementById('history-honor');

document.addEventListener('DOMContentLoaded', function () {
    fetch('/data/data.json')
        .then(response => {
            if (response.ok) {
                return response.json(); // 将响应转换为JSON
            }
            throw new Error('Network response was not ok.');
        })
        .then(jsonData => {
            console.log("数据长度:" + jsonData.length);
            //globalSeason = 2023 + jsonData.length - globalSeason;
            //globalSeason = Math.min(Math.max(0, globalSeason), jsonData.length - 1)
            data = jsonData[globalSeason];

            rank = Math.min(Math.max(0, rank), data.members.length - 1);

            var player = data.members[rank];
            console.log(player);

            //处理赛事记录
            player.showInfo.historyResult.forEach(function (item) {
                var row = tableTour.insertRow(-1); // 在表格末尾添加新行
                var cell0 = row.insertCell(0);
                var cell1 = row.insertCell(1); // 比赛名次
                var cell2 = row.insertCell(2); // 赛事名称
                var cell3 = row.insertCell(3); // 对手ID
                var cell4 = row.insertCell(4); // 比分

                var tour = findItemById(data.tournaments, item.tour);

                cell0.textContent = tour.date;
                cell1.textContent = item.standing;
                switch (item.standing) {
                    case 1:
                        cell1.style.backgroundColor = "#CD7F32";
                        console.log(item.standing + "金色");
                        break;
                    case 2:
                        cell1.style.backgroundColor = "#BBB";
                        console.log(item.standing + "银色");
                        break;
                    case 3:
                        cell1.style.backgroundColor = "#8C7853";
                        console.log(item.standing + "铜色");
                        break;
                }
                cell2.textContent = item.tour;
                cell3.innerHTML = '<span class="vs-symbol">' + " VS " + '</span>'   + item.rival;
                cell4.textContent = item.result;
            });

            //处理交手记录
            player.showInfo.ada.forEach(function (item) {
                var row2 = tableVersus.insertRow(-1); // 在表格末尾添加新行
                var cell21 = row2.insertCell(0); // 对手名称
                var cell22 = row2.insertCell(1); // 对局
                var cell23 = row2.insertCell(2); // 胜率

                cell21.innerHTML = '<span class="vs-symbol">' + " VS " + '</span>' + item.tfaName;
                cell22.textContent = item.totalWinRound + "-" + (Number(item.totalRound) - Number(item.totalWinRound));

                var rate = (Number(item.totalWinRound) / Number(item.totalRound) * 100);
                if (rate < 50) {
                    cell23.style.color = 'red';
                }
                else if (rate > 50) {
                    cell23.style.color = 'green';
                }


                cell23.textContent = rate.toFixed(2) + '%';
            });

            //处理历史荣誉
            var honorKV = player.showInfo.honor;
            const honor_list = document.getElementById('history-honor');
            if (Object.keys(honorKV).length > 0) {
                for (var key in honorKV) {
                    if (honorKV.hasOwnProperty(key)) {
                        //insertImageWithText('/img/rank'+honorKV[key]+'.png', key)

                        // 创建一个新的容器div
                        const container = document.createElement('div');
                        container.className = 'honor-container';

                        // 创建奖杯图片元素  
                        const trophyImage = document.createElement('img');
                        trophyImage.src = '/img/rank' + honorKV[key] + '.png';
                        trophyImage.alt = '奖杯';
                        trophyImage.className = 'honor-image';

                        // 创建成绩元素  
                        const score = document.createElement('div');
                        score.className = 'honor-tour';
                        var standing = '冠军';
                        console.log(honorKV[key]);
                        switch (honorKV[key]) {

                            case 1:
                                standing = '冠军'
                                break;
                            case 2:
                                standing = '亚军'
                                break;
                            case 3:
                                standing = '季军'
                                break;
                                   
                        }
                        score.textContent = key + ' ' + standing;

                        // 创建时间元素  
                        const time = document.createElement('div');
                        time.className = 'honor-time';
                        time.textContent = findItemById(data.tournaments, key).date;

                        // 将元素添加到容器中  
                        container.appendChild(trophyImage);
                        container.appendChild(score);
                        container.appendChild(time);

                        // 将容器添加到wrapper中  
                        honor_list.appendChild(container);  

                        /*const div = document.createElement('div');
                        div.className = 'image-container';

                        const img = document.createElement('img');
                        img.src = '/img/rank' + honorKV[key] + '.png';
                        div.appendChild(img);

                        const span = document.createElement('span');
                        span.className = 'text-overlay';
                        span.textContent = key;
                        div.appendChild(span);

                        container.appendChild(div);*/
                    }
                }

            }
            else {
                honor_list.style.display = "none";
            }

            //处理图表相关
            google.charts.load('current', { 'packages': ['corechart'] });
            google.charts.setOnLoadCallback(drawChart);
            function drawChart() {
                var chartData = new google.visualization.DataTable();

                // 解析JSON数据填充DataTable
                //var jsonObject = JSON.parse(jsonData);
                chartData.addColumn('string', 'Tournament');
                chartData.addColumn('number', 'MMR');
                chartData.addColumn({ type: 'string', role: 'annotation' });
                chartData.addColumn({ type: 'string', role: 'annotation' });
                chartData.addRow(["初始", 1500, '1500', '初始']);
                for (var i = player.historyMMR.length; i > 0; i--) {
                    var join = (player.historyIn[i - 1]) ? '参赛' : '';
                    chartData.addRow([data.tournaments[i - 1].desc, player.historyMMR[i - 1], String(player.historyMMR[i - 1]), join]);
                }

                var pointWidth = 90;
                var chartWidth = chartData.getNumberOfRows() * pointWidth;
                console.log('CCC:' + chartData.getNumberOfRows());


                var options = {
                    pointSize: 5,
                    pointShape: 'circle',
                    pointGlowColor: 'red', // 设置点的发光颜色
                    pointGlowSize: 5, // 设置点的发光大小
                    lineWidth: 2,
                    shadow: true,
                    /*title: '积分变化曲线',*/
                    backgroundColor: {
                        fill: 'transparent'
                    },
                    hAxis: {
                        slantedText: false,
                        minValue:'初始',
                        /*title: '赛事', titleTextStyle: {
                            color: 'red'
                        },*/
                        textStyle: {
                            fontSize: 14,
                            //format: '#####,####'
                            color: 'white',
                            auraColor: '#99208d',
                            // The transparency of the text.
                            opacity: 0.6
                        }
                    },
                    vAxis: {
                        /*title: '积分',
                        titleTextStyle: { color: 'red' }，*/
                        textStyle: {
                            fontSize: 14,
                            //format: '#####,####'
                            color: 'white',
                            auraColor: '#99208d',
                            // The transparency of the text.
                            opacity: 0.6
                        },
                        minValue: 1400,
                        maxValue: 1800,
                        gridlines: {
                            count: 5,
                            color:'pink',
                        },
                        minorGridlines: {
                            count:0,
                        },
 
                    }, 
                    annotations: {
                        textStyle: {
                            fontName: 'Times-Roman',
                            fontSize: 18,

                            // The color of the text.
                            color: 'white',
                            // The color of the text outline.
                            auraColor: '#99208d',
                            // The transparency of the text.
                            opacity: 0.8
                        }
                    },
                    chartArea: {
                        left: '50',
                        right: '20',
                        top: '5%',
                        bottom: '20%'
                    },
                    width: chartWidth,
                    height: 350,
                    legend: 'none',
                    series: [{ color: '#8eff9a' }]

                };

                var chart = new google.visualization.LineChart(document.getElementById('donutchart'));

                /*document.getElementById('donutchart').style.width = chartWidth + 'px';*/

                chart.draw(chartData, options);
            };

            //更新数据显示
            dataUpdate();
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });

});

//插入图片的方法
function insertImageWithText(imageSrc, text) {
    const container = document.createElement('div');
    container.className = 'image-container';

    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = text;
    container.appendChild(img);

    const textDiv = document.createElement('div');
    textDiv.className = 'text-overlay';
    textDiv.textContent = text;
    container.appendChild(textDiv);

    document.getElementById('history-honor').appendChild(container);
}

/*console.log(jsonData);

console.log(jsonData.members[rank].tfaName);
console.log(jsonData.members[rank].historyMMR);*/
//console.log(data.members[rank].tfaName);

//console.log(data.members[rank].historyMMR);

//var tourTable = document.querySelector('#rankings > tbody');