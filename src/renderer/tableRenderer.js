import { REGION_TO_COLOR, INCIDENT_ICONS } from '../utils/constants';
import { formatComparisonLine } from '../comparison/formatters';
import { getWordForm, formatNumber } from '../utils/textUtils';

/**
 * Создает иконку для типа происшествия
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
 * Определяет активные иконки для федерального округа
 */
function getActiveIcons(mergedDistrictData) {
    const icons = [];

    const allIcons = [
        { key: 'flood', ...INCIDENT_ICONS.flood },
        { key: 'fire', ...INCIDENT_ICONS.fire },
        { key: 'storm', ...INCIDENT_ICONS.storm },
        { key: 'wind', ...INCIDENT_ICONS.wind },
        { key: 'raine', ...INCIDENT_ICONS.raine },
        { key: 'health', ...INCIDENT_ICONS.health },
        { key: 'thunderstorm', ...INCIDENT_ICONS.thunderstorm },
    ];

    allIcons.forEach(icon => {
        let hasData = false;

        if (icon.key === 'flood') {
            hasData = mergedDistrictData.flood && Object.keys(mergedDistrictData.flood).length > 0;
        } else if (icon.key === 'fire') {
            hasData = mergedDistrictData.fire && Object.keys(mergedDistrictData.fire).length > 0;
        } else if (icon.key === 'storm') {
            hasData = mergedDistrictData.storm && Object.keys(mergedDistrictData.storm).length > 0;
        }

        icons.push({
            ...icon,
            visible: hasData,
        });
    });

    return icons;
}

/**
 * Создает заголовок федерального округа
 */
function createDistrictHeader(districtName, mergedDistrictData) {
    const headerDiv = document.createElement('div');
    headerDiv.className = 'district-content';

    const title = document.createElement('h5');
    title.className = 'district-title';

    const bgColor = REGION_TO_COLOR[districtName] || '#f5f5f5';
    title.style.backgroundColor = bgColor;

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
 * Определяет CSS класс для статуса изменения пожаров
 */
function getFireStatusClass(fireData, field) {
    const currentField = field === 'fires' ? 'currentFires' : 'currentArea';
    const previousField = field === 'fires' ? 'previousFires' : 'previousArea';

    const current = fireData[currentField] || 0;
    const previous = fireData[previousField] || 0;

    if (current > previous) return 'color-red';
    if (current < previous) return 'color-green';
    return 'color-black';
}

/**
 * Создает секцию с данными о пожарах в регионе
 */
function createFireSection(fireData) {
    if (!fireData || (!fireData.currentFires && !fireData.previousFires)) {
        return null;
    }

    const fireDiv = document.createElement('div');
    fireDiv.className = 'region-filial fire-item';

    // Данные о пожарах
    const dataP = document.createElement('p');

    const firesClass = getFireStatusClass(fireData, 'fires');
    const areaClass = getFireStatusClass(fireData, 'area');

    // Количество очагов
    const currentFiresSpan = document.createElement('span');
    currentFiresSpan.className = firesClass;
    currentFiresSpan.textContent = formatNumber(fireData.currentFires || 0);
    dataP.appendChild(currentFiresSpan);

    dataP.appendChild(document.createTextNode(' ('));
    const prevFiresSpan = document.createElement('span');
    prevFiresSpan.className = 'color-grey';
    prevFiresSpan.textContent = formatNumber(fireData.previousFires || 0);
    dataP.appendChild(prevFiresSpan);
    dataP.appendChild(document.createTextNode(')* очага, '));

    // Площадь
    const currentAreaSpan = document.createElement('span');
    currentAreaSpan.className = areaClass;
    currentAreaSpan.textContent = formatNumber(fireData.currentArea || 0);
    dataP.appendChild(currentAreaSpan);

    dataP.appendChild(document.createTextNode(' ('));
    const prevAreaSpan = document.createElement('span');
    prevAreaSpan.className = 'color-grey';
    prevAreaSpan.textContent = formatNumber(fireData.previousArea || 0);
    dataP.appendChild(prevAreaSpan);
    dataP.appendChild(document.createTextNode(')* га'));

    fireDiv.appendChild(dataP);

    return fireDiv;
}

/**
 * Создает секцию с данными о подтоплениях (филиале)
 */
function createFloodSection(item) {
    const formatted = formatComparisonLine(item);

    const filialDiv = document.createElement('div');
    filialDiv.className = 'region-filial';

    const companyP = document.createElement('p');
    companyP.textContent = formatted.company;
    filialDiv.appendChild(companyP);

    const dataP = document.createElement('p');

    const currentPolesSpan = document.createElement('span');
    currentPolesSpan.className = formatted.currentPolesClass;
    currentPolesSpan.textContent = formatted.currentPoles;
    dataP.appendChild(currentPolesSpan);

    dataP.appendChild(document.createTextNode(' ('));
    const prevPolesSpan = document.createElement('span');
    prevPolesSpan.className = formatted.previousPolesClass;
    prevPolesSpan.textContent = formatted.previousPoles;
    dataP.appendChild(prevPolesSpan);
    dataP.appendChild(document.createTextNode(')* '));

    dataP.appendChild(document.createTextNode(formatted.polesWord + ' на '));

    const currentLinesSpan = document.createElement('span');
    currentLinesSpan.className = formatted.currentLinesClass;
    currentLinesSpan.textContent = formatted.currentLines;
    dataP.appendChild(currentLinesSpan);

    dataP.appendChild(document.createTextNode(' ('));
    const prevLinesSpan = document.createElement('span');
    prevLinesSpan.className = formatted.previousLinesClass;
    prevLinesSpan.textContent = formatted.previousLines;
    dataP.appendChild(prevLinesSpan);
    dataP.appendChild(document.createTextNode(')* '));

    dataP.appendChild(document.createTextNode(`${formatted.linesWord} ${formatted.voltageRange}`));

    filialDiv.appendChild(dataP);

    return filialDiv;
}

/**
 * Создает секцию региона с учетом пожаров и паводков
 */
function createRegionSection(regionName, regionData, fireData = null) {
    const regionDiv = document.createElement('div');
    regionDiv.className = 'district-region';

    const regionTitle = document.createElement('h6');
    regionTitle.className = 'region-title';
    regionTitle.textContent = regionName;
    regionDiv.appendChild(regionTitle);

    // Сначала показываем пожары (если есть)
    if (fireData) {
        const fireSection = createFireSection(fireData);
        if (fireSection) {
            regionDiv.appendChild(fireSection);
        }
    }

    // Затем показываем паводки
    if (regionData && regionData.length > 0) {
        const sortedCompanies = regionData.sort((a, b) =>
            a.company.localeCompare(b.company)
        );

        sortedCompanies.forEach(company => {
            regionDiv.appendChild(createFloodSection(company));
        });
    }

    return regionDiv;
}

/**
 * Генерирует полный отчет с поддержкой пожаров
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

    // Убираем служебные ключи
    const fireSummary = mergedData._fireSummary;
    delete mergedData._fireSummary;

    // Фильтруем только обычные ключи (федеральные округа)
    const districtKeys = Object.keys(mergedData).filter(key => !key.startsWith('_'));
    const sortedDistricts = districtKeys.sort();

    sortedDistricts.forEach(district => {
        const districtData = mergedData[district];
        if (!districtData) return;

        const districtBlock = createDistrictHeader(district, districtData);

        // Собираем все регионы
        const allRegions = new Set();

        if (districtData.flood) {
            Object.keys(districtData.flood).forEach(r => allRegions.add(r));
        }

        if (districtData.fire) {
            Object.keys(districtData.fire).forEach(r => allRegions.add(r));
        }

        if (districtData.storm) {
            Object.keys(districtData.storm).forEach(r => allRegions.add(r));
        }

        const sortedRegions = Array.from(allRegions).sort();

        sortedRegions.forEach(region => {
            const floodData = districtData.flood?.[region] || [];
            const fireDataArray = districtData.fire?.[region] || [];
            const fireData = fireDataArray.length > 0 ? fireDataArray[0] : null;

            const regionSection = createRegionSection(region, floodData, fireData);
            districtBlock.appendChild(regionSection);
        });

        container.appendChild(districtBlock);
    });

    // Восстанавливаем fireSummary если был
    if (fireSummary) {
        mergedData._fireSummary = fireSummary;
    }
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
};