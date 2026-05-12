import { getWordForm, formatNumber } from '../utils/textUtils';

/**
 * CSS классы для цветового выделения изменений
 */
export const CHANGE_COLORS = {
    increase: 'color-red',
    decrease: 'color-green',
    unchanged: 'color-black',
    new: 'color-red',
    removed: 'color-green',
    previous: 'color-grey',
};

/**
 * Возвращает CSS класс для текущего значения
 */
export function getCurrentValueClass(status) {
    switch (status) {
        case 'increase':
        case 'new':
            return 'color-red';
        case 'decrease':
        case 'removed':
            return 'color-green';
        default:
            return 'color-black';
    }
}

/**
 * Возвращает CSS класс для предыдущего значения
 */
export function getPreviousValueClass() {
    return 'color-grey';
}

/**
 * Форматирует строку с опорами и линиями для отображения
 */
export function formatComparisonLine(item) {
    const polesWord = getWordForm(item.currentPoles || 0, 'опора');
    const linesWord = 'ВЛ';

    // Форматируем текущие значения с цветами
    const currentPolesFormatted = formatNumber(item.currentPoles || 0);
    const previousPoles = item.previousPoles !== null && item.previousPoles !== undefined
        ? formatNumber(item.previousPoles)
        : '0';

    const currentLinesFormatted = formatNumber(item.currentLines || 0);
    const previousLines = item.previousLines !== null && item.previousLines !== undefined
        ? formatNumber(item.previousLines)
        : '0';

    return {
        company: item.company,
        currentPoles: currentPolesFormatted,
        previousPoles,
        polesWord,
        currentPolesClass: getCurrentValueClass(item.status),
        previousPolesClass: getPreviousValueClass(),

        currentLines: currentLinesFormatted,
        previousLines,
        linesWord,
        currentLinesClass: getCurrentValueClass(item.linesStatus),
        previousLinesClass: getPreviousValueClass(),

        voltageRange: item.voltageRange,
        status: item.status,
    };
}