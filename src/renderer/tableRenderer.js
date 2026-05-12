import { getWordForm, formatNumber } from '../utils/textUtils';
import { getChangeColorClass, formatPolesWithChange, formatLinesInfo } from '../comparison/formatters';

/**
 * Создает строку таблицы для предприятия
 * @param {Object} item - данные предприятия
 * @returns {HTMLTableRowElement} строка таблицы
 */
export function createTableRow(item) {
    const row = document.createElement('tr');

    // Ячейка с названием предприятия
    const companyCell = document.createElement('td');
    companyCell.className = 'fw-bold';
    companyCell.textContent = item.company;

    // Ячейка с информацией об опорах и линиях
    const infoCell = document.createElement('td');

    // Форматируем информацию об опорах
    const polesWord = getWordForm(item.currentPoles || 0, 'опора');
    const polesSpan = document.createElement('span');
    polesSpan.className = getChangeColorClass(item.status);
    polesSpan.textContent = `${formatNumber(item.currentPoles || 0)} ${polesWord}`;

    infoCell.appendChild(polesSpan);

    // Добавляем информацию о разнице, если есть
    if (item.previousPoles !== null && item.previousPoles !== undefined && item.status !== 'unchanged') {
        const diffSign = item.difference > 0 ? '+' : '';
        const diffSpan = document.createElement('span');
        diffSpan.className = `ms-2 ${getChangeColorClass(item.status)}`;
        diffSpan.textContent = `(${diffSign}${item.difference})`;
        infoCell.appendChild(diffSpan);
    }

    // Добавляем информацию о линиях
    const linesSpan = document.createElement('span');
    linesSpan.className = `ms-2 ${getChangeColorClass(item.linesStatus)}`;
    const linesWord = 'ВЛ';
    const linesText = `на ${item.currentLines || 0} ${linesWord} ${item.voltageRange}`;
    linesSpan.textContent = linesText;

    if (item.previousLines !== null && item.previousLines !== undefined && item.linesStatus !== 'unchanged') {
        const linesDiffSign = item.linesDifference > 0 ? '+' : '';
        const linesDiffSpan = document.createElement('span');
        linesDiffSpan.className = `ms-1 ${getChangeColorClass(item.linesStatus)}`;
        linesDiffSpan.textContent = `(${linesDiffSign}${item.linesDifference})`;
        linesSpan.appendChild(linesDiffSpan);
    }

    infoCell.appendChild(linesSpan);

    // Добавляем статус для новых/удаленных
    if (item.status === 'new') {
        const badge = document.createElement('span');
        badge.className = 'badge bg-danger ms-2';
        badge.textContent = 'Новое';
        infoCell.appendChild(badge);
    } else if (item.status === 'removed') {
        const badge = document.createElement('span');
        badge.className = 'badge bg-success ms-2';
        badge.textContent = 'Устранено';
        infoCell.appendChild(badge);
    }

    row.appendChild(companyCell);
    row.appendChild(infoCell);

    return row;
}

/**
 * Создает заголовок федерального округа
 * @param {string} districtName - название округа
 * @returns {HTMLTableRowElement} строка заголовка
 */
export function createDistrictHeader(districtName) {
    const row = document.createElement('tr');
    row.className = 'table-primary';

    const cell = document.createElement('td');
    cell.colSpan = 2;
    cell.className = 'fw-bold h5 py-2';
    cell.textContent = districtName;

    row.appendChild(cell);
    return row;
}

/**
 * Создает заголовок региона
 * @param {string} regionName - название региона
 * @returns {HTMLTableRowElement} строка заголовка
 */
export function createRegionHeader(regionName) {
    const row = document.createElement('tr');
    row.className = 'table-secondary';

    const cell = document.createElement('td');
    cell.colSpan = 2;
    cell.className = 'fw-bold py-1 ps-3';
    cell.textContent = regionName;

    row.appendChild(cell);
    return row;
}

/**
 * Создает итоговую строку для региона
 * @param {Array} regionData - данные по региону
 * @param {string} regionName - название региона
 * @returns {HTMLTableRowElement} строка итогов
 */
export function createSummaryRow(regionData, regionName) {
    if (!regionData || regionData.length <= 1) {
        return null; // Не показываем итоги для одного предприятия
    }

    const row = document.createElement('tr');
    row.className = 'table-info fst-italic';

    const totalPoles = regionData.reduce((sum, item) => sum + (item.currentPoles || 0), 0);
    const totalLines = regionData.reduce((sum, item) => sum + (item.currentLines || 0), 0);

    const labelCell = document.createElement('td');
    labelCell.textContent = `Всего по ${regionName}:`;

    const totalCell = document.createElement('td');
    totalCell.textContent = `${totalPoles} ${getWordForm(totalPoles, 'опора')} на ${totalLines} ВЛ`;

    row.appendChild(labelCell);
    row.appendChild(totalCell);

    return row;
}

/**
 * Генерирует полную таблицу сравнения
 * @param {HTMLElement} container - контейнер для таблицы
 * @param {Object} comparisonData - данные сравнения
 * @param {string} type - тип данных ('flood', 'fire', 'storm')
 */
export function generateComparisonTable(container, comparisonData, type) {
    // Очищаем контейнер
    container.innerHTML = '';

    if (!comparisonData || Object.keys(comparisonData).length === 0) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-warning';
        alert.textContent = 'Нет данных для отображения';
        container.appendChild(alert);
        return;
    }

    const typeNames = {
        flood: 'подтопленные опоры',
        fire: 'природные пожары',
        storm: 'штормовые предупреждения'
    };

    // Создаем таблицу
    const table = document.createElement('table');
    table.className = 'table table-bordered table-hover table-sm';

    // Создаем заголовок таблицы
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const companyHeader = document.createElement('th');
    companyHeader.textContent = 'Предприятие';
    companyHeader.style.width = '40%';

    const dataHeader = document.createElement('th');
    dataHeader.textContent = typeNames[type] || 'Данные';
    dataHeader.style.width = '60%';

    headerRow.appendChild(companyHeader);
    headerRow.appendChild(dataHeader);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Создаем тело таблицы
    const tbody = document.createElement('tbody');

    // Сортируем федеральные округа
    const sortedDistricts = Object.keys(comparisonData).sort();

    sortedDistricts.forEach(district => {
        // Заголовок округа
        tbody.appendChild(createDistrictHeader(district));

        // Сортируем регионы
        const regions = comparisonData[district];
        const sortedRegions = Object.keys(regions).sort();

        sortedRegions.forEach(region => {
            // Заголовок региона
            tbody.appendChild(createRegionHeader(region));

            // Сортируем предприятия
            const companies = regions[region].sort((a, b) =>
                a.company.localeCompare(b.company)
            );

            // Добавляем строки предприятий
            companies.forEach(company => {
                tbody.appendChild(createTableRow(company));
            });

            // Добавляем итоговую строку для региона
            const summary = createSummaryRow(companies, region);
            if (summary) {
                tbody.appendChild(summary);
            }
        });
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

/**
 * Генерирует полный отчет с табами для разных типов данных
 * @param {HTMLElement} container - контейнер для отчета
 * @param {Object} mergedData - объединенные данные сравнения
 */
export function generateFullReport(container, mergedData) {
    container.innerHTML = '';

    // Проверяем наличие данных
    if (!mergedData || Object.keys(mergedData).length === 0) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-info';
        alert.textContent = 'Нет данных для формирования отчета';
        container.appendChild(alert);
        return;
    }

    // Создаем табы
    const tabContainer = document.createElement('div');

    // Навигация табов
    const tabNav = document.createElement('ul');
    tabNav.className = 'nav nav-tabs mb-3';
    tabNav.setAttribute('role', 'tablist');

    const tabs = [
        { id: 'flood', label: 'Подтопления', icon: '💧' },
        { id: 'fire', label: 'Пожары', icon: '🔥' },
        { id: 'storm', label: 'Штормовые', icon: '⛈️' }
    ];

    tabs.forEach((tab, index) => {
        const tabItem = document.createElement('li');
        tabItem.className = 'nav-item';
        tabItem.setAttribute('role', 'presentation');

        const tabLink = document.createElement('button');
        tabLink.className = `nav-link ${index === 0 ? 'active' : ''}`;
        tabLink.id = `${tab.id}-tab`;
        tabLink.setAttribute('data-bs-toggle', 'tab');
        tabLink.setAttribute('data-bs-target', `#${tab.id}-content`);
        tabLink.setAttribute('type', 'button');
        tabLink.setAttribute('role', 'tab');
        tabLink.textContent = `${tab.icon} ${tab.label}`;

        tabItem.appendChild(tabLink);
        tabNav.appendChild(tabItem);
    });

    tabContainer.appendChild(tabNav);

    // Содержимое табов
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';

    tabs.forEach((tab, index) => {
        const tabPane = document.createElement('div');
        tabPane.className = `tab-pane fade ${index === 0 ? 'show active' : ''}`;
        tabPane.id = `${tab.id}-content`;
        tabPane.setAttribute('role', 'tabpanel');

        // Извлекаем данные соответствующего типа
        const typeData = {};
        Object.keys(mergedData).forEach(district => {
            if (mergedData[district][tab.id] && Object.keys(mergedData[district][tab.id]).length > 0) {
                typeData[district] = mergedData[district][tab.id];
            }
        });

        // Генерируем таблицу для этого типа данных
        generateComparisonTable(tabPane, typeData, tab.id);

        tabContent.appendChild(tabPane);
    });

    tabContainer.appendChild(tabContent);
    container.appendChild(tabContainer);
}

/**
 * Создает компактную карточку-сводку
 * @param {Object} summaryData - сводные данные
 * @returns {HTMLElement} элемент карточки
 */
export function createSummaryCard(summaryData) {
    const card = document.createElement('div');
    card.className = 'card mb-3';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = 'Сводка по подтопленным опорам';

    const totalPoles = summaryData.totalPoles || 0;
    const totalLines = summaryData.totalLines || 0;
    const regionsCount = summaryData.regionsCount || 0;

    const summary = document.createElement('p');
    summary.className = 'card-text';
    summary.innerHTML = `
    <strong>Всего подтоплено:</strong> ${totalPoles} ${getWordForm(totalPoles, 'опора')}<br>
    <strong>Затронуто ЛЭП:</strong> ${totalLines}<br>
    <strong>Количество регионов:</strong> ${regionsCount}
  `;

    cardBody.appendChild(title);
    cardBody.appendChild(summary);
    card.appendChild(cardBody);

    return card;
}