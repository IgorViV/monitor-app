import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    generateComparisonTable,
    generateFullReport,
    createTableRow,
    createDistrictHeader,
    createRegionHeader,
    createSummaryRow
} from '../tableRenderer';

// Подготовка тестовых данных
const sampleComparisonData = {
    'Приволжский ФО': {
        'Самарская область': [
            {
                company: 'МЭС Волги (Самарское ПМЭС)',
                currentPoles: 21,
                previousPoles: 15,
                currentLines: 9,
                previousLines: 6,
                voltageRange: '220 кВ',
                difference: 6,
                status: 'increase',
                linesDifference: 3,
                linesStatus: 'increase'
            },
            {
                company: '«Волга» (Самарские РС)',
                currentPoles: 63,
                previousPoles: 56,
                currentLines: 8,
                previousLines: 7,
                voltageRange: '6-110 кВ',
                difference: 7,
                status: 'increase',
                linesDifference: 1,
                linesStatus: 'increase'
            }
        ],
        'Республика Мордовия': [
            {
                company: '«Волга» (Мордовэнерго)',
                currentPoles: 128,
                previousPoles: null,
                currentLines: 10,
                previousLines: null,
                voltageRange: '0,4-110 кВ',
                difference: 128,
                status: 'new',
                linesDifference: 10,
                linesStatus: 'new'
            }
        ],
        'Чувашская Республика': [
            {
                company: '«Волга» (Чувашэнерго)',
                currentPoles: 2,
                previousPoles: 66,
                currentLines: 1,
                previousLines: 2,
                voltageRange: '110 кВ',
                difference: -64,
                status: 'decrease',
                linesDifference: -1,
                linesStatus: 'decrease'
            }
        ]
    }
};

describe('createTableRow', () => {
    it('should create table row with correct structure', () => {
        const item = sampleComparisonData['Приволжский ФО']['Самарская область'][0];
        const row = createTableRow(item);

        expect(row).toBeInstanceOf(HTMLTableRowElement);
        expect(row.children.length).toBe(2);

        // Проверяем компанию
        expect(row.children[0].textContent).toContain('МЭС Волги');

        // Проверяем наличие данных об опорах
        expect(row.children[1].textContent).toContain('21');
        expect(row.children[1].textContent).toContain('опора');
    });

    it('should apply correct CSS classes for status', () => {
        const increaseItem = sampleComparisonData['Приволжский ФО']['Самарская область'][0];
        const row = createTableRow(increaseItem);

        // Проверяем класс для увеличения
        const polesCell = row.children[1];
        expect(polesCell.innerHTML).toContain('text-danger');
    });

    it('should handle new items', () => {
        const newItem = sampleComparisonData['Приволжский ФО']['Республика Мордовия'][0];
        const row = createTableRow(newItem);

        expect(row.children[1].textContent).toContain('128 опор');
        expect(row.children[1].innerHTML).toContain('text-danger');
    });

    it('should handle decreased items', () => {
        const decreaseItem = sampleComparisonData['Приволжский ФО']['Чувашская Республика'][0];
        const row = createTableRow(decreaseItem);

        expect(row.children[1].textContent).toContain('2 опоры');
        expect(row.children[1].innerHTML).toContain('text-success');
    });
});

describe('createDistrictHeader', () => {
    it('should create district header row', () => {
        const header = createDistrictHeader('Приволжский ФО');

        expect(header).toBeInstanceOf(HTMLTableRowElement);
        expect(header.classList.contains('table-primary')).toBe(true);

        const cell = header.querySelector('td');
        expect(cell).not.toBeNull();
        expect(cell.colSpan).toBe(2);
        expect(cell.textContent).toContain('Приволжский ФО');
        expect(cell.className).toContain('fw-bold');
        expect(cell.className).toContain('h5');
        expect(cell.className).toContain('py-2');
    });
});

describe('createRegionHeader', () => {
    it('should create region header row', () => {
        const header = createRegionHeader('Самарская область');

        expect(header).toBeInstanceOf(HTMLTableRowElement);
        expect(header.classList.contains('table-secondary')).toBe(true);

        const cell = header.querySelector('td');
        expect(cell).not.toBeNull();
        expect(cell.colSpan).toBe(2);
        expect(cell.textContent).toContain('Самарская область');
        expect(cell.className).toContain('fw-bold');
        expect(cell.className).toContain('py-1');
        expect(cell.className).toContain('ps-3');
    });
});

describe('createSummaryRow', () => {
    it('should create summary row with totals', () => {
        const regionData = sampleComparisonData['Приволжский ФО']['Самарская область'];
        const summary = createSummaryRow(regionData, 'Самарская область');

        expect(summary).toBeInstanceOf(HTMLTableRowElement);
        expect(summary.classList.contains('table-info')).toBe(true);
        expect(summary.textContent).toContain('Всего');
        expect(summary.textContent).toContain('84'); // 21 + 63
    });
});

describe('generateComparisonTable', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should generate complete table structure', () => {
        generateComparisonTable(container, sampleComparisonData, 'flood');

        const table = container.querySelector('table');
        expect(table).not.toBeNull();
        expect(table.classList.contains('table')).toBe(true);
        expect(table.classList.contains('table-bordered')).toBe(true);

        // Проверяем заголовки
        const headers = table.querySelectorAll('th');
        expect(headers.length).toBe(2);
        expect(headers[0].textContent).toContain('Предприятие');
        expect(headers[1].textContent).toContain('подтопленные опоры');

        // Проверяем наличие федерального округа
        expect(table.textContent).toContain('Приволжский ФО');

        // Проверяем наличие регионов
        expect(table.textContent).toContain('Самарская область');
        expect(table.textContent).toContain('Республика Мордовия');
        expect(table.textContent).toContain('Чувашская Республика');

        // Проверяем наличие предприятий
        expect(table.textContent).toContain('МЭС Волги (Самарское ПМЭС)');
        expect(table.textContent).toContain('«Волга» (Самарские РС)');
        expect(table.textContent).toContain('«Волга» (Мордовэнерго)');
        expect(table.textContent).toContain('«Волга» (Чувашэнерго)');
    });

    it('should generate correct summary statistics', () => {
        generateComparisonTable(container, sampleComparisonData, 'flood');

        // Проверяем итоговую строку для Самарской области
        const table = container.querySelector('table');
        const rows = table.querySelectorAll('tr');

        const summaryRow = Array.from(rows).find(row =>
            row.classList.contains('table-info') && row.textContent.includes('Самарская область')
        );

        expect(summaryRow).not.toBeNull();
        expect(summaryRow.textContent).toContain('84 опоры'); // 21 + 63
        expect(summaryRow.textContent).toContain('17 ВЛ'); // 9 + 8
    });

    it('should handle empty data', () => {
        generateComparisonTable(container, {}, 'flood');

        const table = container.querySelector('table');
        expect(table).toBeNull();

        const emptyMessage = container.querySelector('.alert');
        expect(emptyMessage).not.toBeNull();
        expect(emptyMessage.textContent).toContain('Нет данных для отображения');
    });
});

describe('generateFullReport', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should generate tabs for different report types', () => {
        const mergedData = {
            'Приволжский ФО': {
                flood: sampleComparisonData['Приволжский ФО'],
                fire: {},
                storm: {}
            }
        };

        generateFullReport(container, mergedData);

        // Проверяем наличие табов
        const tabList = container.querySelector('.nav-tabs');
        expect(tabList).not.toBeNull();

        const tabs = tabList.querySelectorAll('li');
        expect(tabs.length).toBe(3);

        // Проверяем названия табов
        expect(tabs[0].textContent).toContain('Подтопления');
        expect(tabs[1].textContent).toContain('Пожары');
        expect(tabs[2].textContent).toContain('Штормовые');
    });
});