// 页面加载时执行的函数
function onPageLoad() {
    if (queryParams.has('season')) {
        globalSeason = queryParams.get('season');
        globalSeason = globalSeason != 2024 ? 0 : 1;
        ShowSeason(globalSeason);
    }

    // 如果有其他参数，也可以在这里处理
}


function ShowSeason(season) {
    var seasonTab = document.getElementById('season');
    var seasonInfo = season == 0 ? "最新" : 2024;
    seasonTab.innerHTML = seasonInfo + "赛季";
}


var currentUrl = new URL(window.location.href);
var queryParams = new URLSearchParams(currentUrl.search);
var globalSeason = 0;
// 使用DOMContentLoaded事件确保DOM完全加载后再执行onPageLoad函数
document.addEventListener('DOMContentLoaded', onPageLoad);


// 假设页面加载时URL中已有查询信息，我们提取它
function getQueryString() {
    const queryString = window.location.search.slice(1); // 去掉开头的 '?'
    return queryString;
}



// 为所有标签页按钮添加点击事件监听器
document.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', function (event) {


        event.preventDefault(); // 阻止默认的链接跳转行为

        const queryString = getQueryString(); // 获取当前页面的查询信息
        const tabUrl = this.getAttribute('href'); // 获取标签页的目标URL

        let newUrl = tabUrl;
        if (queryString) {
            // 如果目标URL中已经有查询信息，则添加 '&'；否则直接添加 '?'
            newUrl += tabUrl.includes('?') ? `&${queryString}` : `?${queryString}`;
        }


        // 导航到新URL
        window.location.href = newUrl;
    });
});

function hrefSeason(season) {
    queryParams.set('season', season);
    var newUrl = currentUrl.origin + currentUrl.pathname + '?' + queryParams.toString();
    window.location.href = newUrl;
    //window.history.pushState({}, '', newUrl);
}



function changeSeason(season) {
    console.log('season:' + season);
    if (queryParams.has('season')) {
        var cs = queryParams.get('season');
        console.log('cs:' + cs);
        if (cs == season) {
            return;
        }
    }
    else if (season == 0) {
        console.log('season0');
        return;
    }
    hrefSeason(season);
    ShowSeason(season);

    /*var a = queryParams.get('globalSeason');
    if (a == null) {
        a = 0;
    }

    if (a == globalSeason) {
        return;
    }
    else {

    }*/
}
