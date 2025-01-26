document.addEventListener('DOMContentLoaded', () => {
    const modules = document.querySelectorAll('.module');

    modules.forEach(module => {
        const playerId = module.getAttribute('data-id');
        const scores = JSON.parse(module.getAttribute('data-scores'));

        const idElement = document.createElement('div');
        idElement.className = 'id';
        idElement.textContent = playerId;

        const scoresElement = document.createElement('div');
        scoresElement.className = 'scores';
        scoresElement.textContent = `Scores: ${scores.join(', ')}`;

        module.appendChild(idElement);
        module.appendChild(scoresElement);

        // Adjust module size based on content
        const fontSize = calculateFontSize(module, playerId, scores);
        idElement.style.fontSize = `${fontSize}px`;
        scoresElement.style.fontSize = `${fontSize - 2}px`; // Slightly smaller for scores
    });

    function calculateFontSize(container, playerId, scores) {
        const maxFontSize = 24; // Maximum font size
        const minFontSize = 12; // Minimum font size

        // Calculate the ideal font size based on content length and container size
        const contentLength = playerId.length + scores.join(', ').length;
        const containerSize = container.clientWidth;

        // Simple linear scaling, adjust as needed
        const fontSize = Math.max(minFontSize, maxFontSize - (contentLength / containerSize) * (maxFontSize - minFontSize));

        return fontSize;
    }
});