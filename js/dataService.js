const DataService = (() => {
    const dataUrl = '/data/tfarank_v5.json';
    const settingsUrl = '/data/tfarank_v5_settings.json';
    let data = null;
    let settings = null;
    let ready = false;

    // tfarank_v5 为规范化结构（赛事级 results/matches），
    // 这里一次性还原为页面既有的赛季/成员/赛事结构，避免改动业务层与界面
    function buildSeason(raw) {
        // 新数据为正序，页面约定 [0] 为最新，故反转
        const tournaments = raw.tournaments.slice().reverse();

        // 每场赛事的成绩按选手索引，避免后续重复查找
        const resultIndex = tournaments.map(t => {
            const map = new Map();
            for (const r of t.results) map.set(r.playerId, r);
            return map;
        });

        const tourList = tournaments.map(t => {
            // 旧结构只保留实际参赛选手的名次（-1 为小组淘汰/无成绩）
            const result = {};
            for (const r of t.results) {
                if (r.participated) result[r.playerId] = r.placing;
            }
            return {
                id: t.id,
                desc: t.name,
                code: t.code,
                date: t.date,
                result
            };
        });

        const members = raw.players.map(p => {
            const name = p.tfaName;

            // 该选手首个有成绩记录的赛事下标（倒序数组，值越大越早）
            let first = -1;
            for (let i = tournaments.length - 1; i >= 0; i--) {
                if (resultIndex[i].has(name)) { first = i; break; }
            }

            // 各赛事累计衰减（按时间正序累加）
            const decayAt = new Array(tournaments.length).fill(0);
            let decaySum = 0;
            for (let i = tournaments.length - 1; i >= 0; i--) {
                const r = resultIndex[i].get(name);
                if (r) decaySum += r.decayDelta;
                decayAt[i] = decaySum;
            }

            // 后缀累计统计：下标 k 表示从第 k 场（含）到该选手最后一场
            const suffix = new Array(tournaments.length);
            let accM = 0, accW = 0, accR = 0, accRW = 0;
            for (let i = tournaments.length - 1; i >= 0; i--) {
                for (const m of tournaments[i].matches) {
                    if (m.p1 !== name && m.p2 !== name) continue;
                    const rounds = m.winnerRounds + m.loserRounds;
                    accM++;
                    accR += rounds;
                    if (m.winner === name) {
                        accW++;
                        accRW += m.winnerRounds;
                    } else {
                        accRW += m.loserRounds;
                    }
                }
                suffix[i] = { m: accM, w: accW, r: accR, rw: accRW };
            }

            // 积分曲线：从首个有计分记录的赛事到最新一场，未参赛的赛事也占一个点
            const historyDisplayMMR = [];
            const historyIn = [];
            const historyDQ = [];
            const historyDecay = [];
            if (first >= 0) {
                for (let i = 0; i <= first; i++) {
                    const r = resultIndex[i].get(name);
                    historyDisplayMMR.push(r.mmrAfter + decayAt[i]);
                    historyIn.push(!!r.participated);
                    historyDQ.push(r.dqType);
                    historyDecay.push(r.decayDelta !== 0);
                }
            }

            const totalMatches = [];
            const totalWinMatches = [];
            const totalRounds = [];
            const totalWinRounds = [];
            if (first >= 0) {
                for (let i = 0; i <= first; i++) {
                    totalMatches.push(suffix[i].m);
                    totalWinMatches.push(suffix[i].w);
                    totalRounds.push(suffix[i].r);
                    totalWinRounds.push(suffix[i].rw);
                }
            }

            // 历史荣誉：按时间正序
            const honor = {};
            for (let i = tournaments.length - 1; i >= 0; i--) {
                const r = resultIndex[i].get(name);
                if (r && r.participated && r.placing >= 1 && r.placing <= 3) {
                    honor[tournaments[i].name] = r.placing;
                }
            }

            // 参赛记录：最新在前；无比赛记录时与旧数据一致记为“缺席”
            const historyResult = [];
            let toursCount = 0;
            let lastTour = '';
            let lastTourRank = 0;
            for (let i = 0; i < tournaments.length; i++) {
                const r = resultIndex[i].get(name);
                if (!r || !r.participated) continue;
                toursCount++;
                if (!lastTour) {
                    lastTour = tournaments[i].name;
                    lastTourRank = r.placing;
                }
                const matches = tournaments[i].matches.filter(m => m.p1 === name || m.p2 === name);
                let rival = '缺席';
                let result = '缺席';
                if (matches.length > 0) {
                    const last = matches.reduce((a, b) => (a.order > b.order ? a : b));
                    rival = last.p1 === name ? last.p2 : last.p1;
                    result = last.winner === name
                        ? `${last.winnerRounds}:${last.loserRounds}`
                        : `${last.loserRounds}:${last.winnerRounds}`;
                }
                historyResult.push({ tour: tournaments[i].name, standing: r.placing, rival, result });
            }

            // 交手记录：总回合数降序，同值保持首次出现顺序（与旧数据一致）
            const adaMap = new Map();
            let seq = 0;
            for (let i = 0; i < tournaments.length; i++) {
                for (const m of tournaments[i].matches) {
                    const isP1 = m.p1 === name;
                    const isP2 = m.p2 === name;
                    if (!isP1 && !isP2) continue;
                    const opp = isP1 ? m.p2 : m.p1;
                    const won = m.winner === name;
                    let a = adaMap.get(opp);
                    if (!a) {
                        a = { tfaName: opp, totalMatch: 0, totalWin: 0, totalRound: 0, totalWinRound: 0, seq: seq++ };
                        adaMap.set(opp, a);
                    }
                    a.totalMatch++;
                    a.totalRound += m.winnerRounds + m.loserRounds;
                    a.totalWinRound += won ? m.winnerRounds : m.loserRounds;
                    if (won) a.totalWin++;
                }
            }

            const totals = first >= 0 ? suffix[0] : { m: 0, w: 0, r: 0, rw: 0 };
            const ada = [{
                tfaName: '[全部]',
                totalMatch: totals.m,
                totalWin: totals.w,
                totalRound: totals.r,
                totalWinRound: totals.rw
            }];
            [...adaMap.values()]
                .sort((a, b) => b.totalRound - a.totalRound || a.seq - b.seq)
                .forEach(a => ada.push({
                    tfaName: a.tfaName,
                    totalMatch: a.totalMatch,
                    totalWin: a.totalWin,
                    totalRound: a.totalRound,
                    totalWinRound: a.totalWinRound
                }));

            return {
                rank: p.rank,
                tfaName: p.tfaName,
                tfaIndex: p.tfaIndex,
                currentMMR: p.currentMMR,
                decayMMR: p.decayMMR,
                displayMMR: p.decayMMR
                    ? `${p.currentMMR + p.decayMMR}[${p.decayMMR}]`
                    : String(p.currentMMR),
                totalMatches,
                totalWinMatches,
                totalRounds,
                totalWinRounds,
                historyDisplayMMR,
                historyIn,
                historyDQ,
                historyDecay,
                showInfo: {
                    honor,
                    historyResult,
                    toursCount,
                    lastTour,
                    lastTourRank,
                    matches: totals.m,
                    matchesWin: totals.w,
                    rounds: totals.r,
                    roundsWin: totals.rw,
                    ada
                }
            };
        });

        return {
            seasonID: raw.seasonId,
            seasonName: '',
            members,
            tournaments: tourList
        };
    }

    async function load() {
        if (ready) return;
        try {
            const resp = await fetch(dataUrl);
            if (!resp.ok) throw new Error('Data not found');
            const raw = await resp.json();
            data = raw.seasons.slice().reverse().map(buildSeason);
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
