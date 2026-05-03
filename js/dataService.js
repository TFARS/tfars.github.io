const DataService = (() => {
    let data = null;
    let settings = null;
    let ready = false;
    let dataUrl = '/data/data.json';
    let settingsUrl = '/data/settings.json';

    // 根据当前页面路径自动判断
    if (window.location.pathname.includes('/ccl/')) {
        dataUrl = '/ccl/data/league_data.json';
    }

    async function load() {
        if (ready) return;
        try {
            const resp = await fetch(dataUrl);
            if (!resp.ok) throw new Error('Data not found');
            data = await resp.json();
            const settingsResp = await fetch(settingsUrl).catch(() => ({ json: () => ({}) }));
            settings = await settingsResp.json();
            ready = true;
        } catch (e) {
            console.error('[DataService] 加载失败', e);
        }
    }

    function getSeasonList() {
        if (!ready) return [];
        return data.map((s, i) => ({
            index: i,
            year: 2023 + s.seasonID,   // 高校联赛也用此映射
            name: s.seasonName || (2023 + s.seasonID + '赛季'),
            isLatest: i === 0
        }));
    }

    function getSeasonData(seasonYear) {
        if (!ready) throw new Error('数据未加载');
        if (seasonYear === 'latest' || !seasonYear) return data[0];
        const year = parseInt(seasonYear, 10);
        const idx = data.findIndex(s => 2023 + s.seasonID === year);
        console.log(`[DataService] 请求赛季 ${year}，找到索引 ${idx}`);
        if (idx !== -1) return data[idx];
        console.error(`[DataService] 找不到赛季 ${year}，强制返回最新赛季`);
        return data[0];  // 防止报错，但保留日志
    }

    function getSettings() {
        if (!ready) throw new Error('数据未加载');
        return settings;
    }

    // 暴露到全局便于检查
    window.DataService = { load, getSeasonList, getSeasonData, getSettings, isReady: () => ready };

    return { load, getSeasonList, getSeasonData, getSettings, isReady: () => ready };
})();