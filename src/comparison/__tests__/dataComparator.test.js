// src/comparison/__tests__/dataComparator.test.js
import { describe, it, expect } from 'vitest';
import {
    compareData,
    calculateDifference,
    getChangeStatus,
    compareRegions,
    mergeComparisonResults
} from '../dataComparator';

// Тестовые данные
const currentData = {
    'Приволжский ФО': {
        'Самарская область': [
            {
                company: 'МЭС Волги (Самарское ПМЭС)',
                totalPoles: 21,
                totalLines: 9,
                voltageRange: '220 кВ'
            },
            {
                company: '«Волга» (Самарские РС)',
                totalPoles: 63,
                totalLines: 8,
                voltageRange: '6-110 кВ'
            }
        ],
        'Республика Мордовия': [
            {
                company: '«Волга» (Мордовэнерго)',
                totalPoles: 128,
                totalLines: 10,
                voltageRange: '0,4-110 кВ'
            }
        ],
        'Чувашская Республика': [
            {
                company: '«Волга» (Чувашэнерго)',
                totalPoles: 2,
                totalLines: 1,
                voltageRange: '110 кВ'
            }
        ]
    },
    'Южный ФО': {
        'Волгоградская область': [
            {
                company: 'МЭС Юга (Волго-Донское ПМЭС)',
                totalPoles: 16,
                totalLines: 4,
                voltageRange: '220-500 кВ'
            }
        ]
    }
};

const previousData = {
    'Приволжский ФО': {
        'Самарская область': [
            {
                company: 'МЭС Волги (Самарское ПМЭС)',
                totalPoles: 15,
                totalLines: 6,
                voltageRange: '220 кВ'
            },
            {
                company: '«Волга» (Самарские РС)',
                totalPoles: 56,
                totalLines: 7,
                voltageRange: '6-110 кВ'
            }
        ],
        'Чувашская Республика': [
            {
                company: '«Волга» (Чувашэнерго)',
                totalPoles: 66,
                totalLines: 2,
                voltageRange: '0,4-110 кВ'
            }
        ]
    }
};

describe('calculateDifference', () => {
    it('should calculate positive difference', () => {
        expect(calculateDifference(21, 15)).toBe(6);
    });

    it('should calculate negative difference', () => {
        expect(calculateDifference(2, 66)).toBe(-64);
    });

    it('should calculate zero difference for missing data', () => {
        expect(calculateDifference(128, null)).toBe(128);
        expect(calculateDifference(null, 100)).toBe(-100);
    });

    it('should return 0 for equal values', () => {
        expect(calculateDifference(50, 50)).toBe(0);
    });
});

describe('getChangeStatus', () => {
    it('should return "increase" for positive difference', () => {
        expect(getChangeStatus(6)).toBe('increase');
    });

    it('should return "decrease" for negative difference', () => {
        expect(getChangeStatus(-64)).toBe('decrease');
    });

    it('should return "unchanged" for zero difference', () => {
        expect(getChangeStatus(0)).toBe('unchanged');
    });

    it('should return "new" for new entries', () => {
        expect(getChangeStatus(128, true)).toBe('new');
    });

    it('should return "removed" for removed entries', () => {
        expect(getChangeStatus(-100, false, true)).toBe('removed');
    });
});

describe('compareData', () => {
    it('should compare current and previous data correctly', () => {
        const result = compareData(currentData, previousData);

        // Проверяем структуру результата
        expect(result).toHaveProperty('Приволжский ФО');
        expect(result).toHaveProperty('Южный ФО');

        // Проверяем увеличение
        const samaraItem = result['Приволжский ФО']['Самарская область'][0];
        expect(samaraItem.currentPoles).toBe(21);
        expect(samaraItem.previousPoles).toBe(15);
        expect(samaraItem.difference).toBe(6);
        expect(samaraItem.status).toBe('increase');

        // Проверяем уменьшение
        const chuvashiaItem = result['Приволжский ФО']['Чувашская Республика'][0];
        expect(chuvashiaItem.currentPoles).toBe(2);
        expect(chuvashiaItem.previousPoles).toBe(66);
        expect(chuvashiaItem.difference).toBe(-64);
        expect(chuvashiaItem.status).toBe('decrease');

        // Проверяем новую запись
        const mordoviaItem = result['Приволжский ФО']['Республика Мордовия'][0];
        expect(mordoviaItem.currentPoles).toBe(128);
        expect(mordoviaItem.previousPoles).toBeNull();
        expect(mordoviaItem.status).toBe('new');
    });

    it('should handle missing regions in previous data', () => {
        const result = compareData(currentData, previousData);
        const volgogradItem = result['Южный ФО']['Волгоградская область'][0];
        expect(volgogradItem.currentPoles).toBe(16);
        expect(volgogradItem.previousPoles).toBeNull();
        expect(volgogradItem.status).toBe('new');
    });
});

describe('mergeComparisonResults', () => {
    it('should merge flood, fire and storm data', () => {
        const floodComparison = compareData(currentData, previousData);
        const fireComparison = {}; // Здесь будут данные по пожарам
        const stormComparison = {}; // Здесь будут данные по штормам

        const merged = mergeComparisonResults(
            floodComparison,
            fireComparison,
            stormComparison
        );

        // Проверяем структуру объединенных данных
        expect(merged).toHaveProperty('Приволжский ФО');
        expect(merged['Приволжский ФО']).toHaveProperty('flood');
        expect(merged['Приволжский ФО']).toHaveProperty('fire');
        expect(merged['Приволжский ФО']).toHaveProperty('storm');
    });
});