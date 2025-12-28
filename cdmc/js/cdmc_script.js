const rankingsBody = document.querySelector("#rankings > tbody");
var table = document.querySelector('#rankings > tbody');


fetch('/data_points/data.json')
    .then(response =>
    {
        if (response.ok)
        {
            return response.json(); // 将响应转换为JSON
        }
        throw new Error('Network response was not ok.');
    })
    .then(jsonData =>
    {
        //console.log(jsonData); // 这里你可以处理你的JSON数据
        // 例如，你可以将其显示在网页上
        //data = jsonData;
        //document.body.innerHTML = JSON.stringify(jsonData, null, 2);
        //jsonData.members.forEach(item =)
        //globalData = jsonData;
        //console.log(globalData);


        //var jsonString = JSON.stringify(jsonData);
        //localStorage.setItem("members", jsonString);
        console.log('testtest:' + globalSeason);
        var name = document.getElementById('title-name');
        var season = jsonData[globalSeason].seasonID + 2024;
        name.innerHTML = "CDMC积分榜-SF6 " + season + "<br>更新于 " + jsonData[globalSeason].tournaments[0].desc + " 后";

        jsonData[globalSeason].members.forEach(function (player, index) {
            var row = table.insertRow(-1); // 在表格末尾添加新行
            var cell1 = row.insertCell(0); // 当前名次
            var cell2 = row.insertCell(1); // 选手ID
            var cell3 = row.insertCell(2); // 选手积分
            cell1.textContent = index + 1;
            cell2.textContent = player.tfaName;
            cell3.textContent = player.displayPoints;
        });

    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });


document.getElementById('rankings').addEventListener('click', function (e) {
    var target = e.target; // 获取事件触发的元素
    if (target.tagName === 'TD') { // 确保点击的是单元格
        //var id = target.getAttribute('data-id'); // 获取ID
        var rank = target.parentNode.cells[0].textContent;
        var url = 'detail.html?rank=' + encodeURIComponent(rank); // 构造新的URL
        console.log(url); 
        window.location.href = url; // 跳转页面
    }
});

$("#search-leaderboard").keyup(function () {
    var value = this.value.toLowerCase();

    $("table").find("tr").each(function (index) {
        if (index === 0) return;

        var if_td_has = false;
        $(this).find('td').each(function () {
            if_td_has = if_td_has || $(this).text().toLowerCase().indexOf(value) !== -1; 
        });

        $(this).toggle(if_td_has);

    });
});



