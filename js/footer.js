// /js/footer.js
(function () {
    function createFooter() {
        if (document.getElementById('site-footer')) return;

        const qqGroup = '1011170309'; // 在此修改群号，一键同步所有页面

        const footer = document.createElement('footer');
        footer.id = 'site-footer';
        footer.innerHTML = `
            <p>
                © 2026 天津格斗游戏同好会 TFA &nbsp;|&nbsp;
                Q群：<span id="qq-group-text">${qqGroup}</span>
                <a id="copy-qq-btn" class="copy-btn">复制</a>
                <span id="copy-tip" class="copy-tip">已复制</span>
            </p>
        `;
        document.body.appendChild(footer);

        // 复制功能
        const copyBtn = document.getElementById('copy-qq-btn');
        const tip = document.getElementById('copy-tip');
        const groupText = document.getElementById('qq-group-text');

        copyBtn.addEventListener('click', function () {
            const text = groupText.textContent;
            // 兼容性好的复制方法
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(showTip);
            } else {
                // 降级方案
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    showTip();
                } catch (e) {
                    alert('复制失败，请手动复制群号：' + text);
                }
                document.body.removeChild(textarea);
            }
        });

        function showTip() {
            tip.style.display = 'inline';
            setTimeout(() => {
                tip.style.display = 'none';
            }, 1500);
        }
    }

    // 添加必要的样式（内联，不依赖外部CSS）
    const style = document.createElement('style');
    style.textContent = `
        .copy-btn {
            color: #a67fd6;
            cursor: pointer;
            margin-left: 8px;
            font-size: 0.85rem;
            text-decoration: underline;
            user-select: none;
        }
        .copy-btn:hover {
            color: #cb9eff;
        }
        .copy-tip {
            display: none;
            color: #8eff9a;
            margin-left: 6px;
            font-size: 0.8rem;
            opacity: 0.9;
        }
        @media (max-width: 600px) {
            .copy-btn {
                padding: 4px 8px;
                font-size: 0.9rem;
            }
        }
    `;
    document.head.appendChild(style);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createFooter);
    } else {
        createFooter();
    }
})();