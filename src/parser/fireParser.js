import { parseNumber, formatNumber } from '../utils/textUtils';
import { REGION_TO_FEDERAL_DISTRICT, NAME_REGIONS_MAP } from '../utils/constants';

/**
 * Парсит весь текст с данными о пожарах
 * @param {string} text - полный текст с данными
 * @returns {Object} - объект с суммарной статистикой и данными по регионам
 */
export function parseFireData(text) {
    if (!text || !text.trim()) {
        return null;
    }

    const cleanText = text.trim();

    // Разделяем на части: общая информация и данные по регионам
    const parts = cleanText.split(/,\s*из них\s+/i);

    const mainPart = parts[0];
    const detailsPart = parts.length > 1 ? parts[1] : '';

    // Парсим суммарную информацию
    const summary = parseFireSummary(mainPart);

    // Парсим данные по регионам
    const regions = [];

    if (detailsPart) {
        const regionSplits = detailsPart.split(/,\s*(?=в\s+)/);

        regionSplits.forEach(split => {
            // Паттерн с предыдущими значениями в скобках
            let regionData = parseFireRegionLine(split);

            if (!regionData) {
                // Простой паттерн без предыдущих значений
                const simpleMatch = split.match(
                    /в\s+(.+?)\s+(\d+(?:\s*\d+)*)\s+очаг(?:ов|а)?\s+площадью\s+(\d+(?:\s*\d+)*)\s*га/i
                );

                if (simpleMatch) {
                    regionData = {
                        region: normalizeRegionName(simpleMatch[1].trim()),
                        currentFires: parseNumber(simpleMatch[2]),
                        // previousFires: 0,
                        currentArea: parseNumber(simpleMatch[3]),
                        // previousArea: 0,
                    };
                }
            }

            if (regionData) {
                regions.push(regionData);
            }
        });
    }

    // Группируем регионы по федеральным округам
    const groupedByDistrict = {};

    regions.forEach(regionData => {
        const district = REGION_TO_FEDERAL_DISTRICT[regionData.region] || 'Другие регионы';

        if (!groupedByDistrict[district]) {
            groupedByDistrict[district] = {};
        }

        if (!groupedByDistrict[district][regionData.region]) {
            groupedByDistrict[district][regionData.region] = [];
        }

        groupedByDistrict[district][regionData.region].push({
            company: 'Природные пожары',
            currentFires: regionData.currentFires ?? regionData.fires ?? 0,
            previousFires: regionData.previousFires ?? 0,
            currentArea: regionData.currentArea ?? regionData.area ?? 0,
            previousArea: regionData.previousArea ?? 0,
            type: 'fire',
        });
    });

    return {
        summary: summary || {
            currentFires: 0,
            previousFires: 0,
            currentArea: 0,
            previousArea: 0,
        },
        regions: groupedByDistrict,
        rawRegions: regions,
    };
}

/**
 * Парсит суммарную строку о пожарах
 * @param {string} text - текст с данными
 * @returns {Object|null} - объект с суммарной статистикой
 */
export function parseFireSummary(text) {
    if (!text || !text.trim()) {
        return null;
    }

    const cleanText = text.trim();

    // Паттерн: "На территории России зафиксированы 8 (27 ) очагов пожаров на общей площади 73 075 (63 566) га"
    const summaryMatch = cleanText.match(
        /зафиксированы?\s+(\d+(?:\s*\d+)*)\s*\((\d+(?:\s*\d+)*)\s*\)\s*очаг(?:ов|а)?\s+пожаров\s+на\s+общей\s+площади\s+(\d+(?:\s*\d+)*)\s*\((\d+(?:\s*\d+)*)\s*\)\s*га/i
    );

    if (summaryMatch) {
        return {
            currentFires: parseNumber(summaryMatch[1]),
            // previousFires: parseNumber(summaryMatch[2]),
            // previousFires: 0,
            currentArea: parseNumber(summaryMatch[3]),
            // previousArea: parseNumber(summaryMatch[4]),
            // previousArea: 0,
        };
    }

    // Паттерн без площади: "зафиксированы 8 (27) очагов пожаров"
    // const simpleMatch = cleanText.match(
    //     /зафиксированы?\s+(\d+(?:\s*\d+)*)\s*\((\d+(?:\s*\d+)*)\s*\)\s*очаг(?:ов|а)?\s+пожаров/i
    // );
    //
    // if (simpleMatch) {
    //     return {
    //         currentFires: parseNumber(simpleMatch[1]),
    //         // previousFires: parseNumber(simpleMatch[2]),
    //         previousFires: 0,
    //         currentArea: 0,
    //         previousArea: 0,
    //     };
    // }

    return null;
}

/**
 * Парсит строку с информацией о пожарах в конкретном регионе
 * @param {string} line - строка с информацией о регионе
 * @returns {Object|null} - объект с данными региона или null
 */
function parseFireRegionLine(line) {
    // Убираем "из них" в начале если есть
    line = line.replace(/^из них\s+/i, '').trim();

    // Паттерн: "в Еврейской АО 2 очага площадью 63 050 га"
    // или: "в Хабаровском крае 4 очага площадью 3 709 га"
    const regionMatch = line.match(
        /в\s+(.+?)\s+(\d+(?:\s*\d+)*)\s+очаг(?:ов|а)?\s+площадью\s+(\d+(?:\s*\d+)*)\s*га/i
    );

    if (regionMatch) {
        const regionName = regionMatch[1].trim();
        // Приводим к стандартному виду
        const normalizedRegion = normalizeRegionName(regionName);
        return {
            region: normalizedRegion,
            fires: parseNumber(regionMatch[2]),
            area: parseNumber(regionMatch[3]),
        };
    }

    // Паттерн с предыдущими значениями: "в Еврейской АО 2 (1)* очага площадью 63 050 (58 965)* га"
    const regionWithPrevMatch = line.match(
        /в\s+(.+?)\s+(\d+(?:\s*\d+)*)\s*\((\d+(?:\s*\d+)*)\s*\)\*\s*очаг(?:ов|а)?\s+площадью\s+(\d+(?:\s*\d+)*)\s*\((\d+(?:\s*\d+)*)\s*\)\*\s*га/i
    );

    if (regionWithPrevMatch) {
        const regionName = regionWithPrevMatch[1].trim();
        const normalizedRegion = normalizeRegionName(regionName);

        return {
            region: normalizedRegion,
            currentFires: parseNumber(regionWithPrevMatch[2]),
            // previousFires: parseNumber(regionWithPrevMatch[3]),
            currentArea: parseNumber(regionWithPrevMatch[4]),
            // previousArea: parseNumber(regionWithPrevMatch[5]),
        };
    }

    return null;
}

/**
 * Нормализует название региона
 */
function normalizeRegionName(name) {
    return NAME_REGIONS_MAP[name] || name;
}

/**
 * Парсит только суммарную строку о пожарах
 */
export function parseFireSummaryLine(text) {
    if (!text || !text.trim()) {
        return null;
    }

    return parseFireSummary(text.trim());
}