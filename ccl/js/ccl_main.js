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

    // 统计所有比赛
    seasonData.tournaments.forEach(tour => {
        const maxPoints = tour.maxPoints || maxPointsDefault;
        tour.matches.forEach(match => {
            const { teamA, teamB, rounds, winner } = match;
            let ptsA = 0, ptsB = 0;

            // ====== 新增：弃权处理 ======
            if (rounds.length === 0) {
                // 胜利方直接获得 maxPoints，失败方 0 分
                if (winner === teamA) {
                    ptsA = maxPoints;
                } else {
                    ptsB = maxPoints;
                }
                // 大比分统计仍按 winner 处理（放在后面统一处理）
            } else {
                // 原有轮次积分统计
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
            // ==========================

            ptsA = Math.min(ptsA, maxPoints);
            ptsB = Math.min(ptsB, maxPoints);
            teamStats[teamA].totalPoints += ptsA;
            teamStats[teamB].totalPoints += ptsB;
            if (winner === teamA) {
                teamStats[teamA].wins++; teamStats[teamB].losses++;
            } else {
                teamStats[teamB].wins++; teamStats[teamA].losses++;
            }
        });
    });

    // 积分榜
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

    // 赛事预告（图标与文字同行，队名+学校在右侧）
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

    // 交战记录
    const recordContainer = document.getElementById('ccl-tournaments');
    seasonData.tournaments.reverse().forEach(tour => {
        const maxPoints = tour.maxPoints || maxPointsDefault;
        tour.matches.forEach(match => {
            const teamA = seasonData.teams.find(t => t.id === match.teamA);
            const teamB = seasonData.teams.find(t => t.id === match.teamB);
            const isAWin = match.winner === match.teamA;

            let ptsA = 0, ptsB = 0;
            let roundsDetail = '';
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
});