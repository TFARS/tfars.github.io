// js/script_tour.js
// 状态变量
let checks = [
    { text: "DPCUP", value: 1 },
    { text: "月赛", value: 2 },
    { text: "初中级", value: 3 },
    { text: "", value: 4 },
    { text: "升龙杯", value: 1 }
];
const finalists = new Map();
const finalists_index = new Map();
let banlist = [];
let panelCount = 0;
let qualify_count = 0;
let boolShunyan = false;

document.addEventListener('DOMContentLoaded', () => {
    const checkData = setInterval(() => {
        if (AppState.isDataLoaded) {
            clearInterval(checkData);
            initTournaments();
        }
    }, 50);
});

async function initTournaments() {
    const seasonData = getCurrentSeasonData();
    const settings = AppState.settings.qualifys;
    if (!seasonData) return;

    // 1. 处理规则显示（兼容旧逻辑）
    if (AppState.currentSeason === 0) {
        const rule = document.getElementById('rule');
        rule.innerHTML = "<li>2025年天格会年终总决赛(TFAAC)门票来源：<li>历届升龙杯的冠亚军（名额顺延）<li>每月天格会月赛冠军（名额顺延）<li>赛季结束时积分榜最高分玩家（名额顺延）<li>TFAAC LCQ 冠军";
    }

    // 2. 处理赛事收纳板和资格
    [...seasonData.tournaments].reverse().forEach(tour => {
        addAccordionPanel(tour);
        checkQualify(tour, settings);
    });

    // 3. 处理积分榜顺延资格
    for (const player of seasonData.members) {
        if (!banlist.includes(player.tfaName)) {
            finalists.set(player.tfaName, ["当前积分榜最高积分（顺延）"]);
            finalists_index.set(finalists.size, player.tfaName);
            boolShunyan = false;
            break;
        }
        boolShunyan = true;
    }

    // 4. 渲染Final Table
    renderFinalTable();

    // 5. 兼容旧逻辑的特殊处理
    if (AppState.currentSeason === 0) {
        const ft = document.getElementById('final');
        const row = ft.insertRow();
        row.insertCell(0).innerText = "zzZ";
        row.insertCell(1).innerHTML = 'TFAAC LCQ 冠军<br>';
    }
}

// --- 资格逻辑函数 (保持原有逻辑，封装参数) ---
function getKeyByValue(object, value) {
    for (let key in object) {
        if (object.hasOwnProperty(key) && object[key] === value) return key;
    }
    return null;
}

function checkQualify(tour, settings) {
    const title = tour.desc.toLowerCase();
    let type = 4;
    for (let check of checks) {
        if (title.includes(check.text.toLowerCase())) {
            type = check.value;
            break;
        }
    }

    const number = Object.keys(tour.result).length;
    const shunyan = settings[tour.id].extension;
    qualify_count = settings[tour.id].count;

    for (let i = 1; i <= number; i++) {
        if (qualify_count > 0) {
            FinalListsPush(tour, i, qualify_count, shunyan);
        } else {
            return;
        }
    }
}

function FinalListsPush(tour, index, count, shunyan) {
    const name = getKeyByValue(tour.result, index);
    let honor = " 第" + index + "名";
    if (index === 1) honor = " 冠军";
    else if (index === 2) honor = " 亚军";
    else if (index === 3) honor = " 季军";

    const isShunyan = index > count;
    const suffix = isShunyan ? "（顺延）" : "";

    if (!banlist.includes(name)) {
        finalists.set(name, [tour.desc + honor + suffix]);
        finalists_index.set(finalists.size, name);
        banlist.push(name);
        qualify_count--;
    } else {
        if (!isShunyan) {
            finalists.get(name).push(tour.desc + honor);
        }
    }
}

function renderFinalTable() {
    const ft = document.getElementById('final');
    while (ft.rows.length > 1) ft.deleteRow(1);

    for (let i = 1; i <= 20; i++) {
        if (finalists_index.has(i)) {
            const row = ft.insertRow();
            const key = finalists_index.get(i);
            row.insertCell(0).innerText = key;
            row.insertCell(1).innerHTML = finalists.get(key).join('<br>');
        }
    }
}

// --- 收纳板逻辑 ---
function createAccordionPanel(tour) {
    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.id = `accordionItem-${panelCount++}`;

    // Header
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.onclick = () => toggleAccordion(header.nextElementSibling, header.querySelector('.accordion-arrow'));

    const text = document.createElement('span');
    text.className = 'accordion-text';
    text.textContent = tour.desc + tour.date;

    const arrow = document.createElement('span');
    arrow.className = 'accordion-arrow';
    arrow.innerHTML = '&#9650;';

    header.appendChild(text);
    header.appendChild(arrow);

    // Content
    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.style.maxHeight = '400px';

    // Table
    const table = document.createElement('table');
    table.className = 'tour-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['名次', '选手ID'].forEach(txt => {
        const th = document.createElement('th');
        th.textContent = txt;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const sorted = new Map([...Object.entries(tour.result)].sort((a, b) => a[1] - b[1]));
    for (const [key, value] of sorted) {
        const row = tbody.insertRow(-1);
        row.insertCell(0).textContent = value;
        row.insertCell(1).textContent = key;
    }
    table.appendChild(tbody);
    content.appendChild(table);

    item.appendChild(header);
    item.appendChild(content);
    return item;
}

function toggleAccordion(content, arrow) {
    if (content.style.maxHeight == '0px') {
        content.style.maxHeight = '400px';
        arrow.innerHTML = '&#9650;';
    } else {
        content.style.maxHeight = '0px';
        arrow.innerHTML = '&#9660;';
    }
}

function addAccordionPanel(tour) {
    const container = document.getElementById('accordionContainer');
    container.appendChild(createAccordionPanel(tour));
}