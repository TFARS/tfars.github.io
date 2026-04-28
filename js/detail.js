document.addEventListener('DOMContentLoaded', async function () {
    // 等待数据就绪
    if (!DataService.isReady()) {
        await new Promise(resolve => {
            const check = setInterval(() => {
                if (DataService.isReady()) { clearInterval(check); resolve(); }
            }, 100);
        });
    }

    // 获取赛季与排名参数
    const params = new URLSearchParams(window.location.search);
    const season = window.__currentSeason || 'latest';
    const seasonData = DataService.getSeasonData(season);
    const totalPlayers = seasonData.members.length;
    let rank = parseInt(params.get('rank'), 10) || 1;

    // 越界保护：如果排名无效，跳转到 rank=1
    if (rank < 1 || rank > totalPlayers) {
        params.set('rank', 1);
        window.location.search = params.toString();
        return;
    }

    const player = seasonData.members[rank - 1];
    initDetailPage(player, seasonData, season, rank);
});

// 将所有渲染逻辑提取为独立函数
function initDetailPage(player, seasonData, season, rank) {
    // 基础信息
    document.getElementById('name').textContent = player.tfaName;
    document.getElementById('index').textContent = player.tfaIndex;
    document.getElementById('rank').textContent = '#' + player.rank;
    document.getElementById('mmr').textContent = player.displayMMR;
    document.getElementById('matches').textContent = player.totalMatches[0];
    document.getElementById('wins').textContent = player.totalWinMatches[0];
    document.getElementById('winRate').textContent = (player.totalWinMatches[0] / player.totalMatches[0] * 100).toFixed(2) + '%';
    document.getElementById('tours').textContent = player.showInfo.toursCount;
    document.getElementById('lastTour').textContent = player.showInfo.lastTour;
    document.getElementById('lastStanding').textContent = player.showInfo.lastTourRank;

    // 参赛记录
    const tourTbody = document.querySelector('#tourTable tbody');
    tourTbody.innerHTML = '';
    player.showInfo.historyResult.forEach(item => {
        const tour = seasonData.tournaments.find(t => t.desc === item.tour);
        const row = tourTbody.insertRow();
        row.insertCell(0).textContent = tour ? tour.date : '';
        const standingCell = row.insertCell(1);
        standingCell.textContent = item.standing < 0 ? '小组淘汰' : item.standing;
        if (item.standing === 1) standingCell.style.backgroundColor = '#CD7F32';
        else if (item.standing === 2) standingCell.style.backgroundColor = '#BBB';
        else if (item.standing === 3) standingCell.style.backgroundColor = '#8C7853';
        row.insertCell(2).textContent = item.tour;
        row.insertCell(3).innerHTML = '<span class="vs-symbol"> VS </span>' + item.rival;
        row.insertCell(4).textContent = item.result;
    });

    // 交手记录
    const rivalTbody = document.querySelector('#rivalTable tbody');
    rivalTbody.innerHTML = '';
    player.showInfo.ada.forEach(item => {
        const row = rivalTbody.insertRow();
        row.insertCell(0).innerHTML = '<span class="vs-symbol"> VS </span>' + item.tfaName;
        row.insertCell(1).textContent = `${item.totalWinRound}-${item.totalRound - item.totalWinRound}`;
        const rate = (item.totalWinRound / item.totalRound * 100).toFixed(2) + '%';
        const rateCell = row.insertCell(2);
        rateCell.textContent = rate;
        rateCell.style.color = parseFloat(rate) < 50 ? 'red' : parseFloat(rate) > 50 ? 'green' : '';
    });

    // 历史荣誉
    const honorSection = document.getElementById('history-honor');
    honorSection.querySelectorAll('.honor-container').forEach(el => el.remove());
    const honorKV = player.showInfo.honor;
    if (Object.keys(honorKV).length > 0) {
        Object.entries(honorKV).forEach(([tourName, standing]) => {
            const tour = seasonData.tournaments.find(t => t.desc === tourName);
            const container = document.createElement('div');
            container.className = 'honor-container';
            const img = document.createElement('img');
            img.src = `/img/rank${standing}.png`;
            img.alt = '奖杯';
            img.className = 'honor-image';
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'honor-tour';
            const honorText = { 1: '冠军', 2: '亚军', 3: '季军' }[standing] || `第${standing}名`;
            scoreDiv.textContent = `${tourName} ${honorText}`;
            const timeDiv = document.createElement('div');
            timeDiv.className = 'honor-time';
            timeDiv.textContent = tour ? tour.date : '';
            container.appendChild(img);
            container.appendChild(scoreDiv);
            container.appendChild(timeDiv);
            honorSection.appendChild(container);
        });
    } else {
        honorSection.style.display = 'none';
    }

    // 积分曲线（Google Charts）
    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(() => {
        const chartData = new google.visualization.DataTable();
        chartData.addColumn('string', 'Tournament');
        chartData.addColumn('number', 'MMR');
        chartData.addColumn({ type: 'string', role: 'annotation' });
        chartData.addColumn({ type: 'string', role: 'annotation' });
        chartData.addRow(['初始', 1500, '1500', '初始']);
        for (let i = player.historyDisplayMMR.length; i > 0; i--) {
            let join = '';
            if (player.historyIn[i - 1]) {
                join = '参赛';
                if (player.historyDQ[i - 1] > 0) join = '鸽了';
            } else if (player.historyDecay[i - 1]) {
                join += '衰减';
            }
            chartData.addRow([seasonData.tournaments[i - 1].desc, player.historyDisplayMMR[i - 1], String(player.historyDisplayMMR[i - 1]), join]);
        }
        const options = {
            pointSize: 5, lineWidth: 2,
            backgroundColor: { fill: 'transparent' },
            hAxis: { textStyle: { color: 'white', opacity: 0.6 } },
            vAxis: { textStyle: { color: 'white', opacity: 0.6 }, minValue: 1400, maxValue: 1800, gridlines: { count: 5, color: 'pink' } },
            annotations: { textStyle: { fontSize: 18, color: 'white', auraColor: '#99208d', opacity: 0.8 } },
            chartArea: { left: 50, right: 20, top: '5%', bottom: '20%' },
            width: chartData.getNumberOfRows() * 90,
            height: 350,
            legend: 'none',
            series: [{ color: '#8eff9a' }]
        };
        const chart = new google.visualization.LineChart(document.getElementById('donutchart'));
        chart.draw(chartData, options);
    });
}