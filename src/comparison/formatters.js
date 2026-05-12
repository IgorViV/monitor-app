import { getWordForm } from '../utils/textUtils.js';

/**
 * Форматирует строку с количеством опор и их изменением
 * @param {Object} comparisonItem - элемент сравнения
 * @returns {string} отформатированная строка
 */
export function formatPolesWithChange(comparisonItem) {
    const { currentPoles, previousPoles, status, difference } = comparisonItem;

    const word = getWordForm(currentPoles || 0, 'опора');
    let previousDisplay = '';

    if (status === 'new') {
        return `${currentPoles} ${word} (новая)`;
    } else if (status === 'removed') {
        return `${previousPoles} ${getWordForm(previousPoles, 'опора')} (устранено)`;
    } else {
        const diffSign = difference > 0 ? '+' : '';
        previousDisplay = previousPoles !== null ? ` (${diffSign}${difference})` : '';
        return `${currentPoles} ${word}${previousDisplay}`;
    }
}

/**
 * Форматирует строку с информацией о линиях и напряжении
 * @param {Object} comparisonItem - элемент сравнения
 * @returns {string} отформатированная строка
 */
export function formatLinesInfo(comparisonItem) {
    const { currentLines, previousLines, voltageRange } = comparisonItem;

    let linesStr = `${currentLines || 0} ${getWordForm(currentLines || 0, 'ВЛ')}`;

    if (previousLines !== null && previousLines !== undefined) {
        const linesDiff = currentLines - previousLines;
        if (linesDiff !== 0) {
            const sign = linesDiff > 0 ? '+' : '';
            linesStr += ` (${sign}${linesDiff})`;
        }
    }

    return `${linesStr} ${voltageRange}`;
}

/**
 * Генерирует CSS класс для выделения цветом
 * @param {string} status - статус изменения
 * @returns {string} CSS класс
 */
export function getChangeColorClass(status) {
    switch (status) {
        case 'increase':
            return 'text-danger'; // красный для увеличения
        case 'decrease':
            return 'text-success'; // зеленый для уменьшения
        case 'new':
            return 'text-danger fw-bold'; // красный жирный для новых
        case 'removed':
            return 'text-success text-decoration-line-through'; // зеленый зачеркнутый
        default:
            return ''; // обычный черный для без изменений
    }
}

/**
 * Форматирует полную строку вывода для предприятия
 * @param {Object} comparisonItem - элемент сравнения
 * @returns {Object} объект с частями строки для форматирования
 */
export function formatComparisonLine(comparisonItem) {
    const polesClass = getChangeColorClass(comparisonItem.status);
    const linesClass = getChangeColorClass(comparisonItem.linesStatus);

    const polesFormatted = formatPolesWithChange(comparisonItem);
    const linesFormatted = formatLinesInfo(comparisonItem);

    return {
        company: comparisonItem.company,
        polesText: polesFormatted,
        polesClass,
        linesText: `на ${linesFormatted}`,
        linesClass,
        fullText: `${polesFormatted} на ${linesFormatted}`
    };
}