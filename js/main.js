document.addEventListener('DOMContentLoaded', async function () {
    // 强制等待数据就绪
    if (!DataService.isReady()) {
        await new Promise(resolve => { // 轮询等待
            const check = setInterval(() => {
                if (DataService.isReady()) { clearInterval(check); resolve(); }
            }, 100);
        });
    }

    const season = window.__currentSeason || 'latest';
    const seasonData = DataService.getSeasonData(season);

    const titleEl = document.getElementById('title-name');
    const seasonYear = 2023 + seasonData.seasonID;
    const latestTourDesc = seasonData.tournaments[0]?.desc || '';
    titleEl.innerHTML = `天格会积分排行榜-SF6 ${seasonYear}<br>更新于 ${latestTourDesc} 后`;

    const tbody = document.querySelector('#rankings tbody');
    tbody.innerHTML = '';
    seasonData.members.forEach((player, index) => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = index + 1;
        row.insertCell(1).textContent = player.tfaName;
        row.insertCell(2).textContent = player.displayMMR;
        row.insertCell(3).textContent = player.tfaIndex;
    });

    document.getElementById('rankings').addEventListener('click', function (e) {
        if (e.target.tagName === 'TD') {
            const rank = e.target.parentNode.cells[0].textContent;
            const url = `detail.html?rank=${encodeURIComponent(rank)}&season=${season}`;
            window.location.href = url;
        }
    });

    $("#search-leaderboard").keyup(function () {
        const value = this.value.toLowerCase();
        $("table#rankings tbody tr").each(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) !== -1);
        });
    });
});