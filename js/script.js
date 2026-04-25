// js/script.js
// 等待公共模块初始化完成
document.addEventListener('DOMContentLoaded', () => {
    // 监听数据加载完成事件
    const checkData = setInterval(() => {
        if (AppState.isDataLoaded) {
            clearInterval(checkData);
            initLeaderboard();
        }
    }, 50);
});

function initLeaderboard() {
    const seasonData = getCurrentSeasonData();
    if (!seasonData) return;

    const rankingsBody = document.querySelector("#rankings > tbody");
    const titleName = document.getElementById('title-name');

    // 1. 更新标题
    const seasonYear = 2023 + seasonData.seasonID;
    titleName.innerHTML = `天格会积分排行榜-SF6 ${seasonYear}<br>更新于 ${seasonData.tournaments[0].desc} 后`;

    // 2. 渲染表格
    renderRankings(seasonData.members);

    // 3. 绑定搜索事件（带防抖）
    const searchInput = document.getElementById('search-leaderboard');
    searchInput.addEventListener('keyup', debounce(function () {
        filterRankings(this.value.toLowerCase());
    }, 200));

    // 4. 绑定行点击事件
    document.getElementById('rankings').addEventListener('click', (e) => {
        if (e.target.tagName === 'TD') {
            const rank = e.target.parentNode.cells[0].textContent;
            // 携带赛季参数跳转
            const url = buildUrlWithParams(`detail.html?rank=${encodeURIComponent(rank)}`);
            window.location.href = url;
        }
    });
}

function renderRankings(members) {
    const tbody = document.querySelector("#rankings > tbody");
    tbody.innerHTML = ''; // 清空

    members.forEach((player, index) => {
        const row = tbody.insertRow(-1);
        row.insertCell(0).textContent = index + 1;
        row.insertCell(1).textContent = player.tfaName;
        row.insertCell(2).textContent = player.displayMMR;
        row.insertCell(3).textContent = player.tfaIndex;
    });
}

function filterRankings(value) {
    $("table").find("tr").each(function (index) {
        if (index === 0) return;
        let hasMatch = false;
        $(this).find('td').each(function () {
            if ($(this).text().toLowerCase().indexOf(value) !== -1) {
                hasMatch = true;
                return false; // break
            }
        });
        $(this).toggle(hasMatch);
    });
}