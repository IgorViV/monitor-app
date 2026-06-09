import { getWordForm, formatNumber } from '../utils/textUtils';

/**
 * Склоняет название субъекта РФ в родительном падеже (на территории кого/чего)
 */
function getRegionPrepositional(regionName) {
    const prepositionalMap = {
        'Томская область': 'Томской области',
        'Волгоградская область': 'Волгоградской области',
        'Астраханская область': 'Астраханской области',
        'Самарская область': 'Самарской области',
        'Нижегородская область': 'Нижегородской области',
        'Московская область': 'Московской области',
        'Ленинградская область': 'Ленинградской области',
        'Ростовская область': 'Ростовской области',
        'Свердловская область': 'Свердловской области',
        'Челябинская область': 'Челябинской области',
        'Новосибирская область': 'Новосибирской области',
        'Кемеровская область': 'Кемеровской области',
        'Иркутская область': 'Иркутской области',
        'Омская область': 'Омской области',
        'Амурская область': 'Амурской области',
        'Сахалинская область': 'Сахалинской области',
        'Тюменская область': 'Тюменской области',
        'Курганская область': 'Курганской области',
        'Оренбургская область': 'Оренбургской области',
        'Саратовская область': 'Саратовской области',
        'Пензенская область': 'Пензенской области',
        'Ульяновская область': 'Ульяновской области',
        'Кировская область': 'Кировской области',
        'Архангельская область': 'Архангельской области',
        'Вологодская область': 'Вологодской области',
        'Калининградская область': 'Калининградской области',
        'Мурманская область': 'Мурманской области',
        'Новгородская область': 'Новгородской области',
        'Псковская область': 'Псковской области',
        'Белгородская область': 'Белгородской области',
        'Брянская область': 'Брянской области',
        'Владимирская область': 'Владимирской области',
        'Воронежская область': 'Воронежской области',
        'Ивановская область': 'Ивановской области',
        'Калужская область': 'Калужской области',
        'Костромская область': 'Костромской области',
        'Курская область': 'Курской области',
        'Липецкая область': 'Липецкой области',
        'Орловская область': 'Орловской области',
        'Рязанская область': 'Рязанской области',
        'Смоленская область': 'Смоленской области',
        'Тамбовская область': 'Тамбовской области',
        'Тверская область': 'Тверской области',
        'Тульская область': 'Тульской области',
        'Ярославская область': 'Ярославской области',
        'Магаданская область': 'Магаданской области',
        'Республика Мордовия': 'Республики Мордовия',
        'Чувашская Республика': 'Чувашской Республики',
        'Чувашская Республика - Чувашия': 'Чувашской Республики - Чувашии',
        'Республика Татарстан': 'Республики Татарстан',
        'Республика Башкортостан': 'Республики Башкортостан',
        'Республика Дагестан': 'Республики Дагестан',
        'Республика Ингушетия': 'Республики Ингушетия',
        'Республика Коми': 'Республики Коми',
        'Республика Карелия': 'Республики Карелия',
        'Республика Бурятия': 'Республики Бурятия',
        'Республика Тыва': 'Республики Тыва',
        'Республика Хакасия': 'Республики Хакасия',
        'Республика Алтай': 'Республики Алтай',
        'Республика Саха (Якутия)': 'Республики Саха (Якутия)',
        'Якутия': 'Республики Саха (Якутия)',
        'Республика Крым': 'Республики Крым',
        'Республика Адыгея': 'Республики Адыгея',
        'Республика Калмыкия': 'Республики Калмыкия',
        'Кабардино-Балкарская Республика': 'Кабардино-Балкарской Республики',
        'Карачаево-Черкесская Республика': 'Карачаево-Черкесской Республики',
        'Чеченская Республика': 'Чеченской Республики',
        'Удмуртская Республика': 'Удмуртской Республики',
        'Республика Марий Эл': 'Республики Марий Эл',
        'Республика Северная Осетия-Алания': 'Республики Северной Осетии-Алании',
        'Краснодарский край': 'Краснодарского края',
        'Ставропольский край': 'Ставропольского края',
        'Пермский край': 'Пермского края',
        'Приморский край': 'Приморского края',
        'Хабаровский край': 'Хабаровского края',
        'Алтайский край': 'Алтайского края',
        'Красноярский край': 'Красноярского края',
        'Забайкальский край': 'Забайкальского края',
        'Камчатский край': 'Камчатского края',
        'г. Севастополь': 'г. Севастополя',
        'Севастополь': 'г. Севастополя',
        'Еврейская автономная область': 'Еврейской АО',
        'Еврейская АО': 'Еврейской АО',
        'Чукотский автономный округ': 'Чукотского АО',
        'Чукотский АО': 'Чукотского АО',
        'Ненецкий автономный округ': 'Ненецкого АО',
        'Ненецкий АО': 'Ненецкого АО',
        'Ямало-Ненецкий автономный округ': 'Ямало-Ненецкого АО',
        'Ямало-Ненецкий АО': 'Ямало-Ненецкого АО',
        'Ханты-Мансийский автономный округ - Югра': 'Ханты-Мансийского АО',
        'Ханты-Мансийский автономный округ': 'Ханты-Мансийского АО',
        'Ханты-Мансийский АО': 'Ханты-Мансийского АО',
    };

    if (prepositionalMap[regionName]) {
        return prepositionalMap[regionName];
    }

    // Автоматическое склонение
    if (regionName.endsWith('область')) {
        return regionName.replace('область', 'области');
    }
    if (regionName.endsWith('край')) {
        return regionName.replace('край', 'крае');
    }
    if (regionName.startsWith('Республика ')) {
        const name = regionName.replace('Республика ', '');
        return `Республике ${name}`;
    }
    if (regionName.endsWith('автономный округ')) {
        return regionName.replace('автономный округ', 'автономном округе');
    }
    if (regionName.endsWith('автономная область')) {
        return regionName.replace('автономная область', 'автономной области');
    }

    return regionName;
}

/**
 * Склоняет название субъекта РФ
 */
function getRegionGenitive(regionName) {
    const genitiveMap = {
        'Томская область': 'Томской',
        'Волгоградская область': 'Волгоградской',
        'Астраханская область': 'Астраханской',
        'Самарская область': 'Самарской',
        'Нижегородская область': 'Нижегородской',
        'Республика Мордовия': 'Республики Мордовии',
        'Чувашская Республика': 'Чувашской Республики',
        'Чувашская Республика - Чувашия': 'Чувашской Республики - Чувашии',
        'Республика Татарстан': 'Республики Татарстан',
        'Московская область': 'Московской',
        'Ленинградская область': 'Ленинградской',
        'Ростовская область': 'Ростовской',
        'Краснодарский край': 'Краснодарского края',
        'Ставропольский край': 'Ставропольского края',
        'Пермский край': 'Пермского края',
        'Свердловская область': 'Свердловской',
        'Челябинская область': 'Челябинской',
        'Новосибирская область': 'Новосибирской',
        'Кемеровская область': 'Кемеровской',
        'Приморский край': 'Приморского края',
        'Хабаровский край': 'Хабаровского края',
        'Удмуртская Республика': 'Удмуртской Республики',
        'Республика Башкортостан': 'Республики Башкортостан',
        'Оренбургская область': 'Оренбургской',
        'Саратовская область': 'Саратовской',
        'Пензенская область': 'Пензенской',
        'Ульяновская область': 'Ульяновской',
        'Кировская область': 'Кировской',
        'Республика Марий Эл': 'Республики Марий Эл',
        'Республика Коми': 'Республики Коми',
        'Архангельская область': 'Архангельской',
        'Вологодская область': 'Вологодской',
        'Калининградская область': 'Калининградской',
        'Мурманская область': 'Мурманской',
        'Республика Карелия': 'Республики Карелия',
        'Новгородская область': 'Новгородской',
        'Псковская область': 'Псковской',
        'Белгородская область': 'Белгородской',
        'Брянская область': 'Брянской',
        'Владимирская область': 'Владимирской',
        'Воронежская область': 'Воронежской',
        'Ивановская область': 'Ивановской',
        'Калужская область': 'Калужской',
        'Костромская область': 'Костромской',
        'Курская область': 'Курской',
        'Липецкая область': 'Липецкой',
        'Орловская область': 'Орловской',
        'Рязанская область': 'Рязанской',
        'Смоленская область': 'Смоленской',
        'Тамбовская область': 'Тамбовской',
        'Тверская область': 'Тверской',
        'Тульская область': 'Тульской',
        'Ярославская область': 'Ярославской',
        'Республика Дагестан': 'Республики Дагестан',
        'Республика Ингушетия': 'Республики Ингушетия',
        'Кабардино-Балкарская Республика': 'Кабардино-Балкарской Республики',
        'Карачаево-Черкесская Республика': 'Карачаево-Черкесской Республики',
        'Республика Северная Осетия-Алания': 'Республики Северной Осетии-Алании',
        'Чеченская Республика': 'Чеченской Республики',
        'Республика Адыгея': 'Республики Адыгея',
        'Республика Калмыкия': 'Республики Калмыкия',
        'Республика Крым': 'Республики Крым',
        'Севастополь': 'Севастополя',
        'г. Севастополь': 'Севастополя',
        'Тюменская область': 'Тюменской',
        'Курганская область': 'Курганской',
        'Иркутская область': 'Иркутской',
        'Омская область': 'Омской',
        'Республика Бурятия': 'Республики Бурятия',
        'Республика Тыва': 'Республики Тыва',
        'Республика Хакасия': 'Республики Хакасия',
        'Алтайский край': 'Алтайского края',
        'Республика Алтай': 'Республики Алтай',
        'Красноярский край': 'Красноярского края',
        'Забайкальский край': 'Забайкальского края',
        'Амурская область': 'Амурской',
        'Сахалинская область': 'Сахалинской',
        'Еврейская автономная область': 'Еврейской',
        'Еврейская АО': 'Еврейской',
        'Камчатский край': 'Камчатском крае',
        'Магаданская область': 'Магаданской',
        'Республика Саха (Якутия)': 'Республики Саха (Якутия)',
        'Якутия': 'Республики Саха (Якутия)',
        'Чукотский автономный округ': 'Чукотского',
        'Чукотский АО': 'Чукотского',
        'Ненецкий автономный округ': 'Ненецкого',
        'Ненецкий АО': 'Ненецкого',
        'Ямало-Ненецкий автономный округ': 'Ямало-Ненецкого',
        'Ямало-Ненецкий АО': 'Ямало-Ненецкого',
        'Ханты-Мансийский автономный округ - Югра': 'Ханты-Мансийского',
        'Ханты-Мансийский АО': 'Ханты-Мансийского',
    };

    // Проверяем прямой маппинг
    if (genitiveMap[regionName]) {
        return genitiveMap[regionName];
    }

    // Автоматическое склонение для неизвестных регионов
    if (regionName.endsWith('область')) {
        return regionName.replace('область', 'области');
    }
    if (regionName.endsWith('край')) {
        return regionName.replace('край', 'края');
    }
    if (regionName.startsWith('Республика ')) {
        return regionName.replace('Республика ', 'Республики ');
    }
    if (regionName.endsWith('Республика')) {
        return regionName.replace('Республика', 'Республики');
    }
    if (regionName.endsWith('автономный округ')) {
        return regionName.replace('автономный округ', 'автономного округа');
    }
    if (regionName.endsWith('АО')) {
        return regionName.replace('АО', 'АО');
    }

    // Если ничего не подошло, возвращаем исходное название
    return regionName;
}

/**
 * Форматирует список регионов в родительном падеже
 * @param {Object} allRegions - объект со списками регионов по типам
 * @returns {string} отформатированная строка
 */
function formatRegionsList(allRegions = {}) {
    // if (!regionNamesList || regionNamesList.length === 0) {
    //     return '';
    // }

    if (Object.keys(allRegions).length === 0) {
        return '';
    }

    let result = '';

    if (allRegions['Край'].length > 0) {
        result += result ? ', ' : '';
        result += `${allRegions['Край'].join(', ')} `;
        result += allRegions['Край'].length > 1 ? 'краев' : 'края';
    }
    if (allRegions['Республика'].length > 0) {
        result += result ? ', ' : '';
        result += allRegions['Республика'].length > 1 ? 'республик ' : 'Республики ';
        result += `${allRegions['Республика'].join(', ')} `;
    }
    if (allRegions['Область'].length > 0) {
        result += result ? ', ' : '';
        result += `${allRegions['Область'].join(', ')} `;
        result += allRegions['Область'].length > 1 ? 'областей' : 'области';
    }
    if (allRegions['АО'].length > 0) {
        result += result ? `, ${allRegions['АО'].join(', ')} АО` : `${allRegions['АО'].join(', ')} АО`;
    }

    return result;
}

/**
 * Определяет диапазон напряжений на основе всех данных
 */
function getVoltageRange(parsedData) {
    let minVoltage = Infinity;
    let maxVoltage = 0;
    let unit = 'кВ';

    // Обходим все данные для поиска min/max напряжения
    Object.values(parsedData).forEach(district => {
        Object.values(district).forEach(companies => {
            companies.forEach(company => {
                const range = company.voltageRange;
                // Извлекаем все числа из строки напряжения
                const numbers = range.match(/(\d+[,.]?\d*)/g);

                if (numbers) {
                    numbers.forEach(num => {
                        const value = parseFloat(num.replace(',', '.'));
                        if (!isNaN(value)) {
                            minVoltage = Math.min(minVoltage, value);
                            maxVoltage = Math.max(maxVoltage, value);
                        }
                    });
                }
            });
        });
    });

    // Если нет данных о напряжении
    if (minVoltage === Infinity || maxVoltage === 0) {
        return '';
    }

    if (minVoltage === maxVoltage) {
        return `${maxVoltage} ${unit}`;
    }

    // Форматируем с запятой для десятых
    const formatVoltage = (v) => {
        return v % 1 === 0 ? v.toString() : v.toString().replace('.', ',');
    };

    return `${formatVoltage(minVoltage)}-${formatVoltage(maxVoltage)} ${unit}`;
}

/**
 * Собирает уникальные регионы из данных
 */
function getUniqueRegions(parsedData) {
    const regions = new Set();

    Object.values(parsedData).forEach(district => {
        Object.keys(district).forEach(region => {
            regions.add(region);
        });
    });

    return Array.from(regions).sort();
}

/**
 * Генерирует суммарную информацию по подтоплениям
 * @param {Object} parsedData - распарсенные данные (текущий период)
 * @param {Object} previousParsedData - распарсенные данные (предыдущий период)
 * @param {string} previousDate - дата предыдущего периода в формате ДД.ММ.ГГГГ
 * @returns {Object} - объект с суммарной информацией и HTML разметкой
 */
export function generateFloodSummary(parsedData, previousParsedData = null, previousDate = '') {

    if (!parsedData || Object.keys(parsedData).length === 0) {
        return {
            text: 'Нет данных о подтоплениях',
            html: '<p class="text-muted">Нет данных о подтоплениях</p>',
            stats: null,
        };
    }
    // Подсчет текущих значений
    let totalPoles = 0;
    let totalLines = 0;
    let totalSubstations = 0;

    Object.values(parsedData).forEach(district => {
        Object.values(district).forEach(companies => {
            companies.forEach(company => {
                totalPoles += company.totalPoles || 0;
                totalLines += company.totalLines || 0;
                totalSubstations += company.totalSubstations || 0;
            });
        });
    });
    // Подсчет предыдущих значений
    let previousTotalPoles = 0;
    let previousTotalLines = 0;
    let previousTotalSubstations = 0;

    if (previousParsedData) {
        Object.values(previousParsedData).forEach(district => {
            Object.values(district).forEach(companies => {
                companies.forEach(company => {
                    previousTotalPoles += company.totalPoles || 0;
                    previousTotalLines += company.totalLines || 0;
                    previousTotalSubstations += company.totalSubstations || 0;
                });
            });
        });
    }

    // Получаем диапазон напряжений
    const voltageRange = getVoltageRange(parsedData);

    // Получаем уникальные регионы
    const allRegions = {
        'Область': [],
        'Республика': [],
        'Край': [],
        'АО': [],
    };
    const regions = getUniqueRegions(parsedData);
    const regionNamesList = regions.map(region => {
        if (region.toLowerCase().includes('область')) {
            allRegions['Область'].push(getRegionGenitive(region));
        }
        if (region.toLowerCase().includes('республика')) {
            allRegions['Республика'].push(getRegionGenitive(region));
        }
        if (region.toLowerCase().includes('край')) {
            allRegions['Край'].push(getRegionGenitive(region));
        }
        if (region.toLowerCase().includes('ао')) {
            allRegions['АО'].push(getRegionGenitive(region));
        }
        return getRegionGenitive(region);
    });

    // Форматируем список регионов в зависимости от количества
    let locationText = '';
    if (regions.length === 1) {
        const regionName = regions[0];
        const regionPrepositional = getRegionPrepositional(regionName);
        locationText = `на территории ${regionPrepositional}`;
    } else {
        const regionsText = formatRegionsList(allRegions);
        locationText = `на территориях ${regions.length} субъектов России: ${regionsText}`;
    }

    // Форматируем числа
    const formattedPoles = formatNumber(totalPoles);
    const formattedPreviousPoles = formatNumber(previousTotalPoles);
    const formattedLines = formatNumber(totalLines);
    const formattedPreviousLines = formatNumber(previousTotalLines);
    const formattedSubstations = formatNumber(totalSubstations);
    const formattedPreviousSubstations = formatNumber(previousTotalSubstations);

    // Правильное склонение
    const polesWord = getWordForm(totalPoles, 'опора');
    const linesWord = 'ЛЭП';
    const substationsWord = 'ТП';

    // Определяем статус изменения для цвета
    let polesChangeClass = 'color-red';
    let linesChangeClass = 'color-red';
    let substationsChangeClass = 'color-red';

    if (previousParsedData) {
        if (totalPoles === previousTotalPoles) {
            polesChangeClass = 'color-black';
        } else if (totalPoles < previousTotalPoles) {
            polesChangeClass = 'color-green';
        }

        if (totalLines === previousTotalLines) {
            linesChangeClass = 'color-black';
        } else if (totalLines < previousTotalLines) {
            linesChangeClass = 'color-green';
        }

        if (totalSubstations === previousTotalSubstations) {
            substationsChangeClass = 'color-black';
        } else if (totalSubstations < previousTotalSubstations) {
            substationsChangeClass = 'color-green';
        }
    }

    // Генерируем HTML (сноска для скобок — в generateFullSummary, один раз на блок)
    const isSubstations = totalSubstations > 0;
    const html = isSubstations ? `
    <p class="summary-text">
      <strong>Паводок:</strong> 
      подтоплены 
      <span class="${polesChangeClass}">${formattedPoles}</span> 
      (<span class="color-grey">${formattedPreviousPoles}</span>)* ${polesWord} 
      <span class="${linesChangeClass}">${formattedLines}</span> 
      (<span class="color-grey">${formattedPreviousLines}</span>)* ${linesWord} ${voltageRange},
      <span class="${substationsChangeClass}">${formattedSubstations}</span> 
      (<span class="color-grey">${formattedPreviousSubstations}</span>)* ${substationsWord} 
      ${locationText}.
    </p>
  ` : `
    <p class="summary-text">
      <strong>Паводок:</strong> 
      подтоплены 
      <span class="${polesChangeClass}">${formattedPoles}</span> 
      (<span class="color-grey">${formattedPreviousPoles}</span>)* ${polesWord} 
      <span class="${linesChangeClass}">${formattedLines}</span> 
      (<span class="color-grey">${formattedPreviousLines}</span>)* ${linesWord} ${voltageRange}
      ${locationText}.
    </p>
  `;

    // Простой текст
    const text = isSubstations ? `
    Паводок: подтоплены ${formattedPoles} (${formattedPreviousPoles})* ${polesWord} ${formattedLines} (${formattedPreviousLines})* ${linesWord} ${voltageRange}, ${formattedSubstations} (${formattedPreviousSubstations})* ${substationsWord} ${locationText}.` :
    `Паводок: подтоплены ${formattedPoles} (${formattedPreviousPoles})* ${polesWord} ${formattedLines} (${formattedPreviousLines})* ${linesWord} ${voltageRange} ${locationText}.`;

    return {
        text,
        html,
        stats: {
            totalPoles,
            previousTotalPoles,
            totalLines,
            previousTotalLines,
            voltageRange,
            regionsCount: regions.length,
            regions: regionNamesList,
            polesWord,
            locationText,
            previousDate,
        },
    };
}

/**
 * Генерирует сводку по пожарам из суммарных данных
 */
export function generateFireSummary(fireSummary, previousFireSummary = null, previousDate = '') {
    if (!fireSummary || (fireSummary.currentFires === 0 && fireSummary.currentArea === 0)) {
        return null;
    }

    const currentFires = formatNumber(fireSummary.currentFires || 0);
    const previousFires = formatNumber(
        previousFireSummary ? previousFireSummary.currentFires : 0
    );
    const currentArea = formatNumber(fireSummary.currentArea || 0);
    const previousArea = formatNumber(
        previousFireSummary ? previousFireSummary.currentArea : 0
    );

    const fireWord = getWordForm(currentFires, 'очаг');

    let firesClass = 'color-red';
    let areaClass = 'color-red';

    if (previousFireSummary) {
        if ((fireSummary.currentFires || 0) === (previousFireSummary.currentFires || 0)) {
            firesClass = 'color-black';
        } else if ((fireSummary.currentFires || 0) < (previousFireSummary.currentFires || 0)) {
            firesClass = 'color-green';
        }

        if ((fireSummary.currentArea || 0) === (previousFireSummary.currentArea || 0)) {
            areaClass = 'color-black';
        } else if ((fireSummary.currentArea || 0) < (previousFireSummary.currentArea || 0)) {
            areaClass = 'color-green';
        }
    }

    const html = `
    <p class="summary-text">
      <strong>Пожары:</strong> 
      действуют 
      <span class="${firesClass}">${currentFires}</span> 
      (<span class="color-grey">${previousFires}</span>)* ${fireWord} 
      на общей площади 
      <span class="${areaClass}">${currentArea}</span> 
      (<span class="color-grey">${previousArea}</span>)* га.
    </p>
  `;

    const text = `Пожары: действуют ${currentFires} (${previousFires})* ${fireWord} на общей площади ${currentArea} (${previousArea})* га.`;

    return {
        text,
        html,
        stats: {
            currentFires: fireSummary.currentFires || 0,
            previousFires: previousFireSummary ? previousFireSummary.currentFires : 0,
            currentArea: fireSummary.currentArea || 0,
            previousArea: previousFireSummary ? previousFireSummary.currentArea : 0,
        },
    };
}

/**
 * Генерирует сводку для всех типов происшествий
 */
export function generateFullSummary(
    floodData,
    fireData,
    stormData,
    previousData = {},
    previousDate = '',
    fireSummary = null,
    previousFireSummary = null
) {
    const parts = [];
    let isFloodData = floodData && Object.keys(floodData).length > 0;
    let isFireData = fireSummary && (fireSummary.currentFires > 0 || fireSummary.currentArea > 0);

    // Сводка по паводкам - возвращает только HTML строку с <p>
    if (isFloodData) {
        const floodSummaryResult = generateFloodSummary(
            floodData,
            previousData.flood || null,
            previousDate
        );
        if (floodSummaryResult && floodSummaryResult.html) {
            parts.push(floodSummaryResult.html);
        }
    } else {
        parts.push('<p class="summary-text"><strong>Паводки:</strong> подтопленного оборудования нет.</p>');
    }

    // Сводка по пожарам - возвращает только HTML строку с <p>
    if (isFireData) {
        const fireSummaryResult = generateFireSummary(
            fireSummary,
            previousFireSummary || previousData.fireSummary || null,
            previousDate
        );
        if (fireSummaryResult && fireSummaryResult.html) {
            parts.push(fireSummaryResult.html);
        }
    } else {
        parts.push('<p class="summary-text"><strong>Пожары:</strong> действующих природных пожаров не зафиксировано.</p>');
    }

    // Если нет данных - возвращаем пустой массив
    if (parts.length === 0) {
        return [];
    }

    // Формируем единую сноску
    let footnoteHTML = '';
    if (previousDate && (isFloodData || isFireData)) {
        footnoteHTML = `
      <p class="summary-footnote">
        <small class="text-muted">*в скобках указана информация на ${previousDate}</small>
      </p>
    `;
    } else if (isFloodData || isFireData) {
        footnoteHTML = `
      <p class="summary-footnote">
        <small class="text-muted">*в скобках указана информация за предыдущий период</small>
      </p>
    `;
    }

    // Собираем все в один блок с одной сноской
    const combinedHTML = `
    <div class="summary-block">
      ${parts.join('\n')}
      ${footnoteHTML}
    </div>
  `;

    return [{
        type: 'combined',
        html: combinedHTML,
        text: parts.join(' '),
    }];
}

// Экспортируем для тестирования
export {
    getRegionGenitive,
    formatRegionsList,
    getVoltageRange,
    getUniqueRegions,
};
