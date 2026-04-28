document.addEventListener('DOMContentLoaded', async function () {
    if (!DataService.isReady()) {
        await new Promise(resolve => {
            const check = setInterval(() => {
                if (DataService.isReady()) { clearInterval(check); resolve(); }
            }, 100);
        });
    }

    const params = new URLSearchParams(window.location.search);
    let currentRank = parseInt(params.get('rank'), 10) || 1;
    const totalMembers = DataService.getSeasonData(window.__currentSeason || 'latest').members.length;

    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const gotoInput = document.getElementById('goto-page');
    const gotoBtn = document.getElementById('goto-btn');

    const navigate = (rank) => {
        params.set('rank', rank);
        window.location.search = params.toString();
    };

    prevBtn.addEventListener('click', () => { if (currentRank > 1) navigate(currentRank - 1); });
    nextBtn.addEventListener('click', () => { if (currentRank < totalMembers) navigate(currentRank + 1); });
    gotoBtn.addEventListener('click', () => {
        const page = parseInt(gotoInput.value, 10);
        if (!isNaN(page) && page >= 1 && page <= totalMembers) navigate(page);
        else alert('请输入有效排名');
    });

    prevBtn.disabled = currentRank <= 1;
    nextBtn.disabled = currentRank >= totalMembers;
    gotoInput.placeholder = currentRank;

    // 如果当前 rank 无效，跳转到 rank=1（可选，但安全）
    if (currentRank > totalMembers) {
        navigate(1);
    }
});