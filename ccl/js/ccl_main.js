// /ccl/js/ccl_main.js
document.addEventListener('DOMContentLoaded', async () => {
    if (!CCLDataService.isReady()) {
        await CCLDataService.load();
    }

    const season = window.__currentSeason || 'latest';
    const seasonData = CCLDataService.getSeasonData(season);
    const maxPointsDefault = 50;

    const teamStats = {};
    seasonData.teams.forEach(team => {
        teamStats[team.id] = { ...team, wins: 0, losses: 0, totalPoints: 0 };
    });

    console.log('开始统计比赛数据...');

    // 统计所有比赛
    seasonData.tournaments.forEach(tour => {
        const maxPoints = tour.maxPoints || maxPointsDefault;
        tour.matches.forEach(match => {
            const { teamA, teamB, rounds, winner } = match;
            let ptsA = 0, ptsB = 0;

            // ---------- 弃权处理 ----------
            if (!rounds || rounds.length === 0) {
                console.log(`⚠️ 弃权比赛：${teamA} vs ${teamB}，胜者 ${winner}`);
                if (winner === teamA) {
                    ptsA = maxPoints;
                } else if (winner === teamB) {
                    ptsB = maxPoints;
                } else {
                    // 如果 winner 既不是 A 也不是 B，按平局处理（各得一半）
                    ptsA = Math.floor(maxPoints / 2);
                    ptsB = Math.floor(maxPoints / 2);
                }
            } else {
                // 正常轮次统计
                rounds.forEach(round => {
                    if (round.vanguard) {
                        if (round.vanguard[0] > round.vanguard[1]) ptsA += 10;
                        else if (round.vanguard[1] > round.vanguard[0]) ptsB += 10;
                    }
                    if (round.zhongjian) {
                        if (round.zhongjian[0] > round.zhongjian[1]) ptsA += 10;
                        else if (round.zhongjian[1] > round.zhongjian[0]) ptsB += 10;
                    }
                    if (round.dajiang) {
                        if (round.dajiang[0] > round.dajiang[1]) ptsA += 20;
                        else if (round.dajiang[1] > round.dajiang[0]) ptsB += 20;
                    }
                });
            }
            // ---------------------------------

            ptsA = Math.min(ptsA, maxPoints);
            ptsB = Math.min(ptsB, maxPoints);
            teamStats[teamA].totalPoints += ptsA;
            teamStats[teamB].totalPoints += ptsB;

            // ---------- 大比分统计（严格匹配 ID） ----------
            if (winner === teamA) {
                teamStats[teamA].wins++;
                teamStats[teamB].losses++;
                console.log(`✅ ${teamA} 胜 ${teamB}，积分 ${ptsA}:${ptsB}`);
            } else if (winner === teamB) {
                teamStats[teamB].wins++;
                teamStats[teamA].losses++;
                console.log(`✅ ${teamB} 胜 ${teamA}，积分 ${ptsA}:${ptsB}`);
            } else {
                // 平局或未知胜者，双方各计平局（这里暂不增加胜场，只记录）
                console.warn(`⚠️ 平局或未知胜者：${winner}，比赛 ${teamA} vs ${teamB}，双方不增加胜场`);
                // 可以视需求增加平局字段，但此处忽略
            }
        });
    });

    // 输出最终统计结果
    console.log('统计完成，队伍数据：', teamStats);

    // 积分榜（按胜场降序，再按总积分降序）
    const leaderboard = Object.values(teamStats).sort(
        (a, b) => b.wins - a.wins || b.totalPoints - a.totalPoints
    );

    const tbody = document.querySelector('#ccl-rankings tbody');
    tbody.innerHTML = '';
    leaderboard.forEach((team, idx) => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = idx + 1;
        const nameCell = row.insertCell(1);
        nameCell.innerHTML = `<img src="${team.logo}" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;margin-right:10px;">${team.name}`;
        row.insertCell(2).textContent = team.school;
        row.insertCell(3).textContent = `${team.wins} - ${team.losses}`;
        row.insertCell(4).textContent = team.totalPoints;
    });

    // 赛事预告（不变）
    const upcomingDiv = document.getElementById('ccl-upcoming');
    if (seasonData.upcoming && seasonData.upcoming.length > 0) {
        let html = `<table class="ccl-upcoming-table"><thead><tr><th>队伍A</th><th>VS</th><th>队伍B</th><th>日期</th></tr></thead><tbody>`;
        seasonData.upcoming.forEach(m => {
            const ta = seasonData.teams.find(t => t.id === m.teamA);
            const tb = seasonData.teams.find(t => t.id === m.teamB);
            html += `<tr>
                <td>
                    <div class="team-text">
                        <img src="${ta.logo}" class="team-logo-small">
                        <div class="team-text-inner">
                            <span class="team-name-main">${ta.name}</span>
                            <span class="team-school-small">${ta.school}</span>
                        </div>
                    </div>
                </td>
                <td class="vs-cell"><span class="vs">VS</span></td>
                <td>
                    <div class="team-text">
                        <img src="${tb.logo}" class="team-logo-small">
                        <div class="team-text-inner">
                            <span class="team-name-main">${tb.name}</span>
                            <span class="team-school-small">${tb.school}</span>
                        </div>
                    </div>
                </td>
                <td>${m.date}</td>
            </tr>`;
        });
        html += `</tbody></table>`;
        upcomingDiv.innerHTML = html;
    } else {
        upcomingDiv.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">暂无赛事预告</div>';
    }

    // 交战记录（含弃权提示）
    const recordContainer = document.getElementById('ccl-tournaments');
    recordContainer.innerHTML = ''; // 清空
    seasonData.tournaments.slice().reverse().forEach(tour => {
        const maxPoints = tour.maxPoints || maxPointsDefault;
        tour.matches.forEach(match => {
            const teamA = seasonData.teams.find(t => t.id === match.teamA);
            const teamB = seasonData.teams.find(t => t.id === match.teamB);
            const isAWin = match.winner === match.teamA;

            let ptsA = 0, ptsB = 0;
            let roundsDetail = '';
            if (!match.rounds || match.rounds.length === 0) {
                roundsDetail = '<div style="margin-left:20px; color: #ffaa00;">⚠️ 对方弃权，直接获胜</div>';
                ptsA = (match.winner === match.teamA) ? maxPoints : 0;
                ptsB = (match.winner === match.teamB) ? maxPoints : 0;
            } else {
                match.rounds.forEach((round, idx) => {
                    let line = `第${idx + 1}轮 `;
                    const parts = [];
                    if (round.vanguard) {
                        const [a, b] = round.vanguard;
                        const aClass = a > b ? 'score-win' : 'score-lose';
                        const bClass = b > a ? 'score-win' : 'score-lose';
                        parts.push(`先锋 <span class="${aClass}">${a}</span> : <span class="${bClass}">${b}</span>`);
                        if (a > b) ptsA += 10; else if (b > a) ptsB += 10;
                    }
                    if (round.zhongjian) {
                        const [a, b] = round.zhongjian;
                        const aClass = a > b ? 'score-win' : 'score-lose';
                        const bClass = b > a ? 'score-win' : 'score-lose';
                        parts.push(`中坚 <span class="${aClass}">${a}</span> : <span class="${bClass}">${b}</span>`);
                        if (a > b) ptsA += 10; else if (b > a) ptsB += 10;
                    }
                    if (round.dajiang) {
                        const [a, b] = round.dajiang;
                        const aClass = a > b ? 'score-win' : 'score-lose';
                        const bClass = b > a ? 'score-win' : 'score-lose';
                        parts.push(`大将 <span class="${aClass}">${a}</span> : <span class="${bClass}">${b}</span>`);
                        if (a > b) ptsA += 20; else if (b > a) ptsB += 20;
                    }
                    line += parts.join(' | ');
                    roundsDetail += `<div style="margin-left:20px; line-height:1.8;">${line}</div>`;
                });
            }
            const dispA = Math.min(ptsA, maxPoints);
            const dispB = Math.min(ptsB, maxPoints);

            const card = document.createElement('div');
            card.className = 'match-card';
            card.innerHTML = `
                <div class="match-header-grid">
                    <div class="team-name left" style="color:${isAWin ? '#00ff00' : '#ff4444'}">
                        <img src="${teamA.logo}" class="team-logo">
                        <div class="team-text">
                            <span class="team-name-main">${teamA.name}</span>
                            <span class="team-school-small">${teamA.school}</span>
                        </div>
                    </div>
                    <div class="score left-score" style="color:${isAWin ? '#00ff00' : '#ff4444'}">${dispA}</div>
                    <div class="vs">VS</div>
                    <div class="score right-score" style="color:${isAWin ? '#ff4444' : '#00ff00'}">${dispB}</div>
                    <div class="team-name right" style="color:${isAWin ? '#ff4444' : '#00ff00'}">
                        <div class="team-text">
                            <span class="team-name-main">${teamB.name}</span>
                            <span class="team-school-small">${teamB.school}</span>
                        </div>
                        <img src="${teamB.logo}" class="team-logo">
                    </div>
                </div>
                <div class="match-detail">
                    <div class="detail-title">详细比分</div>
                    ${roundsDetail}
                </div>
                <div class="match-footer">
                    赛事：${tour.desc} | 胜者：<span class="winner">${match.winner}</span>
                </div>
            `;
            recordContainer.appendChild(card);
        });
    });

    console.log('页面渲染完成');
});