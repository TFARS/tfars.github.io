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

    // 处理单个赛事的自动资格（仅新赛季使用）
    function processAutoQualify(tour) {
        const tourSetting = qualifys[tour.id];
        if (!tourSetting || tourSetting.count <= 0) return;

        const resultEntries = Object.entries(tour.result).sort((a, b) => a[1] - b[1]);
        let remaining = tourSetting.count;
        const allowExtension = tourSetting.extension || false;

        for (let i = 0; i < resultEntries.length; i++) {
            if (remaining <= 0 && !allowExtension) break;

            const [name, standing] = resultEntries[i];
            const standingNum = parseInt(standing);
            const isDirect = i < tourSetting.count;
            const isShunyan = !isDirect && allowExtension;

            if (!isDirect && !isShunyan) continue;

            let honor = '';
            switch (standingNum) {
                case 1: honor = '冠军'; break;
                case 2: honor = '亚军'; break;
                case 3: honor = '季军'; break;
                default: honor = `第${standingNum}名`;
            }
            const suffix = isShunyan ? '（顺延）' : '';

            if (!banlist.includes(name)) {
                finalists.set(name, [`${tour.desc} ${honor}${suffix}`]);
                finalIndex.set(finalists.size, name);
                banlist.push(name);
                if (isDirect) remaining--;
            } else {
                // 已获得资格，若为直通名额且未顺延，则追加描述
                if (isDirect && !isShunyan) {
                    finalists.get(name).push(`${tour.desc} ${honor}`);
                }
            }
        }
    }

    // 自动计算：适用于赛季 >= 2026（即 seasonID >= 3）
    if (seasonData.seasonID >= 3) {
        seasonData.tournaments.slice().reverse().forEach(tour => processAutoQualify(tour));

        // 补充积分最高且未获资格的选手
        for (const member of seasonData.members) {
            if (!banlist.includes(member.tfaName)) {
                finalists.set(member.tfaName, ['当前积分榜最高积分（顺延）']);
                finalIndex.set(finalists.size, member.tfaName);
                break;
            }
        }
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

    // ========== 资格规则描述 ==========
    const ruleElement = document.getElementById('rule');
    if (seasonData.seasonID <= 2) {  // 2024、2025 赛季
        ruleElement.innerHTML = '<li>本赛季天格会年终总决赛(TFAAC)门票资格如下：</li>';
    } else {  // 2026 及以后
        ruleElement.innerHTML = `
            <li>本赛季天格会年终总决赛(TFAAC)门票来源：</li>
            <li>上赛季年终总决赛冠军 </li>
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