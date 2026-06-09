import { INCIDENT_ICONS, REGION_TO_COLOR, REGION_CAPITALS } from '../utils/constants';
import { generateFloodSummary, generateFireSummary } from '../summary/summaryGenerator';
import { formatNumber, getWordForm, getDistrictOrder, sortDistricts, } from '../utils/textUtils';

/**
 * Генерирует HTML для печати/PDF с картой и таблицами
 */
export function generatePrintableHTML(app, currentDate, previousDate) {
    const formattedDate = formatDateTime(currentDate);

    // Получаем сводную информацию
    const floodSummary = app.currentData.flood
        ? generateFloodSummary(app.currentData.flood, app.previousData.flood, previousDate)
        : null;

    const fireSummary = app.currentData.fireSummary
        ? generateFireSummary(app.currentData.fireSummary, app.previousData.fireSummary, previousDate)
        : null;

    // Собираем штормовые предупреждения для карты
    const stormWarnings = collectStormWarnings(app.currentData.storm);

    // Генерируем HTML
    const html = `
    <div class="printable-report">
      <div class="report-header">
        <h1 class="report-title">Монитор паводковой и пожарной обстановки</h1>
        <p class="report-date">(по состоянию на ${formattedDate})</p>
      </div>
      
      <div class="report-summary">
        <h2>Итоговая суммарная информация по паводку и пожарам</h2>
        <div class="summary-content">
          ${floodSummary ? floodSummary.html : ''}
          ${fireSummary ? fireSummary.html : ''}
        </div>
      </div>
      
      <div class="report-map-container">
        <div class="map-wrapper">
          ${generateMapSVG(stormWarnings)}
        </div>
      </div>
      
      <div class="report-tables">
        ${generateAllDistrictTables(app)}
      </div>
    </div>
  `;

    return html;
}

/**
 * Форматирует дату и время для заголовка
 */
function formatDateTime(dateString) {
    if (!dateString) {
        const now = new Date();
        return `06-00 ${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;
    }

    try {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `06-00 ${day}.${month}.${year}`;
    } catch {
        return dateString;
    }
}

/**
 * Собирает штормовые предупреждения для отображения на карте
 */
function collectStormWarnings(stormData) {
    const warnings = [];

    if (!stormData) return warnings;

    Object.values(stormData).forEach(district => {
        Object.entries(district).forEach(([region, items]) => {
            const capital = REGION_CAPITALS[region];
            if (capital) {
                items.forEach(item => {
                    warnings.push({
                        region,
                        x: capital.x,
                        y: capital.y,
                        icons: item.icons || [],
                        categories: item.categories || [],
                        formattedText: item.formattedText || '',
                    });
                });
            }
        });
    });

    return warnings;
}

/**
 * Генерирует SVG карту с иконками
 */
function generateMapSVG(stormWarnings) {
    // Используем готовую SVG карту России
    return `
    <div class="map-container" style="position: relative; width: 100%; max-width: 800px; margin: 0 auto;">
      <img src="/img/russia-map.svg" alt="Карта России" style="width: 100%; height: auto;" />
      <div class="storm-icons-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
        ${stormWarnings.map(warning => `
          <div class="storm-icon-marker" 
               style="position: absolute; left: ${warning.x}%; top: ${warning.y}%; transform: translate(-50%, -50%);"
               title="${warning.region}: ${warning.formattedText}">
            ${warning.icons.map(icon =>
        `<img src="/img/icons/${icon}.svg" alt="" class="storm-map-icon" />`
    ).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Генерирует все таблицы регионов
 */
function generateAllDistrictTables(app) {
    const mergedData = app.generateReport();

    // Убираем служебные ключи
    delete mergedData._fireSummary;

    const tables = [];

    const sortedDistricts = Object.keys(mergedData)
        .filter(key => !key.startsWith('_'))
        .sort();

    sortedDistricts.forEach(district => {
        const districtData = mergedData[district];
        if (!districtData) return;

        const bgColor = REGION_TO_COLOR[district] || '#f5f5f5';
        const activeIcons = getActiveIconsForDistrict(districtData);

        let tableHTML = `
      <div class="district-table" style="margin-bottom: 20px;">
        <div class="district-title-bar" style="background-color: ${bgColor}; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold;">${district}</span>
          <span class="district-icons">
            ${activeIcons.map(icon =>
            `<img src="/img/icons/${icon}.svg" alt="" class="district-icon-small" />`
        ).join('')}
          </span>
        </div>
        <div class="district-regions">
          ${generateDistrictRegionsHTML(districtData)}
        </div>
      </div>
    `;

        tables.push(tableHTML);
    });

    return tables.join('\n');
}

/**
 * Получает активные иконки для округа
 */
function getActiveIconsForDistrict(districtData) {
    const icons = [];

    if (districtData.flood && Object.keys(districtData.flood).length > 0) {
        icons.push('flood');
    }
    if (districtData.fire && Object.keys(districtData.fire).length > 0) {
        icons.push('fire');
    }
    if (districtData.storm && Object.keys(districtData.storm).length > 0) {
        // Собираем все уникальные иконки штормов
        const stormIcons = new Set();
        Object.values(districtData.storm).forEach(items => {
            items.forEach(item => {
                if (item.icons) {
                    item.icons.forEach(icon => stormIcons.add(icon));
                }
            });
        });
        stormIcons.forEach(icon => icons.push(icon));
    }

    return icons;
}

/**
 * Генерирует HTML для регионов внутри округа
 */
function generateDistrictRegionsHTML(districtData) {
    const allRegions = new Set();

    if (districtData.flood) Object.keys(districtData.flood).forEach(r => allRegions.add(r));
    if (districtData.fire) Object.keys(districtData.fire).forEach(r => allRegions.add(r));

    const sortedRegions = Array.from(allRegions).sort();

    return sortedRegions.map(region => {
        const floodData = districtData.flood?.[region] || [];
        const fireDataArray = districtData.fire?.[region] || [];
        const fireData = fireDataArray.length > 0 ? fireDataArray[0] : null;

        return `
      <div class="region-block" style="padding: 8px 12px; border-bottom: 1px solid #eee;">
        <h5 style="margin: 0 0 4px 0; font-size: 14px;">${region}</h5>
        ${fireData ? generateFireRowHTML(fireData) : ''}
        ${floodData.map(item => generateFloodRowHTML(item)).join('')}
      </div>
    `;
    }).join('');
}

/**
 * Генерирует HTML строку для пожара
 */
function generateFireRowHTML(fireData) {
    const firesClass = (fireData.currentFires || 0) > (fireData.previousFires || 0) ? 'color-red' :
        (fireData.currentFires || 0) < (fireData.previousFires || 0) ? 'color-green' : 'color-black';
    const areaClass = (fireData.currentArea || 0) > (fireData.previousArea || 0) ? 'color-red' :
        (fireData.currentArea || 0) < (fireData.previousArea || 0) ? 'color-green' : 'color-black';

    return `
    <div class="fire-row" style="padding: 2px 0 2px 12px; border-left: 3px solid #fd7e14; margin: 4px 0; font-size: 12px;">
      <span class="${firesClass}">${formatNumber(fireData.currentFires || 0)}</span>
      (<span class="color-grey">${formatNumber(fireData.previousFires || 0)}</span>)* очага, 
      <span class="${areaClass}">${formatNumber(fireData.currentArea || 0)}</span>
      (<span class="color-grey">${formatNumber(fireData.previousArea || 0)}</span>)* га
    </div>
  `;
}

/**
 * Генерирует HTML строку для паводка
 */
function generateFloodRowHTML(item) {
    const polesWord = getWordForm(item.currentPoles || 0, 'опора');

    return `
    <div class="flood-row" style="padding: 2px 0 2px 12px; border-left: 3px solid #0d6efd; margin: 4px 0; font-size: 12px;">
      <strong>${item.company}</strong><br>
      <span class="${item.status === 'increase' || item.status === 'new' ? 'color-red' : item.status === 'decrease' ? 'color-green' : 'color-black'}">
        ${formatNumber(item.currentPoles || 0)}
      </span>
      (<span class="color-grey">${formatNumber(item.previousPoles || 0)}</span>)* ${polesWord} 
      на 
      <span class="${item.linesStatus === 'increase' || item.linesStatus === 'new' ? 'color-red' : item.linesStatus === 'decrease' ? 'color-green' : 'color-black'}">
        ${formatNumber(item.currentLines || 0)}
      </span>
      (<span class="color-grey">${formatNumber(item.previousLines || 0)}</span>)* ВЛ ${item.voltageRange}
    </div>
  `;
}

/**
 * Экспортирует HTML в PDF
 */
export async function exportToPDF(htmlElement, filename = 'monitor.pdf') {
    try {
        const { default: html2canvas } = await import('html2canvas');
        const { default: jsPDF } = await import('jspdf');

        const canvas = await html2canvas(htmlElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');

        // A4 альбомный формат: 297mm x 210mm
        const pageWidth = 297;
        const pageHeight = 210;

        // Рассчитываем размеры изображения
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;


        // Создаем PDF в альбомной ориентации
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        let heightLeft = imgHeight;
        let position = 0;

        // Добавляем первую страницу
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, Math.min(imgHeight, pageHeight));
        heightLeft -= pageHeight;

        // Добавляем дополнительные страницы если нужно
        while (heightLeft > 0) {
            position = -pageHeight; // Сдвиг для следующей страницы
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(filename);

        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}