// 等待页面 DOM 和数据都准备好
async function initCommon() {
    try {
        await DataService.load();
    } catch (e) {
        console.error('数据加载失败', e);
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const seasonParam = params.get('season') || 'latest';
    window.__currentSeason = seasonParam; // 存储当前赛季值，供其他脚本使用

    // 更新赛季悬浮标签文字
    const seasonLabel = document.getElementById('season');
    if (seasonLabel) {
        const seasons = DataService.getSeasonList();
        const current = seasons.find(s =>
            (seasonParam === 'latest' && s.isLatest) || s.year === parseInt(seasonParam)
        );
        seasonLabel.textContent = current
            ? (current.isLatest ? '最新赛季' : `${current.year}赛季`)
            : '最新赛季';
    }

    // 动态生成下拉菜单
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        dropdown.innerHTML = '';
        DataService.getSeasonList().forEach(season => {
            const a = document.createElement('a');
            a.className = 'dropdown-item';
            a.textContent = season.isLatest ? '最新赛季' : `${season.year}赛季`;
            a.href = '#';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                changeSeason(season.year);
            });
            dropdown.appendChild(a);
        });
    }

    // Tab 点击携带赛季参数
    document.querySelectorAll('.tab').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const targetUrl = this.getAttribute('href');
            const newParams = new URLSearchParams(window.location.search);
            if (seasonParam) newParams.set('season', seasonParam);
            const qs = newParams.toString();
            window.location.href = qs ? `${targetUrl}?${qs}` : targetUrl;
        });
    });
}

// 定义赛季切换函数
function changeSeason(year) {
    const params = new URLSearchParams(window.location.search);
    const newSeason = year === 0 ? 'latest' : year.toString();
    if (params.get('season') === newSeason) {
        console.log('[changeSeason] 相同赛季，无需切换');
        return;
    }
    params.set('season', newSeason);
    console.log('[changeSeason] 即将跳转到:', params.toString());
    window.location.search = params.toString();
}

// 在 DOM 加载时启动
document.addEventListener('DOMContentLoaded', initCommon);