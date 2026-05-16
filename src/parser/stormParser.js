import { REGION_TO_FEDERAL_DISTRICT } from '../utils/constants';

/**
 * Категории погодных явлений и ключевые слова для их определения
 */
const WEATHER_CATEGORIES = {
    'сильные осадки': {
        keywords: [
            'сильный снег', 'сильный дождь', 'сильный дождь со снегом',
            'ливень', 'сильное отложение мокрого снега', 'сильный гололед',
            'мокрый снег', 'снег', 'дождь', 'осадки',
        ],
        icon: 'raine',
        priority: 1,
    },
    'сильные осадки с грозой': {
        keywords: [
            'гроза', 'ливень с грозой', 'дождь с грозой',
        ],
        icon: 'thunderstorm',
        priority: 2,
        requires: ['гроза'],
        requiresAny: ['ливень', 'дождь', 'осадки', 'снег'],
    },
    'сильный ветер': {
        keywords: [
            'ветер', 'ветер до', 'ветер с порывами', 'шквалистый ветер',
            'ураган', 'смерч',
        ],
        icon: 'wind',
        priority: 3,
    },
    'град': {
        keywords: ['град'],
        icon: 'storm',
        priority: 4,
    },
    'гроза': {
        keywords: ['гроза'],
        icon: 'storm',
        priority: 5,
    },
    'подъем уровней воды': {
        keywords: [
            'подъем уровней воды', 'подъем воды', 'подтопление',
            'неблагоприятных отметок', 'паводок',
        ],
        icon: 'flood',
        priority: 6,
    },
    'гололед': {
        keywords: ['гололед', 'гололедица', 'обледенение'],
        icon: 'health',
        priority: 7,
    },
};

/**
 * Нормализует название региона из различных форм
 */
function normalizeRegionName(name) {
    const nameMap = {
        'Свердловской области': 'Свердловская область',
        'Краснодарском крае': 'Краснодарский край',
        'Ростовской области': 'Ростовская область',
        'Мурманской области': 'Мурманская область',
        'Московской области': 'Московская область',
        'Ленинградской области': 'Ленинградская область',
        'Томской области': 'Томская область',
        'Волгоградской области': 'Волгоградская область',
        'Астраханской области': 'Астраханская область',
        'Самарской области': 'Самарская область',
        'Нижегородской области': 'Нижегородская область',
        'Республике Мордовия': 'Республика Мордовия',
        'Чувашской Республике': 'Чувашская Республика',
        'Хабаровском крае': 'Хабаровский край',
        'Приморском крае': 'Приморский край',
        'Красноярском крае': 'Красноярский край',
        'Забайкальском крае': 'Забайкальский край',
        'Камчатском крае': 'Камчатский край',
        'Амурской области': 'Амурская область',
        'Иркутской области': 'Иркутская область',
        'Новосибирской области': 'Новосибирская область',
        'Кемеровской области': 'Кемеровская область',
        'Омской области': 'Омская область',
        'Тюменской области': 'Тюменская область',
        'Челябинской области': 'Челябинская область',
        'Курганской области': 'Курганская область',
        'Оренбургской области': 'Оренбургская область',
        'Саратовской области': 'Саратовская область',
        'Воронежской области': 'Воронежская область',
        'Белгородской области': 'Белгородская область',
        'Курской области': 'Курская область',
        'Тамбовской области': 'Тамбовская область',
        'Рязанской области': 'Рязанская область',
        'Тульской области': 'Тульская область',
        'Калужской области': 'Калужская область',
        'Брянской области': 'Брянская область',
        'Смоленской области': 'Смоленская область',
        'Тверской области': 'Тверская область',
        'Ярославской области': 'Ярославская область',
        'Костромской области': 'Костромская область',
        'Ивановской области': 'Ивановская область',
        'Владимирской области': 'Владимирская область',
        'Вологодской области': 'Вологодская область',
        'Архангельской области': 'Архангельская область',
        'Псковской области': 'Псковская область',
        'Новгородской области': 'Новгородская область',
        'Калининградской области': 'Калининградская область',
        'Республике Коми': 'Республика Коми',
        'Республике Карелия': 'Республика Карелия',
        'Республике Татарстан': 'Республика Татарстан',
        'Республике Башкортостан': 'Республика Башкортостан',
        'Республике Дагестан': 'Республика Дагестан',
        'Республике Крым': 'Республика Крым',
        'Республике Саха (Якутия)': 'Республика Саха (Якутия)',
        'Республике Бурятия': 'Республика Бурятия',
        'Еврейской АО': 'Еврейская автономная область',
        'Еврейской автономной области': 'Еврейская автономная область',
        'на севере Мурманской области': 'Мурманская область',
        'в предгорных районах Краснодарского края': 'Краснодарский край',
    };

    return nameMap[name] || name;
}

/**
 * Извлекает название региона из строки
 */
function extractRegionName(line) {
    // Паттерны для извлечения региона
    const patterns = [
        /(?:в|на)\s+(.+?)\s+(?:сильный|ливень|гроза|град|ветер|ожидаются|подъем)/i,
        /(?:в|на)\s+(.+?)$/i,
    ];

    for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
            let regionName = match[1].trim();
            // Убираем лишние слова
            regionName = regionName.replace(/^(на севере |в предгорных районах )/i, '');
            return normalizeRegionName(regionName);
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
    // Убираем дату и дефис в начале
    const cleanLine = line.replace(/^\s*[\u2010\u2011\u2012\u2013\u2014\u2015-]\s*/, '')
        .replace(/^\d+\s+(апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря|января|февраля|марта)\s+/i, '')
        .trim();

    const regionName = extractRegionName(cleanLine);

    if (!regionName) {
        return null;
    }

    const phenomena = detectWeatherPhenomena(cleanLine);

    return {
        region: regionName,
        categories: phenomena.categories,
        icons: phenomena.icons,
        keywords: phenomena.keywords,
        rawText: cleanLine,
    };
}

/**
 * Парсит весь текст со штормовыми предупреждениями
 */
export function parseStormData(text) {
    if (!text || !text.trim()) {
        return null;
    }

    const lines = text.split(/[;\n]/).filter(line => line.trim());
    const stormWarnings = [];

    lines.forEach(line => {
        const parsed = parseStormLine(line.trim());
        if (parsed) {
            stormWarnings.push(parsed);
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