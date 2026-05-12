import { generateFullSummary } from '../summary/summaryGenerator';

/**
 * Создает HTML элемент сводки
 */
export function createSummaryElement(summaryItem) {
    const container = document.createElement('div');
    container.className = 'summary-item mb-3';

    if (summaryItem.html) {
        container.innerHTML = summaryItem.html;
    } else {
        const p = document.createElement('p');
        p.textContent = summaryItem.text;
        container.appendChild(p);
    }

    return container;
}

/**
 * Отображает сводку в контейнере
 */
export function renderSummary(container, app) {
    container.innerHTML = '';

    if (!app) {
        container.innerHTML = '<p class="text-muted">Нет данных</p>';
        return;
    }

    const summaries = generateFullSummary(
        app.currentData.flood,
        app.currentData.fire,
        app.currentData.storm,
        app.previousData
    );

    if (summaries.length === 0) {
        container.innerHTML = '<p class="text-muted">Нет данных для формирования сводки</p>';
        return;
    }

    summaries.forEach(summary => {
        container.appendChild(createSummaryElement(summary));
    });
}