// js/script_detail.js
let playerData = null;
let seasonData = null;

document.addEventListener('DOMContentLoaded', () => {
    const checkData = setInterval(() => {
        if (AppState.isDataLoaded) {
            clearInterval(checkData);
            initDetail();
        }
    }, 50);
});

function initDetail() {
    seasonData = getCurrentSeasonData();
    if (!seasonData) return;

    // 获取Rank参数
    let rank = parseInt(getQueryParam('rank')) - 1;
    rank = Math.min(Math.max(0, rank), seasonData.members.length - 1);
    playerData = seasonData.members[rank];

    // 渲染所有内容
    renderBasicInfo();
    renderTournamentHistory();
    renderRivalHistory();
    renderHonors();

    // 加载Google图表
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(drawChart);
}

// 1. 基础信息
function renderBasicInfo() {
    document.getElementById('name').textContent = playerData.tfaName;
    document.getElementById('index').textContent = playerData.tfaIndex;
    document.getElementById('rank').textContent = '#' + playerData.rank;
    document.getElementById('mmr').textContent = playerData.displayMMR;

    const info = playerData.showInfo;
    document.getElementById('tours').textContent = info.toursCount;
    document.getElementById('lastTour').textContent = info.lastTour;
    document.getElementById('lastStanding').textContent = info.lastTourRank;

    const totalMatches = playerData.totalMatches[0];
    const totalWins = playerData.totalWinMatches[0];
    document.getElementById('matches').textContent = totalMatches;
    document.getElementById('wins').textContent = totalWins;
    document.getElementById('winRate').textContent = ((totalWins / totalMatches) * 100).toFixed(2) + '%';
}

// 2. 参赛记录
function renderTournamentHistory() {
    const tbody = document.querySelector('#tourTable > tbody');
    tbody.innerHTML = '';

    playerData.showInfo.historyResult.forEach(item => {
        const row = tbody.insertRow(-1);
        const tour = seasonData.tournaments.find(t => t.desc === item.tour);

        const cell0 = row.insertCell(0);
        const cell1 = row.insertCell(1);
        const cell2 = row.insertCell(2);
        const cell3 = row.insertCell(3);
        const cell4 = row.insertCell(4);

        cell0.textContent = tour ? tour.date : '';
        cell1.textContent = item.standing < 0 ? "小组淘汰" : item.standing;

        // 奖牌颜色
        if (item.standing === 1) cell1.style.backgroundColor = "#CD7F32";
        else if (item.standing === 2) cell1.style.backgroundColor = "#BBB";
        else if (item.standing === 3) cell1.style.backgroundColor = "#8C7853";

        cell2.textContent = item.tour;
        cell3.innerHTML = `<span class="vs-symbol"> VS </span>${item.rival}`;
        cell4.textContent = item.result;
    });
}

// 3. 交手记录
function renderRivalHistory() {
    const tbody = document.querySelector('#rivalTable > tbody');
    tbody.innerHTML = '';

    playerData.showInfo.ada.forEach(item => {
        const row = tbody.insertRow(-1);
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);

        cell1.innerHTML = `<span class="vs-symbol"> VS </span>${item.tfaName}`;
        const wins = item.totalWinRound;
        const total = item.totalRound;
        cell2.textContent = `${wins}-${total - wins}`;

        const rate = (wins / total) * 100;
        cell3.textContent = rate.toFixed(2) + '%';
        cell3.style.color = rate < 50 ? 'red' : (rate > 50 ? 'green' : 'inherit');
    });
}

// 4. 历史荣誉
function renderHonors() {
    const honorList = document.getElementById('history-honor');
    const honorKV = playerData.showInfo.honor;

    // 清除除了h2之外的内容
    const h2 = honorList.querySelector('h2');
    honorList.innerHTML = '';
    honorList.appendChild(h2);

    if (Object.keys(honorKV).length === 0) {
        honorList.style.display = 'none';
        return;
    }

    for (const key in honorKV) {
        const rankVal = honorKV[key];
        const tour = seasonData.tournaments.find(t => t.desc === key);

        const container = document.createElement('div');
        container.className = 'honor-container';

        const img = document.createElement('img');
        img.src = `img/rank${rankVal}.png`;
        img.alt = '奖杯';
        img.className = 'honor-image';

        const score = document.createElement('div');
        score.className = 'honor-tour';
        let standing = '冠军';
        if (rankVal === 2) standing = '亚军';
        else if (rankVal === 3) standing = '季军';
        score.textContent = `${key} ${standing}`;

        const time = document.createElement('div');
        time.className = 'honor-time';
        time.textContent = tour ? tour.date : '';

        container.appendChild(img);
        container.appendChild(score);
        container.appendChild(time);
        honorList.appendChild(container);
    }
}

// 5. 积分图表
function drawChart() {
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Tournament');
    data.addColumn('number', 'MMR');
    data.addColumn({ type: 'string', role: 'annotation' });
    data.addColumn({ type: 'string', role: 'annotation' });

    data.addRow(["初始", 1500, '1500', '初始']);

    const len = playerData.historyDisplayMMR.length;
    for (let i = len; i > 0; i--) {
        let join = '';
        if (playerData.historyIn[i - 1]) {
            join = playerData.historyDQ[i - 1] > 0 ? "鸽了" : "参赛";
        } else if (playerData.historyDecay[i - 1]) {
            join = "衰减";
        }

        const mmr = playerData.historyDisplayMMR[i - 1];
        data.addRow([seasonData.tournaments[i - 1].desc, mmr, String(mmr), join]);
    }

    const options = {
        pointSize: 5, pointShape: 'circle', lineWidth: 2, shadow: true,
        backgroundColor: { fill: 'transparent' },
        hAxis: {
            slantedText: false, textStyle: { fontSize: 14, color: 'white', auraColor: '#99208d', opacity: 0.6 }
        },
        vAxis: {
            textStyle: { fontSize: 14, color: 'white', auraColor: '#99208d', opacity: 0.6 },
            minValue: 1400, maxValue: 1800, gridlines: { count: 5, color: 'pink' }, minorGridlines: { count: 0 }
        },
        annotations: {
            textStyle: { fontName: 'Times-Roman', fontSize: 18, color: 'white', auraColor: '#99208d', opacity: 0.8 }
        },
        chartArea: { left: '50', right: '20', top: '5%', bottom: '20%' },
        width: data.getNumberOfRows() * 90,
        height: 350,
        legend: 'none',
        series: [{ color: '#8eff9a' }]
    };

    const chart = new google.visualization.LineChart(document.getElementById('donutchart'));
    chart.draw(data, options);
}