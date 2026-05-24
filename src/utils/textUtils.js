import { REGION_TO_FEDERAL_DISTRICT } from "./constants.js";

/**
 * Возвращает федеральный округ по региону
 * @param region
 * @return {null|*}
 */
export const getFederalDistrict = (region) => {
    if (typeof region !== 'string') {
        return null;
    }

    const normalized = region.trim();

    if (!normalized) {
        return null;
    }

    if (normalized in REGION_TO_FEDERAL_DISTRICT) {
        return REGION_TO_FEDERAL_DISTRICT[normalized];
    }

    return null;
}

export const BIG_FILIALS = [
    "Томск",
    "Тюмень",
    "Московский регион",
    "Ленэнерго",
    "Новосибирск",
];

/**
 * Возвращает правильную форму слова в зависимости от числа
 */
export const getWordForm = (number, word) => {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;

    // Особые случаи для неизменяемых аббревиатур
    const unchangeable = ['ЛЭП', 'ВЛ', 'ТП', 'ПМЭС'];
    if (unchangeable.includes(word)) {
        return word;
    }

    // Правила склонения
    const forms = {
        'опора': ['опора', 'опоры', 'опор'],
        'очаг': ['очаг', 'очага', 'очагов'],
    };

    if (forms[word]) {
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
            return forms[word][2]; // опор
        }
        if (lastDigit === 1) {
            return forms[word][0]; // опора
        }
        if (lastDigit >= 2 && lastDigit <= 4) {
            return forms[word][1]; // опоры
        }
        return forms[word][2]; // опор
    }

    return word;
}

/**
 * Парсит число из строки, обрабатывая пробелы
 */
export const parseNumber = (str) => {
    // Проверка на undefined и null
    if (str === undefined || str === null) {
        console.warn('parseNumber получил undefined/null значение');
        return 0;
    }

    // Если передали число, преобразуем в строку
    if (typeof str === 'number') {
        str = String(str);
    }

    // Если после всего это не строка, возвращаем значение по умолчанию
    if (typeof str !== 'string') {
        console.warn(`parseNumber получил нестроковое значение: ${typeof str}`, str);
        return 0;
    }

    return parseInt(str.replace(/\s/g, ''), 10) || 0;
}

/**
 * Паттерны для регулярных выражений
 * @type {{FLOOD: {SUBJECTS: RegExp, VOLTAGE: RegExp, SEGMENT: RegExp, SUMMARY: RegExp, FALLBACK_POLES: RegExp}, STORM: {SEPARATOR: RegExp}, FIRE: {CURRENT: RegExp, PREVIOUS: RegExp}}}
 */
export const PATTERNS = {
    FLOOD: {
        SEGMENT: /(?=«[^»]+»|МЭС\s+[А-Яа-я]+)/g,
        VOLTAGE: /(\d+)\s+опор(?:а|ы)?\s+(\d+)\s+(?:ЛЭП|ВЛ)\s+([\d,]+(?:-[\d,]+)?)\s+кВ/gi,
        FALLBACK_POLES: /(\d+)\s+опор(?:а|ы)?/i
    },
    FIRE: {
        CURRENT: /зафиксированы\s+([\d\s]+)(?:\s*\(([\d\s]+)\))?\s+очаг[а-я\s]+площад[а-я\s]+([\d\s]+)(?:\s*\(([\d\s]+)\))?\s*га/i,
        PREVIOUS: /зафиксированы\s+([\d\s]+)\s+очаг[а-я\s]+площад[а-я\s]+([\d\s]+)\s*га/i
    },
    STORM: {
        SEPARATOR: /[–-]\s+/
    }
};

/**
 * Нормализует текст
 * - удаляет пробелы и неразрывные пробелы
 * - приводит null, undefined к пустой строке
 * @param text
 * @return {string}
 */
export const normalizeText = (text) => {
    if (!text) return '';
    return String(text)
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Преобразует строку в число
 * - преобразует значение в число со строгой проверкой
 * @param value
 * @return {number|null}
 */
export const toNumber = (value) => {
    if (!value) return null;
    const numeric = String(value).replace(/\s+/g, '');
    return /^\d+$/.test(numeric) ? Number(numeric) : null;
};

/**
 * Экранирует HTML-сущности
 * @param value
 * @return {string}
 */
export const escapeHtml = (value) => {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
};

/**
 * Форматирует число
 * @param value
 * @return {string}
 */
export const formatNumber = (value) => {
    if (typeof value === 'string') {
        value = value.replace(/(\s|\u00a0)/g, '');
    }
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '0';

    return new Intl.NumberFormat('ru-RU').format(value);
};

/**
 * Парсит строку с информацией о филиале
 * @param str
 * @return {{area: *, data: *, org: string}|null|{area: *, data: *, org: *}}
 */
export const parseLine = (str) => {
    // Пробуем сначала формат "с точкой" (обычный филиал)
    const regexWithDot = /^(.+?)\s*\((.+?)[.,]\s*(.+?)\):\s*(.+)$/;
    let match = str.match(regexWithDot);

    if (match) {
        const area = match[3];
        const org  = match[1] + ' (' + match[2] + ')';
        const data = match[4];
        return { area, org, data };
    }

    // Если не подошло — пробуем формат "без точки" (большой филиал)
    const regexNoDot = /^(.+?)\s*\((.+?)\):\s*(.+)$/; // TODO учесть формат записи филиала: «Тюмень» (Тюменская область, Ханты-Мансийский АО) т.е. две области
    match = str.match(regexNoDot);

    if (match) {
        const area = match[2];
        const org  = match[1];
        const data = match[3];
        return { area, org, data };
    }


    return null;
}
