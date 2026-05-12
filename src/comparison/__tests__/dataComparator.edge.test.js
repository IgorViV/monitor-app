import { describe, it, expect } from 'vitest';
import { compareData, sortRegions } from '../dataComparator.js';

describe('Edge cases for dataComparator', () => {
    it('should handle empty current data', () => {
        const result = compareData({}, {});
        expect(result).toEqual({});
    });

    it('should handle null previous data', () => {
        const currentData = {
            'Центральный ФО': {
                'Московская область': [
                    {
                        company: 'Московский регион',
                        totalPoles: 10,
                        totalLines: 2,
                        voltageRange: '110 кВ'
                    }
                ]
            }
        };

        const result = compareData(currentData, {});
        expect(result['Центральный ФО']['Московская область'][0].status).toBe('new');
    });

    it('should correctly sort regions within districts', () => {
        const unsorted = {
            'Приволжский ФО': {
                'Нижегородская область': [],
                'Самарская область': [],
                'Республика Мордовия': []
            }
        };

        const sorted = sortRegions(unsorted);
        const regions = Object.keys(sorted['Приволжский ФО']);
        expect(regions).toEqual([
            'Нижегородская область',
            'Республика Мордовия',
            'Самарская область'
        ]);
    });

    it('should handle same values with zero difference', () => {
        const currentData = {
            'Южный ФО': {
                'Краснодарский край': [
                    {
                        company: 'Кубаньэнерго',
                        totalPoles: 50,
                        totalLines: 3,
                        voltageRange: '35 кВ'
                    }
                ]
            }
        };

        const previousData = JSON.parse(JSON.stringify(currentData));

        const result = compareData(currentData, previousData);
        const item = result['Южный ФО']['Краснодарский край'][0];

        expect(item.status).toBe('unchanged');
        expect(item.difference).toBe(0);
    });
});