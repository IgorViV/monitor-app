import { REGION_TO_COLOR, INCIDENT_ICONS } from '../utils/constants';
import { formatComparisonLine } from '../comparison/formatters';
import { getWordForm, formatNumber, sortDistricts } from '../utils/textUtils';
import { svgMap, svgLogo } from './svgElements.js';

// Константы для группировки иконок
const STORM_RELATED_ICONS = ['storm', 'wind', 'raine', 'health', 'thunderstorm'];

/**
 * Создает иконку для типа происшествия
 * @param {Object} iconData - Данные иконки
 * @param {string} iconData.src - Путь к изображению
 * @param {string} iconData.alt - Альтернативный текст
 * @param {boolean} iconData.visible - Флаг видимости
 * @returns {HTMLImageElement}
 */
function createIconElement(iconData) {
    const img = document.createElement('img');
    img.className = 'district-icon';
    img.src = iconData.src;
    img.alt = iconData.alt;
    img.title = iconData.alt;

    if (!iconData.visible) {
        img.classList.add('visually-hidden');
    }

    return img;
}

/**
 * Проверяет наличие данных о штормовых явлениях для конкретного типа
 * @param {Object} mergedDistrictData - Данные федерального округа
 * @param {string} iconKey - Ключ иконки для проверки
 * @returns {boolean}
 */
function checkStormData(mergedDistrictData, iconKey) {
    const stormData = mergedDistrictData?.storm;

    if (!stormData || Object.keys(stormData).length === 0) {
        return false;
    }

    return Object.values(stormData).some(stormArray =>
        Array.isArray(stormArray) &&
        stormArray.length > 0 &&
        Array.isArray(stormArray[0]?.icons) &&
        stormArray[0].icons.includes(iconKey)
    );
}

/**
 * Определяет активные иконки для федерального округа
 * @param {Object} mergedDistrictData - Данные федерального округа
 * @returns {Array<Object>} Массив иконок с флагом видимости
 */
function getActiveIcons(mergedDistrictData) {
    if (!mergedDistrictData) {
        return [];
    }

    const allIcons = [
        { key: 'flood', ...INCIDENT_ICONS.flood },
        { key: 'fire', ...INCIDENT_ICONS.fire },
        ...STORM_RELATED_ICONS.map(key => ({ key, ...INCIDENT_ICONS[key] }))
    ];

    return allIcons.map(icon => {
        let hasData = false;

        switch (icon.key) {
            case 'flood':
                hasData = Boolean(
                    mergedDistrictData.flood &&
                    Object.keys(mergedDistrictData.flood).length > 0
                );
                break;

            case 'fire':
                hasData = Boolean(
                    mergedDistrictData.fire &&
                    Object.keys(mergedDistrictData.fire).length > 0
                );
                break;

            default:
                if (STORM_RELATED_ICONS.includes(icon.key)) {
                    hasData = checkStormData(mergedDistrictData, icon.key);
                }
                break;
        }

        return {
            ...icon,
            visible: hasData,
        };
    });
}

/**
 * Создает заголовок федерального округа
 * @param {string} districtName - Название федерального округа
 * @param {Object} mergedDistrictData - Данные федерального округа
 * @returns {HTMLDivElement}
 */
function createDistrictHeader(districtName, mergedDistrictData) {
    const headerDiv = document.createElement('div');
    headerDiv.className = 'district-content';

    const title = document.createElement('h5');
    title.className = 'district-title';

    title.style.backgroundColor = REGION_TO_COLOR[districtName] || '#f5f5f5';
    title.style.backgroundColor = title.style.backgroundColor.replace('rgb', 'rgba').replace(')', ', 0.5)');

    const titleSpan = document.createElement('span');
    titleSpan.textContent = districtName;
    title.appendChild(titleSpan);

    const iconsContainer = document.createElement('div');
    iconsContainer.className = 'district-icons-container';

    const icons = getActiveIcons(mergedDistrictData);
    icons.forEach(iconData => {
        iconsContainer.appendChild(createIconElement(iconData));
    });

    title.appendChild(iconsContainer);
    headerDiv.appendChild(title);

    return headerDiv;
}

/**
 * Создает span элемент для сравнения значений
 * @param {number} value - Значение
 * @param {string} className - CSS класс
 * @returns {HTMLSpanElement}
 */
function createComparisonSpan(value, className) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = formatNumber(value || 0);

    return span;
}

/**
 * Определяет CSS класс для статуса изменения пожаров
 * @param {Object} fireData - Данные о пожарах
 * @param {string} field - Тип поля ('fires' или 'area')
 * @returns {string} CSS класс
 */
function getFireStatusClass(fireData, field) {
    const currentField = field === 'fires' ? 'currentFires' : 'currentArea';
    const previousField = field === 'fires' ? 'previousFires' : 'previousArea';

    const current = fireData?.[currentField] || 0;
    const previous = fireData?.[previousField] || 0;

    if (current > previous) return 'color-red';
    if (current < previous) return 'color-green';
    return 'color-black';
}

/**
 * Создает секцию с данными о пожарах в регионе
 * @param {Object} fireData - Данные о пожарах
 * @returns {HTMLDivElement|null}
 */
function createFireSection(fireData) {
    if (!fireData) {
        return null;
    }

    const {
        currentFires = 0,
        previousFires = 0,
        currentArea = 0,
        previousArea = 0
    } = fireData;

    if (!currentFires && !previousFires && !currentArea && !previousArea) {
        return null;
    }

    const fireDiv = document.createElement('div');
    fireDiv.className = 'region-filial fire-item';

    const dataP = document.createElement('p');

    const firesClass = getFireStatusClass(fireData, 'fires');
    const areaClass = getFireStatusClass(fireData, 'area');

    // Количество очагов
    dataP.appendChild(createComparisonSpan(currentFires, firesClass));
    dataP.appendChild(document.createTextNode(' ('));
    dataP.appendChild(createComparisonSpan(previousFires, 'color-grey'));
    dataP.appendChild(document.createTextNode(`)* ${getWordForm(currentFires, 'очаг')}, `));

    // Площадь
    dataP.appendChild(createComparisonSpan(currentArea, areaClass));
    dataP.appendChild(document.createTextNode(' ('));
    dataP.appendChild(createComparisonSpan(previousArea, 'color-grey'));
    dataP.appendChild(document.createTextNode(')* га'));

    fireDiv.appendChild(dataP);

    return fireDiv;
}

/**
 * Создает секцию с данными о подтоплениях (филиале)
 * @param {Object} item - Данные о подтоплении
 * @returns {HTMLDivElement}
 */
function createFloodSection(item) {
    const formatted = formatComparisonLine(item);
    const filialDiv = document.createElement('div');
    filialDiv.className = 'region-filial';

    const companyP = document.createElement('p');
    companyP.textContent = formatted.company;
    filialDiv.appendChild(companyP);

    const dataP = document.createElement('p');

    // Опоры
    dataP.appendChild(createComparisonSpan(formatted.currentPoles, formatted.currentPolesClass));
    dataP.appendChild(document.createTextNode(' ('));
    dataP.appendChild(createComparisonSpan(formatted.previousPoles, formatted.previousPolesClass));
    dataP.appendChild(document.createTextNode(')* '));
    dataP.appendChild(document.createTextNode(formatted.polesWord + ' на '));

    // Линии
    dataP.appendChild(createComparisonSpan(formatted.currentLines, formatted.currentLinesClass));
    dataP.appendChild(document.createTextNode(' ('));
    dataP.appendChild(createComparisonSpan(formatted.previousLines, formatted.previousLinesClass));
    dataP.appendChild(document.createTextNode(')* '));
    dataP.appendChild(document.createTextNode(`${formatted.linesWord} ${formatted.voltageRange}`));

    // Подстанции
    if (formatted.currentSubstations > 0) {
        dataP.appendChild(document.createTextNode(', '));
        dataP.appendChild(createComparisonSpan(formatted.currentSubstations, formatted.currentSubstationsClass));
        dataP.appendChild(document.createTextNode(' ('));
        dataP.appendChild(createComparisonSpan(formatted.previousSubstations, formatted.previousSubstationsClass));
        dataP.appendChild(document.createTextNode(')* ТП'));
    }

    filialDiv.appendChild(dataP);

    return filialDiv;
}

/**
 * Создает секцию региона с учетом пожаров и паводков
 * @param {string} regionName - Название региона
 * @param {Array} regionData - Данные о паводках в регионе
 * @param {Object|null} fireData - Данные о пожарах в регионе
 * @returns {HTMLDivElement}
 */
function createRegionSection(regionName, regionData = [], fireData = null) {
    const regionDiv = document.createElement('div');
    regionDiv.className = 'district-region';

    const regionTitle = document.createElement('h6');
    regionTitle.className = 'region-title';
    regionTitle.textContent = regionName;
    regionDiv.appendChild(regionTitle);

    // Сначала показываем пожары (если есть)
    const fireSection = createFireSection(fireData);
    if (fireSection) {
        regionDiv.appendChild(fireSection);
    }

    // Затем показываем паводки
    if (regionData.length > 0) {
        const sortedCompanies = [...regionData].sort((a, b) =>
            a.company.localeCompare(b.company)
        );

        sortedCompanies.forEach(company => {
            regionDiv.appendChild(createFloodSection(company));
        });
    }

    return regionDiv;
}

/**
 * Собирает все уникальные регионы из данных округа
 * @param {Object} districtData - Данные федерального округа
 * @returns {string[]} Отсортированный массив названий регионов
 */
function collectRegions(districtData) {
    const allRegions = new Set();

    ['flood', 'fire'].forEach(dataType => {
        if (districtData[dataType]) {
            Object.keys(districtData[dataType]).forEach(region => allRegions.add(region));
        }
    });

    return Array.from(allRegions).sort();
}

/**
 * Генерирует полный отчет с поддержкой пожаров
 * @param {HTMLElement} container - DOM элемент для вставки отчета
 * @param {Object} mergedData - Объединенные данные для отчета
 */
export function generateFullReport(container, mergedData) {
    container.innerHTML = '';
    if (!mergedData || Object.keys(mergedData).length === 0) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-info';
        alert.textContent = 'Нет данных для формирования отчета';
        container.appendChild(alert);
        return;
    }

    // Безопасно извлекаем служебные ключи, не мутируя исходный объект
    const { _fireSummary: fireSummary, ...districtData } = mergedData;

    // Сортируем округа в заданном порядке
    const districtKeys = sortDistricts(
        Object.keys(districtData).filter(key => !key.startsWith('_'))
    );

    districtKeys.forEach(district => {
        const districtInfo = districtData[district];
        if (!districtInfo) return;
        if (isEmptyObject(districtInfo.flood) && isEmptyObject(districtInfo.fire)) return;

        const districtBlock = createDistrictHeader(district, districtInfo);
        // Собираем все регионы из всех типов данных
        const sortedRegions = collectRegions(districtInfo);

        sortedRegions.forEach(region => {
            const floodData = districtInfo.flood?.[region] || [];
            const fireDataArray = districtInfo.fire?.[region] || [];
            const fireData = fireDataArray.length > 0 ? fireDataArray[0] : null;
            const regionSection = createRegionSection(region, floodData, fireData);
            districtBlock.appendChild(regionSection);
        });
        container.appendChild(districtBlock);
    });

    // Восстанавливаем fireSummary если был (в исходном объекте)
    if (fireSummary) {
        mergedData._fireSummary = fireSummary;
    }
}

/**
 * Проверяет, является ли значение пустым объектом
 * @param value
 * @return {boolean}
 */
function isEmptyObject(value) {
    return typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0;
}


// Экспорт для тестирования
export {
    createDistrictHeader,
    createRegionSection,
    createFloodSection,
    createFireSection,
    getActiveIcons,
    createIconElement,
    getFireStatusClass,
    checkStormData,
    collectRegions,
};