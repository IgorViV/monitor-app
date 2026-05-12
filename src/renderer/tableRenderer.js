import { REGION_TO_COLOR, INCIDENT_ICONS } from '../utils/constants';
import { formatComparisonLine } from '../comparison/formatters';
import { getWordForm, formatNumber } from '../utils/textUtils';

/**
 * Определяет активные иконки для федерального округа на основе имеющихся данных
 */
function getActiveIcons(mergedDistrictData) {
    const icons = [];

    // Все возможные иконки
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
        const hasData = mergedDistrictData[icon.key] &&
            Object.keys(mergedDistrictData[icon.key]).length > 0;

        icons.push({
            ...icon,
            visible: hasData,
        });
    });

    return icons;
}

/**
 * Создает иконку для типа происшествия
 */
function createIconElement(iconData) {
    const img = document.createElement('img');
    img.className = 'district-icon';
    img.src = iconData.src;
    img.alt = iconData.alt;

    if (!iconData.visible) {
        img.classList.add('visually-hidden');
    }

    return img;
}

/**
 * Создает заголовок федерального округа
 */
function createDistrictHeader(districtName, mergedDistrictData) {
    const headerDiv = document.createElement('div');
    headerDiv.className = 'district-content';

    // Заголовок h5 с цветом округа
    const title = document.createElement('h5');
    title.className = 'district-title';

    // Устанавливаем цвет фона для округа
    const bgColor = REGION_TO_COLOR[districtName] || '#f5f5f5';
    title.style.backgroundColor = bgColor;

    // Название округа
    const titleSpan = document.createElement('span');
    titleSpan.textContent = districtName;
    title.appendChild(titleSpan);

    // Контейнер для иконок
    const iconsContainer = document.createElement('div');
    iconsContainer.className = 'district-icons-container';

    // Добавляем иконки
    const icons = getActiveIcons(mergedDistrictData);
    icons.forEach(iconData => {
        iconsContainer.appendChild(createIconElement(iconData));
    });

    title.appendChild(iconsContainer);
    headerDiv.appendChild(title);

    return headerDiv;
}

/**
 * Создает секцию с данными по предприятию (филиалу)
 */
function createFilialSection(item) {
    const formatted = formatComparisonLine(item);

    const filialDiv = document.createElement('div');
    filialDiv.className = 'region-filial';

    // Название предприятия
    const companyP = document.createElement('p');
    companyP.textContent = formatted.company;
    filialDiv.appendChild(companyP);

    // Данные об опорах и линиях
    const dataP = document.createElement('p');

    // Текущее количество опор
    const currentPolesSpan = document.createElement('span');
    currentPolesSpan.className = formatted.currentPolesClass;
    currentPolesSpan.textContent = formatted.currentPoles;
    dataP.appendChild(currentPolesSpan);

    // Предыдущее количество опор в скобках
    dataP.appendChild(document.createTextNode(' ('));
    const prevPolesSpan = document.createElement('span');
    prevPolesSpan.className = formatted.previousPolesClass;
    prevPolesSpan.textContent = formatted.previousPoles;
    dataP.appendChild(prevPolesSpan);
    dataP.appendChild(document.createTextNode(')* '));

    // Слово "опора" с правильным склонением
    dataP.appendChild(document.createTextNode(formatted.polesWord + ' на '));

    // Текущее количество линий
    const currentLinesSpan = document.createElement('span');
    currentLinesSpan.className = formatted.currentLinesClass;
    currentLinesSpan.textContent = formatted.currentLines;
    dataP.appendChild(currentLinesSpan);

    // Предыдущее количество линий в скобках
    dataP.appendChild(document.createTextNode(' ('));
    const prevLinesSpan = document.createElement('span');
    prevLinesSpan.className = formatted.previousLinesClass;
    prevLinesSpan.textContent = formatted.previousLines;
    dataP.appendChild(prevLinesSpan);
    dataP.appendChild(document.createTextNode(')* '));

    // Слово "ВЛ" и диапазон напряжения
    dataP.appendChild(document.createTextNode(`${formatted.linesWord} ${formatted.voltageRange}`));

    filialDiv.appendChild(dataP);

    return filialDiv;
}

/**
 * Создает секцию региона
 */
function createRegionSection(regionName, regionData) {
    const regionDiv = document.createElement('div');
    regionDiv.className = 'district-region';

    // Заголовок региона
    const regionTitle = document.createElement('h6');
    regionTitle.className = 'region-title';
    regionTitle.textContent = regionName;
    regionDiv.appendChild(regionTitle);

    // Сортируем предприятия по алфавиту
    const sortedCompanies = regionData.sort((a, b) =>
        a.company.localeCompare(b.company)
    );

    // Добавляем данные по каждому предприятию
    sortedCompanies.forEach(company => {
        regionDiv.appendChild(createFilialSection(company));
    });

    return regionDiv;
}

/**
 * Генерирует полный отчет с отдельными таблицами для каждого федерального округа
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

    // Сортируем федеральные округа
    const sortedDistricts = Object.keys(mergedData).sort();

    // Для каждого федерального округа создаем отдельный блок
    sortedDistricts.forEach(district => {
        const districtBlock = createDistrictHeader(district, mergedData[district]);

        // Сортируем регионы
        const regions = mergedData[district].flood || {};
        const sortedRegions = Object.keys(regions).sort();

        // Добавляем регионы
        sortedRegions.forEach(region => {
            const regionSection = createRegionSection(region, regions[region]);
            districtBlock.appendChild(regionSection);
        });

        container.appendChild(districtBlock);
    });
}

// Экспортируем функции для тестирования
export {
    createDistrictHeader,
    createRegionSection,
    createFilialSection,
    getActiveIcons,
    createIconElement,
};