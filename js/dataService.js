const DataService = (() => {
    let data = null;
    let settings = null;
    let ready = false;

    async function load() {
        if (ready) return;
        try {
            const [dataRes, settingsRes] = await Promise.all([
                fetch('/data/data.json').then(r => r.json()),
                fetch('/data/settings.json').then(r => r.json()).catch(() => ({ qualifys: {} }))
            ]);
            data = dataRes;
            settings = settingsRes;
            ready = true;
            console.log(`[DataService] 数据加载完成，赛季数：${data.length}`, data.map((s, i) => `索引${i}: ${2023 + s.seasonID}赛季`));
        } catch (e) {
            console.error('[DataService] 数据加载失败', e);
        }
    }

    function getSeasonList() {
        if (!ready) throw new Error('数据未加载');
        const list = data.map((season, index) => ({
            index,
            year: 2023 + season.seasonID,
            isLatest: index === 0
        }));
        console.log('[DataService] 赛季列表:', list);
        return list;
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

    return window.DataService;
})();