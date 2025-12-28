fetch('/data/data.json')
    .then(response => {
        if (response.ok) {
            return response.json(); // 将响应转换为JSON
        }
        throw new Error('Network response was not ok.');
    })
    .then(jsonData => {
        fetch('/data/settings.json')
            .then(response => {
                if (response.ok) {
                    return response.json(); // 将响应转换为JSON
                }
                throw new Error('Network response was not ok.');
            })
            .then(settingData => {
                //console.log(settingData.qualifys[14310995]);
                //settingData.qualifys[]
                //const settingObject = JSON.parse(settingData.qualifys);
                settings = settingData.qualifys;

                console.log(settings);

                jsonData[globalSeason].tournaments.reverse().forEach(function (tour) {
                    addAccordionPanel(tour);
                    checkQualify(tour);
                });


                for (const player of jsonData[globalSeason].members) {
                    if (!banlist.includes(player.tfaName)) {
                        //finalist[2].push(player.tfaName + "(暂)");
                        let beforeLCQ = ""
                        finalists.set(player.tfaName + beforeLCQ, ["当前积分榜最高积分（顺延）"]);
                        finalists_index.set(finalists.size, player.tfaName + beforeLCQ);
                        boolShunyan = false;
                        break;
                    }
                    boolShunyan = true;
                };

                /*var ft = document.getElementById('final');
                var rows = ft.rows;
                for (i = 1; i <= 20; i++) {
                    console.log(finalists_index.get(i));
                    if (finalists_index.has(i)) {
                        let key = finalists_index.get(i);
                        rows[i].cells[0].innerText = key;

                        let arrayString = finalists.get(key).join('<br>');

                        rows[i].cells[1].innerHTML = arrayString;
                    }
                }*/

                var ft = document.getElementById('final');
                // 清空表格中除表头外的所有行（可选）
                while (ft.rows.length > 1) {
                    ft.deleteRow(1);
                }

                for (i = 1; i <= 20; i++) {
                    if (finalists_index.has(i)) {
                        console.log(finalists_index.get(i));

                        var row = ft.insertRow();
                        var cell1 = row.insertCell(0);
                        var cell2 = row.insertCell(1);

                        let key = finalists_index.get(i);
                        cell1.innerText = key;
                        let arrayString = finalists.get(key).join('<br>');
                        cell2.innerHTML = arrayString;
                    }
                }

                if (globalSeason == 0) {
                    var rule = document.getElementById('rule');
                    rule.innerHTML = "<li>2025年天格会年终总决赛(TFAAC)门票来源：<li>历届升龙杯的冠亚军（名额顺延）<li>每月天格会月赛冠军（名额顺延）<li>赛季结束时积分榜最高分玩家（名额顺延）<li>TFAAC LCQ 冠军";


                    var row = ft.insertRow();
                    var cell1 = row.insertCell(0);
                    var cell2 = row.insertCell(1);

                    //let key = finalists_index.get(i);
                    cell1.innerText = "zzZ";
                    //let arrayString = finalists.get(key).join('<br>');
                    cell2.innerHTML = 'TFAAC LCQ 冠军<br>';
                    /*var list = document.getElementById('final');
                    list.style.display = 'none';*/
                    //return;
                }

            });


    })
    .catch(error => {
        if (error === 'INTERRUPTED') {
            console.log('待定！');
        }
        else {
            console.error('There has been a problem with your fetch operation:', error);
        }
    });


let checks = [
    { text: "DPCUP", value: 1 }, // 如果包含 "keyword1"，则设置值为 1
    { text: "月赛", value: 2 },  // 如果包含 "example"，则设置值为 2
    { text: "初中级", value: 3 },  // 如果都不包含，则默认值为 3
    { text: "", value: 4 },  // 如果都不包含，则默认值为 4
    { text: "升龙杯", value: 1 }   // 如果都不包含，则默认值为 3
];

let settings;

let finalist = [
    [],//升龙杯
    [],//月赛
    [],//积分
    ["（待定中）"],//LCQ
    [],//月赛顺延
];

const finalists = new Map();
const finalists_index = new Map();
const final_count = 0; //入选数量
let boolShunyan = false;

let banlist = [];

let panelCount = 0; // 用于生成唯一的收纳板ID
let qualify_count = 0;


function getKeyByValue(object, value) {
    for (let key in object) {
        if (object.hasOwnProperty(key) && object[key] === value) {
            return key; // 找到第一个匹配的键后立即返回
        }
    }
    return null; // 如果没有找到匹配的键，则返回null
}


function checkQualify(tour) {
    let title = tour.desc.toLowerCase();
    let type = 4;
    for (let check of checks) {
        if (title.includes(check.text.toLowerCase())) {
            type = check.value;
            break;
        }
    };
    let name = '';
    let number = Object.keys(tour.result).length;;
    console.log("检查赛事：" + tour.desc + " 类型：" + type + " 名额：" + number);
    let shunyan = settings[tour.id].extension;
    //boolShunyan = false;
    qualify_count = settings[tour.id].count;
    for (let i = 1; i <= number; i++) {
        if (qualify_count > 0) {
            FinalListsPush(tour, i, qualify_count, shunyan);
        }
        else {
            return;
        }
    }
}


function FinalListsPush(tour, index, count, shunyan) {
    let name = getKeyByValue(tour.result, index);
    let honor;
    switch (index) {
        case 1:
            honor = " 冠军";
            break;
        case 2:
            honor = " 亚军";
            break;
        case 3:
            honor = " 季军";
            break;
        default:
            honor = " 第" + index + "名";
            break;
    }
    //let number = settings[tour.id].count;
    let suffix = "";
    let boolShunyan = false;
    if (index > count) {
        boolShunyan = true;
        suffix = "（顺延）"
    }
    console.log(name + tour.desc + honor);
    if (!banlist.includes(name)) {
        finalists.set(name, [tour.desc + honor + suffix]);
        finalists_index.set(finalists.size, name);
        banlist.push(name);
        qualify_count--;
        return;
    }
    else {
        if (!boolShunyan) {
            finalists.get(name).push(tour.desc + honor);
        }
    }

}


function addPlayer(playerId, iniscore) {
    finalists.push({
        id: playerId,
        scores: iniscore
    });
}


function FinalListPush(tour,index,type,shunyan) {
    let name = getKeyByValue(tour.result, index);
    if (!banlist.includes(name)) {
        finalist[type - 1].push(name);
        banlist.push(name);
        return;
    }
    else if (shunyan) {
        index++;
        FinalListPush(tour, index, 5, shunyan);
    }
}



function createAccordionPanel(tour) {
    // 创建一个新的收纳板元素
    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';
    accordionItem.id = `accordionItem-${panelCount++}`;

    // 创建收纳板头部
    const accordionHeader = document.createElement('div');
    accordionHeader.className = 'accordion-header';
    accordionHeader.onclick = function () {
        toggleAccordion(this.nextElementSibling, this.querySelector('.accordion-arrow'));
    };

    const accordionText = document.createElement('span');
    accordionText.className = 'accordion-text';
    accordionText.textContent = tour.desc + tour.date;

    const accordionArrow = document.createElement('span');
    accordionArrow.className = 'accordion-arrow';
    accordionArrow.innerHTML = '&#9650;'; // 初始状态为收缩

    accordionHeader.appendChild(accordionText);
    accordionHeader.appendChild(accordionArrow);

    // 创建收纳板内容
    const accordionContent = document.createElement('div');
    accordionContent.className = 'accordion-content';
    accordionContent.style.maxHeight = '400px'; // 初始状态为收缩

    //创建表格
    //先创建表头，固定两列名次和ID
    const table = document.createElement('table');
    table.className = 'tour-table';
    const headerRow = document.createElement('tr');
    const headers = ['名次', '选手ID'];

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    table.appendChild(headerRow);

    //创建表体，从tour object中获取名次对应选手的KV结构，并逐个赋值
    const tbody = document.createElement('tbody');

    const result = tour.result;

    const map = new Map(Object.entries(result));

    let sortedMap = new Map([...map.entries()].sort((a, b) => a[1] - b[1]));

    for (const [key, value] of sortedMap) {
        var row = tbody.insertRow(-1);
        var cell1 = row.insertCell(0); // 当前名次
        var cell2 = row.insertCell(1); // 选手ID
        cell1.textContent = value;
        cell2.textContent = key;
    }

    table.appendChild(tbody);

    accordionContent.appendChild(table);

    // 将头部和内容添加到收纳板中
    accordionItem.appendChild(accordionHeader);
    accordionItem.appendChild(accordionContent);

    return accordionItem;
}

function toggleAccordion(content, arrow) {
    console.log("点击nav" + '最大高度：' + content.style.maxHeight)
    // 切换内容高度和箭头方向
    if (content.style.maxHeight == '0px') {
        console.log('应该展开');
        //content.style.maxHeight = content.scrollHeight + 'px';
        content.style.maxHeight = '400px';
        arrow.innerHTML = '&#9650;'; // 切换为上箭头
    } else {
        console.log('应该收缩');
        content.style.maxHeight = '0px';
        arrow.innerHTML = '&#9660;'; // 切换为下箭头
    }

    // 可选：添加或移除高亮效果
    // const accordionItem = content.parentElement;
    // accordionItem.classList.toggle('highlight');
}

function addAccordionPanel(tour) {
    // 生成一个新的标题（例如，使用面板计数）
    // 创建新的收纳板并添加到容器中
    const newPanel = createAccordionPanel(tour);
    const container = document.getElementById('accordionContainer');
    container.appendChild(newPanel);
}