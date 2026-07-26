document.addEventListener('DOMContentLoaded', async function () {
    // 等待数据就绪
    if (!DataService.isReady()) {
        await new Promise(resolve => {
            const check = setInterval(() => {
                if (DataService.isReady()) { clearInterval(check); resolve(); }
            }, 100);
        });
    }

    const params = new URLSearchParams(window.location.search);
    const season = window.__currentSeason || 'latest';
    const seasonData = DataService.getSeasonData(season);
    const allSettings = DataService.getSettings();
    const qualifys = allSettings.qualifys || {};
    const seasonYear = 2023 + seasonData.seasonID;
    const seasonIdStr = String(seasonData.seasonID); // "1", "2", "3" 等

    // ========== 决赛门票表格 ==========
    const finalTbody = document.querySelector('#final tbody');
    finalTbody.innerHTML = '';

    // 用于自动计算的变量
    const finalists = new Map();       // 选手 -> [资格描述数组]
    const finalIndex = new Map();      // 顺序 -> 选手名
    const banlist = [];                // 已获得资格的选手，防止重复

    // 辅助函数：根据名次从 result 对象中获取选手名
    function getKeyByValue(obj, value) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] === value) return key;
        }
        return null;
    }

    // 处理单个赛事的自动资格（所有赛季通用）
    function processAutoQualify(tour) {
        const tourSetting = qualifys[tour.id];
        if (!tourSetting || tourSetting.count <= 0) return;

        // 过滤 -1（DNF）选手，按名次升序
        const resultEntries = Object.entries(tour.result)
            .filter(([_, s]) => parseInt(s) > 0)
            .sort((a, b) => a[1] - b[1]);

        const directCount = tourSetting.count;        // 直通名额数
        const allowExtension = tourSetting.extension || false;
        let directRemaining = directCount;            // 剩余直通名额
        let extensionRemaining = 0;                   // 顺延名额（直通被让出时产生）

        for (const [name, standing] of resultEntries) {
            if (directRemaining <= 0 && extensionRemaining <= 0) break;

            const standingNum = parseInt(standing);
            const honor = { 1: '冠军', 2: '亚军', 3: '季军' }[standingNum] || `第${standingNum}名`;
            const isDirectSlot = directRemaining > 0;  // 是否处于直通名额内

            if (!banlist.includes(name)) {
                // 未获资格：入榜
                const isShunyan = !isDirectSlot;       // 不在直通名额内即为顺延
                const suffix = isShunyan ? '（顺延）' : '';
                finalists.set(name, [`${tour.desc} ${honor}${suffix}`]);
                finalIndex.set(finalists.size, name);
                banlist.push(name);
                if (isDirectSlot) directRemaining--;
                else extensionRemaining--;
            } else {
                // 已获资格
                if (isDirectSlot) {
                    // 占用直通名额：追加描述，消耗直通名额
                    finalists.get(name).push(`${tour.desc} ${honor}`);
                    directRemaining--;
                    // 若开启顺延，让出一个顺延名额给后续选手
                    if (allowExtension) extensionRemaining++;
                }
                // 顺延位上的已获资格选手：不消耗名额也不让出，跳过
            }
        }
    }

    // 自动计算：所有赛季都执行，倒序遍历（后举办的赛事先处理）
    seasonData.tournaments.slice().reverse().forEach(tour => processAutoQualify(tour));

    // 补充积分最高且未获资格的选手（顺延）
    // 若积分榜前列选手已有名额，顺延到后面才加"（顺延）"字样；
    // 若首位选手就未获资格，他本身就是最高分，不加顺延字样
    let skippedCount = 0;
    for (const member of seasonData.members) {
        if (!banlist.includes(member.tfaName)) {
            const suffix = skippedCount > 0 ? '（顺延）' : '';
            finalists.set(member.tfaName, [`当前积分榜最高积分${suffix}`]);
            finalIndex.set(finalists.size, member.tfaName);
            break;
        }
        skippedCount++;
    }

    // 合并手动资格（所有赛季均执行）
    const manualList = (allSettings.manual && allSettings.manual[seasonIdStr])
        ? allSettings.manual[seasonIdStr]
        : [];
    const manualInserted = new Set();

    manualList.forEach(entry => {
        // 使用 id 和 desc 字段（不再依赖 FullInfo）
        const playerName = entry.id;
        const description = entry.desc;
        if (!playerName || !description) return;

        if (!finalists.has(playerName) && !manualInserted.has(playerName)) {
            finalists.set(playerName, [description]);
            finalIndex.set(finalists.size, playerName);
            manualInserted.add(playerName);
        } else if (!manualInserted.has(playerName)) {
            finalists.get(playerName).push(description);
            manualInserted.add(playerName);
        }
    });

    // 渲染决赛表格（按 finalIndex 顺序）
    for (let i = 1; i <= finalIndex.size; i++) {
        if (finalIndex.has(i)) {
            const row = finalTbody.insertRow();
            row.insertCell(0).textContent = finalIndex.get(i);
            row.insertCell(1).innerHTML = finalists.get(finalIndex.get(i)).join('<br>');
        }
    }

    // LCQ 检测：若当前赛季没有 LCQ 赛事，则追加"待定"占位行
    const hasLCQ = seasonData.tournaments.some(t => /LCQ/i.test(t.desc));
    if (!hasLCQ) {
        const lcqRow = finalTbody.insertRow();
        lcqRow.insertCell(0).textContent = '待定';
        lcqRow.insertCell(1).innerHTML = 'TFAAC LCQ 冠军<br>';
    }

    // ========== 资格规则描述 ==========
    const ruleElement = document.getElementById('rule');
    if (seasonData.seasonID <= 2) {  // 2024、2025 赛季
        ruleElement.innerHTML = '<li>本赛季天格会年终总决赛(TFAAC)门票资格如下：</li>';
    } else {  // 2026 及以后
        ruleElement.innerHTML = `
            <li>本赛季天格会年终总决赛(TFAAC)门票来源：</li>
            <li>上赛季年终总决赛冠军</li>
            <li>本赛季升龙杯的冠亚军（名额顺延）</li>
            <li>每月天格会月赛的冠军（名额顺延）</li>
            <li>赛季结束时积分榜最高分玩家（名额顺延）</li>
            <li>年终总决赛LCQ冠军</li>
        `;
    }

    // ========== 赛事记录折叠面板 ==========
    const container = document.getElementById('accordionContainer');
    container.innerHTML = '';
    seasonData.tournaments.slice().reverse().forEach(tour => {
        const item = document.createElement('div');
        item.className = 'accordion-item';

        const header = document.createElement('div');
        header.className = 'accordion-header';
        header.innerHTML = `<span class="accordion-text">${tour.desc} ${tour.date}</span><span class="accordion-arrow">&#9650;</span>`;

        const content = document.createElement('div');
        content.className = 'accordion-content';
        content.style.maxHeight = '400px';

        // 固定列宽表格
        const table = document.createElement('table');
        table.className = 'tour-table';
        table.style.tableLayout = 'fixed';
        table.style.width = '100%';
        const headerRow = table.insertRow();
        const th1 = document.createElement('th');
        th1.textContent = '名次';
        th1.style.width = '30%';
        const th2 = document.createElement('th');
        th2.textContent = '选手ID';
        th2.style.width = '70%';
        headerRow.appendChild(th1);
        headerRow.appendChild(th2);

        Object.entries(tour.result).sort((a, b) => a[1] - b[1]).forEach(([name, standing]) => {
            const row = table.insertRow();
            row.insertCell(0).textContent = standing;
            row.insertCell(1).textContent = name;
        });
        content.appendChild(table);

        header.addEventListener('click', () => {
            if (content.style.maxHeight === '0px') {
                content.style.maxHeight = '400px';
                header.querySelector('.accordion-arrow').innerHTML = '&#9650;';
            } else {
                content.style.maxHeight = '0px';
                header.querySelector('.accordion-arrow').innerHTML = '&#9660;';
            }
        });

        item.appendChild(header);
        item.appendChild(content);
        container.appendChild(item);
    });
});