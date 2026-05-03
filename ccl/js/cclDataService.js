// ccl/js/cclDataService.js
const CCLDataService = (() => {
    let data = null;
    let ready = false;

    async function load() {
        if (ready) return;
        try {
            const res = await fetch('/ccl/data/cclData.json');
            data = await res.json();
            ready = true;
            console.log('[CCLDataService] 数据加载完成，赛季数：', data.length);
        } catch (e) {
            console.error('[CCLDataService] 数据加载失败', e);
        }
    }

    function getSeasonList() {
        if (!ready) throw new Error('数据未加载');
        return data.map((season, index) => ({
            index,
            year: 2025 + season.seasonID, // 根据你的 seasonID 调整基准
            isLatest: index === data.length - 1
        }));
    }

    function getSeasonData(seasonYear) {
        if (!ready) throw new Error('数据未加载');
        if (seasonYear === 'latest' || !seasonYear) return data[data.length - 1];
        const year = parseInt(seasonYear, 10);
        const idx = data.findIndex(s => 2025 + s.seasonID === year);
        if (idx !== -1) return data[idx];
        console.warn('[CCLDataService] 赛季未找到，返回最新赛季');
        return data[data.length - 1];
    }

    window.CCLDataService = { load, getSeasonList, getSeasonData, isReady: () => ready };
    return window.CCLDataService;
})();