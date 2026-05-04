// 站点切换按钮（所有页面统一）
(function () {
    function createSwitcher() {
        if (document.getElementById('site-switch-btn')) return;

        const isCCL = window.location.pathname.includes('/ccl/');
        const btn = document.createElement('div');
        btn.id = 'site-switch-btn';

        const fallbackText = isCCL ? 'TFA<br>积分榜' : 'CCL<br>积分榜';
        const imgSrc = isCCL ? '/img/btn_tfa.png' : '/img/btn_ccl.png';

        // 尝试图片，失败则显示文字
        const img = new Image();
        img.src = imgSrc;
        img.onerror = function () {
            btn.innerHTML = fallbackText;
        };
        img.onload = function () {
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createSwitcher);
    } else {
        createSwitcher();
    }
})();