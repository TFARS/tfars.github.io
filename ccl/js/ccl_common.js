async function initCCLCommon() {
    try {
        await CCLDataService.load();
    } catch (e) {
        console.error('CCL 数据加载失败', e);
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const seasonParam = params.get('season') || 'latest';
    window.__currentSeason = seasonParam;

    const seasonLabel = document.getElementById('season');
    if (seasonLabel) {
        const seasons = CCLDataService.getSeasonList();
        const current = seasons.find(s =>
            (seasonParam === 'latest' && s.isLatest) || s.year === parseInt(seasonParam)
        );
        seasonLabel.textContent = current
            ? (current.isLatest ? '最新赛季' : `${current.year}赛季`)
            : '最新赛季';
    }

    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        dropdown.innerHTML = '';
        CCLDataService.getSeasonList().forEach(season => {
            const a = document.createElement('a');
            a.className = 'dropdown-item';
            a.textContent = season.isLatest ? '最新赛季' : `${season.year}赛季`;
            a.href = '#';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                changeCCLSeason(season.year);
            });
            dropdown.appendChild(a);
        });
    }

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

    // 切换按钮由 site-switcher.js 负责
}

function changeCCLSeason(year) {
    const params = new URLSearchParams(window.location.search);
    const newSeason = year === 0 ? 'latest' : year.toString();
    if (params.get('season') === newSeason) return;
    params.set('season', newSeason);
    window.location.search = params.toString();
}

document.addEventListener('DOMContentLoaded', initCCLCommon);