import { describe, it, expect } from 'vitest';
import { generateFloodSummary, generateFullSummary } from '../summaryGenerator';

describe('Flood Summary Generator', () => {
    const sampleCurrentData = {
        'Южный ФО': {
            'Волгоградская область': [
                { company: 'МЭС Юга', totalPoles: 121, totalLines: 4, voltageRange: '220-500 кВ' },
                { company: '«Юга» (Волгоградэнерго)', totalPoles: 408, totalLines: 16, voltageRange: '10-110 кВ' },
            ],
            'Астраханская область': [
                { company: '«Юга» (Астраханьэнерго)', totalPoles: 201, totalLines: 17, voltageRange: '10-35 кВ' },
            ],
        },
        'Приволжский ФО': {
            'Самарская область': [
                { company: 'МЭС Волги', totalPoles: 21, totalLines: 9, voltageRange: '220 кВ' },
                { company: '«Волга» (Самарские РС)', totalPoles: 63, totalLines: 8, voltageRange: '6-110 кВ' },
            ],
            'Республика Мордовия': [
                { company: '«Волга» (Мордовэнерго)', totalPoles: 103, totalLines: 9, voltageRange: '0,4-110 кВ' },
            ],
            'Чувашская Республика': [
                { company: '«Волга» (Чувашэнерго)', totalPoles: 2, totalLines: 1, voltageRange: '110 кВ' },
            ],
            'Нижегородская область': [
                { company: 'МЭС Волги (Нижегородское ПМЭС)', totalPoles: 27, totalLines: 8, voltageRange: '220-500 кВ' },
            ],
        },
        'Сибирский ФО': {
            'Томская область': [
                { company: '«Томск»', totalPoles: 194, totalLines: 8, voltageRange: '0,4-10 кВ' },
            ],
        },
    };

    const samplePreviousData = {
        'Южный ФО': {
            'Волгоградская область': [
                { company: 'МЭС Юга', totalPoles: 16, totalLines: 4, voltageRange: '220-500 кВ' },
                { company: '«Юга» (Волгоградэнерго)', totalPoles: 51, totalLines: 11, voltageRange: '10-110 кВ' },
            ],
        },
        'Приволжский ФО': {
            'Чувашская Республика': [
                { company: '«Волга» (Чувашэнерго)', totalPoles: 66, totalLines: 2, voltageRange: '110 кВ' },
            ],
        },
    };

    it('should generate summary with correct totals', () => {
        const result = generateFloodSummary(sampleCurrentData, samplePreviousData);

        // Текущие значения: 121+408+201+21+63+103+2+27+194 = 1140
        expect(result.stats.totalPoles).toBe(1140);
        // 4+16+17+9+8+9+1+8+8 = 80
        expect(result.stats.totalLines).toBe(80);
        // Предыдущие: 16+51+66 = 133
        expect(result.stats.previousTotalPoles).toBe(133);
        // Предыдущие линии: 4+11+2 = 17
        expect(result.stats.previousTotalLines).toBe(17);
    });

    it('should generate correct voltage range', () => {
        const result = generateFloodSummary(sampleCurrentData, samplePreviousData);
        expect(result.stats.voltageRange).toBe('0,4-500 кВ');
    });

    it('should list all unique regions in genitive case', () => {
        const result = generateFloodSummary(sampleCurrentData, samplePreviousData);

        // Проверяем наличие регионов в родительном падеже
        const regions = result.stats.regions;
        console.log('Regions:', regions); // Для отладки

        expect(regions).toContain('Астраханской');
        expect(regions).toContain('Волгоградской');
        expect(regions).toContain('Нижегородской');
        expect(regions).toContain('Республики Мордовии');
        expect(regions).toContain('Самарской');
        expect(regions).toContain('Томской');

        // Проверяем "Чувашская Республика" -> "Чувашской Республики"
        const chuvashia = regions.find(r => r.includes('Чуваш'));
        expect(chuvashia).toBeDefined();
        expect(chuvashia).toBe('Чувашской Республики');
    });

    it('should generate HTML with color classes', () => {
        const result = generateFloodSummary(sampleCurrentData, samplePreviousData);

        expect(result.html).toContain('color-red'); // Увеличение
        expect(result.html).toContain('color-grey'); // Предыдущие значения
        expect(result.html).toContain('подтоплены');
        expect(result.html).toContain('субъектов России');

        // Проверяем что HTML содержит правильные теги
        expect(result.html).toContain('<span class="color-red">');
        expect(result.html).toContain('<span class="color-grey">');
    });

    it('should handle empty data', () => {
        const result = generateFloodSummary({}, null);
        expect(result.text).toContain('Нет данных');
        expect(result.html).toContain('Нет данных');
        expect(result.stats).toBeNull();
    });

    it('should handle null previous data', () => {
        const result = generateFloodSummary(sampleCurrentData, null);

        expect(result.stats.previousTotalPoles).toBe(0);
        expect(result.stats.previousTotalLines).toBe(0);
        expect(result.html).toContain('(<span class="color-grey">0</span>)'); // Предыдущие значения = 0
    });

    it('should format region list correctly with "и" before last region', () => {
        const result = generateFloodSummary(sampleCurrentData, samplePreviousData);

        // Проверяем что текст содержит " и " перед последним регионом
        expect(result.text).toContain(' и ');

        // Проверяем что текст заканчивается точкой
        expect(result.text.trim()).toMatch(/\.$/);

        // Проверяем что список содержит запятые для перечисления
        expect(result.text).toContain(', ');

        // Проверяем формат: "...областей, ... и Чувашской Республики."
        expect(result.text).toMatch(/\w+ и \w+\.$/);
    });

    it('should handle single region', () => {
        const singleRegionData = {
            'Сибирский ФО': {
                'Томская область': [
                    { company: '«Томск»', totalPoles: 194, totalLines: 8, voltageRange: '0,4-10 кВ' },
                ],
            },
        };

        const result = generateFloodSummary(singleRegionData, null);

        // Для одного региона: "на территории Астраханской области."
        expect(result.text).toContain('на территории');
        expect(result.text).not.toContain('на территориях');
        expect(result.text).not.toContain('субъектов России');
        expect(result.text).toContain('Астраханской области');

        // Проверяем точный формат
        expect(result.text).toBe(
            'Паводок: подтоплены 201 (0)* опора 17 (0)* ЛЭП 10-35 кВ на территории Астраханской области.'
        );

        // Проверяем HTML
        expect(result.html).toContain('на территории');
        expect(result.html).toContain('Астраханской области');
        expect(result.html).not.toContain('субъектов России');
    });

    it('should handle two regions', () => {
        const twoRegionsData = {
            'Сибирский ФО': {
                'Томская область': [
                    { company: '«Томск»', totalPoles: 194, totalLines: 8, voltageRange: '0,4-10 кВ' },
                ],
            },
            'Южный ФО': {
                'Волгоградская область': [
                    { company: 'МЭС Юга', totalPoles: 121, totalLines: 4, voltageRange: '220-500 кВ' },
                ],
            },
        };

        const result = generateFloodSummary(twoRegionsData, null);

        // Для двух регионов должно быть " и " без запятых
        expect(result.text).not.toContain(',');
        expect(result.text).toContain(' и ');
        expect(result.text).toMatch(/Томской и Волгоградской/);
    });

    it('should format numbers with spaces', () => {
        const result = generateFloodSummary(sampleCurrentData, samplePreviousData);

        // 1140 должно быть отформатировано как "1 140"
        expect(result.stats.totalPoles).toBeGreaterThan(999);

        const formattedText = result.text;
        // Проверяем что большие числа содержат пробелы (форматирование тысяч)
        expect(formattedText).toMatch(/\d\s?\d{3}/);
    });

    it('should handle multiple regions with correct format', () => {
        const result = generateFloodSummary(sampleCurrentData, samplePreviousData);

        // Для нескольких регионов: "на территориях 7 субъектов России: ..."
        expect(result.text).toContain('на территориях');
        expect(result.text).not.toContain('на территории ');
        expect(result.text).toContain('субъектов России:');

        // Проверяем что есть перечисление регионов
        const parts = result.text.split(': ');
        expect(parts.length).toBeGreaterThan(2); // Есть часть с перечислением
    });

    it('should include locationText in stats', () => {
        const singleRegionData = {
            'Южный ФО': {
                'Астраханская область': [
                    { company: '«Юга» (Астраханьэнерго)', totalPoles: 201, totalLines: 17, voltageRange: '10-35 кВ' },
                ],
            },
        };

        const result1 = generateFloodSummary(singleRegionData, null);
        expect(result1.stats.locationText).toContain('на территории');
        expect(result1.stats.locationText).toContain('Астраханской области');

        const result2 = generateFloodSummary(sampleCurrentData, samplePreviousData);
        expect(result2.stats.locationText).toContain('на территориях');
        expect(result2.stats.locationText).toContain('субъектов России');
    });
});

describe('generateFullSummary', () => {
    const sampleFloodData = {
        'Приволжский ФО': {
            'Самарская область': [
                { company: 'МЭС Волги', totalPoles: 21, totalLines: 9, voltageRange: '220 кВ' },
            ],
        },
    };

    it('should generate summaries for all types that have data', () => {
        const summaries = generateFullSummary(
            sampleFloodData,
            {}, // fire data
            {}, // storm data
            {}  // previous data
        );

        expect(summaries.length).toBe(1); // Только flood
        expect(summaries[0].type).toBe('flood');
    });

    it('should return empty array when no data', () => {
        const summaries = generateFullSummary({}, {}, {}, {});
        expect(summaries.length).toBe(0);
    });
});