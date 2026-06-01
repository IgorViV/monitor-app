import { describe, it, expect } from 'vitest';
import { parseFireData, parseFireSummaryLine } from '../fireParser';

describe('Fire Parser', () => {
    const sampleInput = `На территории России зафиксированы 8 (27 ) очагов пожаров на общей площади 73 075 (63 566) га, из них в Еврейской АО 2 очага площадью 63 050 га, в Хабаровском крае 4 очага площадью 3 709 га.`;

    const sampleInputBig = 'На территории России зафиксированы 48 (68 ) очагов пожаров на общей площади 164 230 (230 238) га, из них в Амурской области 4 очага площадью 142 507 га, в Хабаровском крае 24 очага площадью 18 305 га, в Якутии 7 очагов площадью 1 185 га.'

    it('should parse fire summary correctly', () => {
        const summary = parseFireSummaryLine('На территории России зафиксированы 8 (27 ) очагов пожаров на общей площади 73 075 (63 566) га');

        expect(summary).toBeTruthy();
        expect(summary.currentFires).toBe(8);
        // expect(summary.previousFires).toBe(0);
        expect(summary.currentArea).toBe(73075);
        // expect(summary.previousArea).toBe(0);
    });

    it('should parse full fire data with regions', () => {
        const result = parseFireData(sampleInput);

        expect(result).toBeTruthy();
        expect(result.summary.currentFires).toBe(8);
        // expect(result.summary.previousFires).toBe(0);

        // Проверяем регионы
        expect(result.rawRegions).toHaveLength(2);

        const eaRegion = result.rawRegions.find(r => r.region.includes('Еврей'));
        expect(eaRegion).toBeTruthy();
        expect(eaRegion.fires).toBe(2);
        expect(eaRegion.area).toBe(63050);

        const khabarovsk = result.rawRegions.find(r => r.region.includes('Хабаров'));
        expect(khabarovsk).toBeTruthy();
        expect(khabarovsk.fires).toBe(4);
        expect(khabarovsk.area).toBe(3709);
    });

    it('should group regions by federal district', () => {
        const result = parseFireData(sampleInput);

        expect(result.regions).toHaveProperty('Дальневосточный ФО');
        expect(result.regions['Дальневосточный ФО']).toHaveProperty('Еврейская автономная область');
        expect(result.regions['Дальневосточный ФО']).toHaveProperty('Хабаровский край');
    });

    it('should handle empty input', () => {
        expect(parseFireData('')).toBeNull();
        expect(parseFireData(null)).toBeNull();
    });

    // it('should parse input without area', () => {
    //     const input = 'На территории России зафиксированы 5 (3) очагов пожаров, из них в Амурской области 5 очагов площадью 100 га';
    //     const result = parseFireData(input);
    //
    //     expect(result.summary.currentFires).toBe(5);
    //     // expect(result.summary.previousFires).toBe(0);
    //     expect(result.rawRegions).toHaveLength(1);
    // });
});
