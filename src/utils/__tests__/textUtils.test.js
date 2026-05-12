import { describe, it, expect } from 'vitest';
import { getWordForm, formatNumber, getFederalDistrict } from '../textUtils.js';

describe('getWordForm', () => {
    const testCases = [
        // опора
        { number: 1, word: 'опора', expected: 'опора' },
        { number: 2, word: 'опора', expected: 'опоры' },
        { number: 5, word: 'опора', expected: 'опор' },
        { number: 21, word: 'опора', expected: 'опора' },
        { number: 103, word: 'опора', expected: 'опоры' },
        { number: 408, word: 'опора', expected: 'опор' },
        // ЛЭП
        { number: 1, word: 'ЛЭП', expected: 'ЛЭП' },
        { number: 3, word: 'ЛЭП', expected: 'ЛЭП' },
        { number: 8, word: 'ЛЭП', expected: 'ЛЭП' },
        // ВЛ
        { number: 1, word: 'ВЛ', expected: 'ВЛ' },
        { number: 5, word: 'ВЛ', expected: 'ВЛ' },
        // очаг
        { number: 1, word: 'очаг', expected: 'очаг' },
        { number: 2, word: 'очаг', expected: 'очага' },
        { number: 5, word: 'очаг', expected: 'очагов' },
        { number: 21, word: 'очаг', expected: 'очаг' },
        { number: 103, word: 'очаг', expected: 'очага' },
        { number: 408, word: 'очаг', expected: 'очагов' },
    ];

    testCases.forEach(({ number, word, expected }) => {
        it(`should return "${expected}" for ${number} ${word}`, () => {
            expect(getWordForm(number, word)).toBe(expected);
        });
    });
});

describe('formatNumber', () => {
    it('should format number with spaces as thousands separator', () => {
        expect(formatNumber(1035)).toBe('1\u00A0035');
        expect(formatNumber(454)).toBe('454');
        expect(formatNumber(1000000)).toBe('1\u00A0000\u00A0000');
    });
});

describe('getFederalDistrict', () => {
    const testCases = [
        {region: 'Московская область', district: 'Центральный ФО'},
        {region: 'Москва', district: 'Центральный ФО'},
        {region: 'Республика Марий Эл', district: 'Приволжский ФО'},
    ]

    testCases.forEach(({region, district}) => {
        it(`should return "${district}" for ${region}`, () => {
            expect(getFederalDistrict(region)).toBe(district);
        });
    });
})