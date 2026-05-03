document.addEventListener('DOMContentLoaded', async () => {
    if (!CCLDataService.isReady()) {
        await CCLDataService.load();
    }

    const season = window.__currentSeason || 'latest';
    const seasonData = CCLDataService.getSeasonData(season);
    const maxPointsDefault = 50;

    // 初始化队伍统计
    const teamStats = {};
    seasonData.teams.forEach(team => {
        teamStats[team.id] = { ...team, wins: 0, losses: 0, totalPoints: 0 };
    });

    // 统计所有比赛战绩与积分
    seasonData.tournaments.forEach(tour => {
        const maxPoints = tour.maxPoints || maxPointsDefault;
        tour.matches.forEach(match => {
            const { teamA, teamB, rounds, winner } = match;
            let ptsA = 0, ptsB = 0;
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

    // 生成积分榜
    const leaderboard = Object.values(teamStats).sort(
        (a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins
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

    // 赛事预告
    const upcomingDiv = document.getElementById('ccl-upcoming');
    if (seasonData.upcoming && seasonData.upcoming.length > 0) {
        let html = `<table class="final-table"><thead><tr><th>队伍A</th><th>VS</th><th>队伍B</th><th>日期</th></tr></thead><tbody>`;
        seasonData.upcoming.forEach(m => {
            const ta = seasonData.teams.find(t => t.id === m.teamA);
            const tb = seasonData.teams.find(t => t.id === m.teamB);
            html += `<tr>
                <td><img src="${ta.logo}" style="width:25px;height:25px;border-radius:50%;vertical-align:middle;"> ${ta.name}</td>
                <td style="color:#ecfb01;">VS</td>
                <td><img src="${tb.logo}" style="width:25px;height:25px;border-radius:50%;vertical-align:middle;"> ${tb.name}</td>
                <td>${m.date}</td>
            </tr>`;
        });
        html += `</tbody></table>`;
        upcomingDiv.innerHTML = html;
    } else {
        upcomingDiv.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">暂无赛事预告</div>';
    }

    // ======== 交战记录（修正布局与保留紫色大框） ========
    const recordContainer = document.getElementById('ccl-tournaments');
    seasonData.tournaments.forEach(tour => {
        const maxPoints = tour.maxPoints || maxPointsDefault;
        tour.matches.forEach(match => {
            const teamA = seasonData.teams.find(t => t.id === match.teamA);
            const teamB = seasonData.teams.find(t => t.id === match.teamB);
            const isAWin = match.winner === match.teamA;

            // 详细比分文本生成
            let ptsA = 0, ptsB = 0;
            let roundsDetail = '';
            match.rounds.forEach((round, idx) => {
                let line = `第${idx + 1}轮 `;
                const parts = [];
                if (round.vanguard) {
                    const [a, b] = round.vanguard;
                    parts.push(`先锋 ${a} : ${b}`);
                    if (a > b) ptsA += 10; else if (b > a) ptsB += 10;
                }
                if (round.zhongjian) {
                    const [a, b] = round.zhongjian;
                    parts.push(`中坚 ${a} : ${b}`);
                    if (a > b) ptsA += 10; else if (b > a) ptsB += 10;
                }
                if (round.dajiang) {
                    const [a, b] = round.dajiang;
                    parts.push(`大将 ${a} : ${b}`);
                    if (a > b) ptsA += 20; else if (b > a) ptsB += 20;
                }
                line += parts.join(' | ');
                roundsDetail += `<div style="margin-left:15px; line-height:1.8;">${line}</div>`;
            });
            const dispA = Math.min(ptsA, maxPoints);
            const dispB = Math.min(ptsB, maxPoints);

            // 战斗卡片（复用 honor-container 风格的紫色边框）
            const card = document.createElement('div');
            card.className = 'match-card';  // 样式已强化，见 ccl.css
            card.innerHTML = `
                <!-- 队伍比分栏：队徽 + 队名 + 积分 || VS || 积分 + 队名 + 队徽 -->
                <div class="match-score-bar">
                    <div class="team-side">
                        <img src="${teamA.logo}" class="team-logo">
                        <span class="team-name">${teamA.name}</span>
                        <span class="team-points ${isAWin ? 'win' : 'lose'}">${dispA}</span>
                    </div>
                    <div class="vs-divider">VS</div>
                    <div class="team-side">
                        <span class="team-points ${isAWin ? 'lose' : 'win'}">${dispB}</span>
                        <span class="team-name">${teamB.name}</span>
                        <img src="${teamB.logo}" class="team-logo">
                    </div>
                </div>
                <!-- 详细比分区域 -->
                <div class="match-details">
                    <div class="detail-title">详细比分</div>
                    ${roundsDetail}
                </div>
                <div class="match-footer">
                    赛事：${tour.desc} | 胜者：<span style="color:#ecfb01;">${match.winner}</span>
                </div>
            `;
            recordContainer.appendChild(card);
        });
    });
});