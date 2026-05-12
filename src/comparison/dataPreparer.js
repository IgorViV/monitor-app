import { parseFloodData } from '../parser/floodParser.js';

/**
 * Подготавливает данные для сравнения из сырого текста
 * @param {string} currentText - текст текущего периода
 * @param {string} previousText - текст предыдущего периода
 * @returns {Object} объект с текущими и предыдущими данными
 */
export function prepareFloodDataForComparison(currentText, previousText) {
    const currentData = parseFloodData(currentText);
    const previousData = previousText ? parseFloodData(previousText) : {};

    return { currentData, previousData };
}

/**
 * Валидирует входные данные перед парсингом
 * @param {string} text - текст для валидации
 * @returns {boolean} результат валидации
 */
export function validateInputData(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }

    // Проверяем минимальную длину и наличие базовых паттернов
    const trimmed = text.trim();
    if (trimmed.length < 10) {
        return false;
    }

    // Проверяем наличие ключевых слов
    const hasCompany = /«[^»]+»/.test(trimmed);
    const hasNumbers = /\d+/.test(trimmed);
    const hasRegion = /\((?:[^)]+)\)/.test(trimmed);

    return hasCompany && hasNumbers && hasRegion;
}