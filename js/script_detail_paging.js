document.addEventListener('DOMContentLoaded', () => {
    const totalPages = 1000; // 总页数，可以根据实际情况修改  
    let currentPage = 1;

    const currentPageSpan = document.getElementById('currentPage');  
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const gotoPageInput = document.getElementById('goto-page');
    const gotoBtn = document.getElementById('goto-btn');

    const updateUI = () => {
        console.log('GGGGG:' + currentPage);
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages;
    };

    // 更新当前页码显示  
    function updateCurrentPage() {
        // 更新URL锚点
        //window.location.href = 'detail.html?rank=' + currentPage;
        // 获取当前URL
        var currentUrl = new URL(window.location.href);
        console.log("CU:" + currentUrl);

        // 解析查询参数
        var queryParams = new URLSearchParams(currentUrl.search);
        console.log("QP:" + queryParams);
        var param = queryParams.get('rank');
        console.log("P:" + param);
        // 更新rank参数
        queryParams.set('rank', currentPage);
        console.log("QP:" + queryParams.toString());
        // 构建新的URL（保留season参数和其他可能的参数）
        var newUrl = currentUrl.origin + currentUrl.pathname + '?' + queryParams.toString();
        console.log("NU:" + newUrl);
        // 跳转到新URL
        window.location.href = newUrl;
    }

    // 上一页按钮点击事件  
    /*prevPageButton.addEventListener('click', () => {
        console.log("11111asdzxc:" + currentPage);
        if (currentPage > 1) {
            currentPage--;
            console.log("11111asdzxc:" + currentPage);
            updateCurrentPage();
        }
    });*/

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            console.log("CP:" + currentPage);
            updateCurrentPage();
        }
    });


    // 下一页按钮点击事件  
    nextPageButton.addEventListener('click', () => {
        console.log("CP:" + currentPage);
        currentPage++;
        console.log("CP:" + currentPage);
        updateCurrentPage();
    });

    // 前往按钮点击事件  
    gotoBtn.addEventListener('click', () => {
        const inputPage = parseInt(gotoPageInput.value, 10);
        if (!isNaN(inputPage) && inputPage > 0) {
            currentPage = inputPage;
            updateCurrentPage();
        } else {
            alert('请输入有效的页码');
        }
    });

    // 页面加载时，如果URL中有锚点，则解析并显示对应的页码
    //const search = window.location.search;
    var searchParams = new URLSearchParams(window.location.search);

    var currentRank = searchParams.get('rank');
    console.log("CRRR:" + currentRank);

    
    if (currentRank !== null) {
        currentPage = currentRank;
        gotoPageInput.placeholder = currentPage;
    }
    else {
        currentPage = 1;
    }

    updateUI();
});