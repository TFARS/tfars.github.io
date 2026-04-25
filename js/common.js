// js/common.js
// 全局状态管理
const AppState = {
    data: null,
    settings: null,
    currentSeason: 0, // 0表示最新赛季
    isDataLoaded: false
};

// DOM元素缓存
const DOMCache = {
    tabContainer: null
};

// ------------------------------
// 工具函数
// ------------------------------
// 获取URL参数
function getQueryParam(param) {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(param);
}

// 设置URL参数（不刷新页面）
function setQueryParam(param, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(param, value);
    window.history.replaceState({}, '', url);
}

// 构建带参数的跳转URL
function buildUrlWithParams(baseUrl) {
    const queryString = window.location.search.slice(1);
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// 防抖函数（用于搜索优化）
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ------------------------------
// 数据加载模块
// ------------------------------
async function loadData() {
    if (AppState.isDataLoaded) return;

    try {
        // 并行加载数据和设置
        const [dataRes, settingsRes] = await Promise.all([
            fetch('data/data.json'),
            fetch('data/settings.json')
        ]);

        if (!dataRes.ok) throw new Error('Failed to load data.json');
        if (!settingsRes.ok) throw new Error('Failed to load settings.json');

        AppState.data = await dataRes.json();
        AppState.settings = await settingsRes.json();
        AppState.isDataLoaded = true;
    } catch (error) {
        console.error('数据加载失败:', error);
        alert('数据加载失败，请刷新页面重试');
    }
}

// 获取当前赛季的数据
function getCurrentSeasonData() {
    if (!AppState.data) return null;
    // 支持按索引或年份访问
    const index = typeof AppState.currentSeason === 'number'
        ? AppState.currentSeason
        : (AppState.data.length - 1 - (AppState.currentSeason - 2024)); // 假设2024是第一个赛季
    return AppState.data[Math.max(0, Math.min(index, AppState.data.length - 1))];
}

// ------------------------------
// Tab栏与赛季管理模块
// ------------------------------
function initTabAndSeason() {
    // 1. 初始化赛季
    const seasonParam = getQueryParam('season');
    if (seasonParam) {
        AppState.currentSeason = seasonParam === '2024' ? 1 : 0; // 兼容旧逻辑
    }

    // 2. 生成Tab栏HTML（消除重复代码）
    renderTabBar();

    // 3. 绑定Tab点击事件
    bindTabEvents();
}

function renderTabBar() {
    // 1. 生成“最新赛季”选项
    let seasonOptions = '<a class="dropdown-item" onclick="changeSeason(0)">最新赛季</a>';

    // 2. 生成历史赛季选项（倒序，排除当前最新的赛季，避免重复）
    if (AppState.data) {
        // 从倒数第二个开始遍历（i = length - 2），因为最新的已经在上面了
        for (let i = AppState.data.length - 2; i >= 0; i--) {
            const year = 2023 + AppState.data[i].seasonID;
            seasonOptions += `<a class="dropdown-item" onclick="changeSeason(${i})">${year}赛季</a>`;
        }
    } else {
        // 兼容旧数据未加载情况
        seasonOptions += '<a class="dropdown-item" onclick="changeSeason(1)">2024赛季</a>';
    }

    const tabHtml = `
        <div class="tab-container">
            <a href="index.html" class="tab" data-tab="tab1">积分榜</a>
            <a href="detail.html" class="tab" data-tab="tab2">详细信息</a>
            <a href="tournaments.html" class="tab" data-tab="tab3">赛事信息</a>
            <div class="dropdown-tab" data-tab="tab4">
                <a id="season">赛季切换</a>
                <div class="dropdown">${seasonOptions}</div>
            </div>
        </div>
    `;

    const tabSection = document.querySelector('.tab-section');
    if (tabSection) {
        tabSection.innerHTML = tabHtml;
        updateSeasonLabel();
    }
}

function bindTabEvents() {
    document.querySelectorAll('.tab').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = buildUrlWithParams(button.getAttribute('href'));
        });
    });
}

function updateSeasonLabel() {
    const seasonTab = document.getElementById('season');
    if (!seasonTab) return;

    // 逻辑：0永远显示“最新赛季”，其他显示对应年份
    if (AppState.currentSeason === 0) {
        seasonTab.textContent = "最新赛季";
    } else if (AppState.data) {
        const year = 2023 + AppState.data[AppState.currentSeason].seasonID;
        seasonTab.textContent = year + "赛季";
    } else {
        // 兼容旧逻辑
        seasonTab.textContent = (AppState.currentSeason === 1 ? "2024" : "") + "赛季";
    }
}

// 全局赛季切换函数
window.changeSeason = function (seasonIndex) {
    if (AppState.currentSeason === seasonIndex) return;

    AppState.currentSeason = seasonIndex;

    // 更新URL
    const url = new URL(window.location.href);
    if (seasonIndex === 0) {
        url.searchParams.delete('season');
    } else {
        // 兼容旧的年份参数逻辑，同时支持新索引
        const year = AppState.data ? (2023 + AppState.data[seasonIndex].seasonID) : (seasonIndex === 1 ? 2024 : 0);
        url.searchParams.set('season', year);
    }
    window.location.href = url.toString();
};

// ------------------------------
// 初始化入口
// ------------------------------
async function initApp() {
    await loadData(); // 先加载数据
    initTabAndSeason(); // 再渲染Tab（这样赛季列表是动态的）
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);