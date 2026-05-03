// /ccl/js/ccl_common.js
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

    addFloatingSwitch();
}

function changeCCLSeason(year) {
    const params = new URLSearchParams(window.location.search);
    const newSeason = year === 0 ? 'latest' : year.toString();
    if (params.get('season') === newSeason) return;
    params.set('season', newSeason);
    window.location.search = params.toString();
}

// 悬浮按钮（与 TFA 共用同一逻辑）
function addFloatingSwitch() {
    if (document.getElementById('site-switch-btn')) return;

    const isCCL = window.location.pathname.includes('/ccl/');
    const btn = document.createElement('div');
    btn.id = 'site-switch-btn';
    btn.style.cssText = `
        position: fixed;
        top: 10px;
        left: calc((100% - 720px) / 2 - 80px);
        width: 60px;
        height: 60px;
        z-index: 2000;
        cursor: pointer;
        border-radius: 50%;
        box-shadow: 0 0 10px #9636b2;
        background: #420862;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        color: #fff;
        text-align: center;
        line-height: 1.2;
    `;

    const fallbackText = isCCL ? '天格会' : '高校联赛';
    const imgSrc = isCCL ? '/img/btn_tfa.png' : '/img/btn_ccl.png';

    const img = new Image();
    img.src = imgSrc;
    img.style.cssText = 'width:100%;height:100%;border-radius:50%;object-fit:cover;';
    img.onerror = function () {
        btn.innerHTML = fallbackText;
    };
    img.onload = function () {
        btn.innerHTML = '';
        btn.appendChild(img);
    };
    btn.appendChild(img);

    btn.addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);
        const season = params.get('season') || 'latest';
        const target = isCCL ? '/' : '/ccl/';
        window.location.href = `${target}index.html?season=${season}`;
    });

    document.body.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', initCCLCommon);