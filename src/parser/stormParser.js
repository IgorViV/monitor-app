import { REGION_TO_FEDERAL_DISTRICT, NAME_REGIONS_MAP, WEATHER_CATEGORIES } from '../utils/constants';

/**
 * Нормализует название региона из различных форм
 */
function normalizeRegionName(name) {
    const nameMap = NAME_REGIONS_MAP;

    return nameMap[name] || name;
}

/**
 * Извлекает название региона из строки
 */
function extractRegionName(line) {
    let normalRegionNames = [];
    // Паттерны для извлечения региона
    const patterns = [
        /(?:в|на)\s+(.+?)\s+(?:сильный|ливень|гроза|град|ветер|ожидаются|подъем)/i,
        /(?:в|на)\s+(.+?)$/i,
    ];

    for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
            let regionNames = match[1].trim();
            // Убираем лишние слова
            regionNames = regionNames.replace(/^(на севере |севере |в предгорных районах )/ig, '').replace(/( областях| краях| республиках)/ig, '');
            const linesRegionName = regionNames.split(', ');
            linesRegionName.forEach((line) => {
                line = line.replace(/(?:в|на)\s+/, '').replace(/\.+$/, '');
                normalRegionNames.push(normalizeRegionName(line));
            });
            return normalRegionNames;
        }
    }

    return null;
}

/**
 * Определяет категории погодных явлений в строке
 */
function detectWeatherPhenomena(text) {
    const detected = new Set();
    const allKeywords = [];

    // Проверяем каждую категорию
    Object.entries(WEATHER_CATEGORIES).forEach(([category, config]) => {
        let found = false;

        if (config.requires && config.requiresAny) {
            // Нужно найти и основное ключевое слово, и хотя бы одно дополнительное
            const hasRequired = config.requires.some(keyword =>
                text.toLowerCase().includes(keyword.toLowerCase())
            );
            const hasAny = config.requiresAny.some(keyword =>
                text.toLowerCase().includes(keyword.toLowerCase())
            );

            if (hasRequired && hasAny) {
                found = true;
            }
        } else {
            // Проверяем ключевые слова
            found = config.keywords.some(keyword =>
                text.toLowerCase().includes(keyword.toLowerCase())
            );
        }

        if (found) {
            detected.add(category);
            allKeywords.push(...config.keywords.filter(k =>
                text.toLowerCase().includes(k.toLowerCase())
            ));
        }
    });

    // Упрощаем категории
    const simplified = simplifyCategories(detected, text);

    return {
        categories: simplified,
        keywords: allKeywords,
        icons: getIconsForCategories(simplified),
    };
}

/**
 * Упрощает категории, удаляя дублирующиеся
 */
function simplifyCategories(detected, text) {
    const result = new Set(detected);

    // Если есть "сильные осадки с грозой", убираем отдельные "гроза" и "сильные осадки"
    if (result.has('сильные осадки с грозой')) {
        result.delete('гроза');
        result.delete('сильные осадки');
    }

    // Если есть "сильные осадки", убираем "гололед" (он часть осадков)
    if (result.has('сильные осадки') && result.has('гололед')) {
        // Оставляем оба если гололед явно указан
        if (!text.includes('гололед') && !text.includes('гололедица')) {
            result.delete('гололед');
        }
    }

    return Array.from(result);
}

/**
 * Получает иконки для категорий
 */
function getIconsForCategories(categories) {
    const icons = new Set();
    categories.forEach(category => {
        const config = WEATHER_CATEGORIES[category];
        if (config && config.icon) {
            icons.add(config.icon);
        }
    });
    return Array.from(icons);
}

/**
 * Форматирует категории в читаемый текст
 */
function formatCategories(categories) {
    if (categories.length === 0) return '';

    // Сортируем по приоритету
    const sorted = categories.sort((a, b) => {
        const priorityA = WEATHER_CATEGORIES[a]?.priority || 99;
        const priorityB = WEATHER_CATEGORIES[b]?.priority || 99;
        return priorityA - priorityB;
    });

    return sorted.join(', ');
}

/**
 * Парсит одну строку штормового предупреждения
 */
function parseStormLine(line) {
    // Убираем дату и дефис в строке
    let regionData = [];
    const cleanLine = line.replace(/^\s*[\u2010\u2011\u2012\u2013\u2014\u2015-]\s*/, '')
        .replace(/\d+(-\d+)?\s+(апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря|января|февраля|марта)\s+/ig, '')
        .trim();
    const regionName = extractRegionName(cleanLine);
    if (!regionName.length) {
        return null;
    }

    regionName.forEach((name) => {
        const phenomena = detectWeatherPhenomena(cleanLine);
        const found = regionData.find(item => item.region === name);
        if (found) {
            found.categories.push(phenomena.categories);
            found.icons.push(phenomena.icons);
            found.keywords.push(phenomena.keywords);
            found.rawText += `, ${cleanLine}`;
        } else {
            regionData.push({
                region: name,
                categories: phenomena.categories,
                icons: phenomena.icons,
                keywords: phenomena.keywords,
                rawText: cleanLine,
            });
        }
    });

    return regionData;

}

/**
 * Парсит весь текст со штормовыми предупреждениями
 */
export function parseStormData(text) {
    if (!text || !text.trim()) {
        return null;
    }

    // const lines = text.split(/[;\n]/).filter(line => line.trim());
    // const lines = text.split(/;[ \t]*\r?\n/).filter(line => line.trim());
    const lines = text.replace(/[\u00A0\u202F]/g, ' ').split(/;[ \t]*\r?\n/).filter(line => line.trim());
    let stormWarnings = [];

    lines.forEach(line => {
        const parsed = parseStormLine(line.trim());
        if (parsed) {
            parsed.forEach(itemParsed => {
                const found = stormWarnings.find(item => item.region === itemParsed.region);
                if (found) {
                    found.categories.push(...itemParsed.categories);
                    found.icons.push(...itemParsed.icons);
                    found.keywords.push(...itemParsed.keywords);
                    found.rawText += `, ${itemParsed.rawText}`;
                } else {
                    stormWarnings.push(itemParsed);
                }
            });
        }
    });

    // Группируем по федеральным округам
    const groupedByDistrict = {};

    stormWarnings.forEach(warning => {
        const district = REGION_TO_FEDERAL_DISTRICT[warning.region] || 'Другие регионы';

        if (!groupedByDistrict[district]) {
            groupedByDistrict[district] = {};
        }

        if (!groupedByDistrict[district][warning.region]) {
            groupedByDistrict[district][warning.region] = [];
        }

        groupedByDistrict[district][warning.region].push({
            company: 'Штормовые предупреждения',
            categories: warning.categories,
            icons: warning.icons,
            formattedText: formatCategories(warning.categories),
            rawText: warning.rawText,
            type: 'storm',
        });
    });

    // Выводим в консоль для отладки
    console.log('=== Штормовые предупреждения ===');
    stormWarnings.forEach(warning => {
        const formatted = formatCategories(warning.categories);
        console.log(`${warning.region}: ${formatted || 'неизвестные явления'}.`);
    });
    console.log('===============================');

    return {
        regions: groupedByDistrict,
        rawWarnings: stormWarnings,
    };
}

// Экспортируем для тестирования
export {
    parseStormLine,
    extractRegionName,
    detectWeatherPhenomena,
    formatCategories,
    normalizeRegionName,
    WEATHER_CATEGORIES,
};