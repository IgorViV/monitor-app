// src/renderer/__tests__/tableRenderer.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    createDistrictHeader,
    createRegionSection,
    createFilialSection,
    generateFullReport
} from '../tableRenderer';

describe('New Table Renderer', () => {
    const sampleMergedData = {
        'Южный ФО': {
            flood: {
                'Волгоградская область': [
                    {
                        company: 'МЭС Юга (Волго-Донское ПМЭС)',
                        currentPoles: 121,
                        previousPoles: 16,
                        currentLines: 4,
                        previousLines: 4,
                        voltageRange: '220-500 кВ',
                        status: 'increase',
                        linesStatus: 'unchanged',
                    },
                    {
                        company: '«Юга» (Волгоградэнерго)',
                        currentPoles: 1030,
                        previousPoles: 51,
                        currentLines: 25,
                        previousLines: 11,
                        voltageRange: '10-110 кВ',
                        status: 'increase',
                        linesStatus: 'increase',
                    }
                ],
                'Астраханская область': [
                    {
                        company: '«Юга» (Астраханьэнерго)',
                        currentPoles: 1030,
                        previousPoles: null,
                        currentLines: 25,
                        previousLines: null,
                        voltageRange: '10-110 кВ',
                        status: 'new',
                        linesStatus: 'new',
                    }
                ]
            },
            fire: {},
            storm: {},
        }
    };

    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should create district header with correct background color', () => {
        const districtData = sampleMergedData['Южный ФО'];
        const header = createDistrictHeader('Южный ФО', districtData);

        expect(header.classList.contains('district-content')).toBe(true);

        const title = header.querySelector('.district-title');
        expect(title.style.backgroundColor).toBe('rgb(255, 255, 153)'); // #ffff99

        const titleSpan = title.querySelector('span');
        expect(titleSpan.textContent).toBe('Южный ФО');
    });

    it('should show only active icons', () => {
        const districtData = sampleMergedData['Южный ФО'];
        const header = createDistrictHeader('Южный ФО', districtData);

        const icons = header.querySelectorAll('.district-icon');
        const visibleIcons = header.querySelectorAll('.district-icon:not(.visually-hidden)');

        expect(icons.length).toBeGreaterThan(0);
        expect(visibleIcons.length).toBe(1); // Только flood активен
        expect(visibleIcons[0].alt).toBe('Паводок');
    });

    it('should create filial section with color coding', () => {
        const item = sampleMergedData['Южный ФО'].flood['Волгоградская область'][0];
        const filial = createFilialSection(item);

        expect(filial.classList.contains('region-filial')).toBe(true);

        const paragraphs = filial.querySelectorAll('p');
        expect(paragraphs[0].textContent).toContain('МЭС Юга');

        // Проверяем цветовые классы
        const redSpans = filial.querySelectorAll('.color-red');
        expect(redSpans.length).toBeGreaterThan(0);
        expect(redSpans[0].textContent).toBe('121');

        const greySpans = filial.querySelectorAll('.color-grey');
        expect(greySpans.length).toBeGreaterThan(0);
        expect(greySpans[0].textContent).toBe('16');
    });

    it('should create region section with all filials', () => {
        const regionData = sampleMergedData['Южный ФО'].flood['Волгоградская область'];
        const region = createRegionSection('Волгоградская область', regionData);

        expect(region.classList.contains('district-region')).toBe(true);

        const title = region.querySelector('.region-title');
        expect(title.textContent).toBe('Волгоградская область');

        const filials = region.querySelectorAll('.region-filial');
        expect(filials.length).toBe(2);
    });

    it('should generate full report with multiple districts', () => {
        generateFullReport(container, sampleMergedData);

        const districts = container.querySelectorAll('.district-content');
        expect(districts.length).toBe(1);

        const regions = container.querySelectorAll('.district-region');
        expect(regions.length).toBe(2);
    });

    it('should handle empty data', () => {
        generateFullReport(container, {});

        const alert = container.querySelector('.alert');
        expect(alert).not.toBeNull();
        expect(alert.textContent).toContain('Нет данных');
    });
});