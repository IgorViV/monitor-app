import { describe, it, expect } from 'vitest';
import { parseStormData, parseStormLine, detectWeatherPhenomena, formatCategories } from '../stormParser';

describe('Storm Parser', () => {
    const sampleInput = `22 апреля в Свердловской области сильный снег, сильный гололед, сильное отложение мокрого снега;
22 апреля в Краснодарском крае сильный дождь, в предгорных районах сильный дождь со снегом, ливень, гроза, град, ветер до 20 м/с, на реках черноморского побережья ожидаются подъемы уровней воды до неблагоприятных отметок и выше;
22 апреля в Ростовской области ливень, гроза, град, ветер 20-23 м/с;
22 апреля на севере Мурманской области ветер до 25-27 м/с.`;

    it('should parse Sverdlovsk region correctly', () => {
        const result = parseStormData(sampleInput);
        const sverdlovsk = result.rawWarnings.find(w => w.region === 'Свердловская область');

        expect(sverdlovsk).toBeTruthy();
        expect(sverdlovsk.categories).toContain('сильные осадки');
        expect(sverdlovsk.categories).toContain('гололед');
        expect(formatCategories(sverdlovsk.categories)).toBe('сильные осадки, гололед');
    });

    it('should parse Krasnodar region correctly', () => {
        const result = parseStormData(sampleInput);
        const krasnodar = result.rawWarnings.find(w => w.region === 'Краснодарский край');

        expect(krasnodar).toBeTruthy();
        expect(krasnodar.categories).toContain('сильные осадки с грозой');
        expect(krasnodar.categories).toContain('сильный ветер');
        expect(krasnodar.categories).toContain('град');
    });

    it('should parse Rostov region correctly', () => {
        const result = parseStormData(sampleInput);
        const rostov = result.rawWarnings.find(w => w.region === 'Ростовская область');

        expect(rostov).toBeTruthy();
        expect(rostov.categories).toContain('сильные осадки с грозой');
        expect(rostov.categories).toContain('сильный ветер');
        expect(rostov.categories).toContain('град');
    });

    it('should parse Murmansk region correctly', () => {
        const result = parseStormData(sampleInput);
        const murmansk = result.rawWarnings.find(w => w.region === 'Мурманская область');

        expect(murmansk).toBeTruthy();
        expect(murmansk.categories).toContain('сильный ветер');
    });

    it('should format console output correctly', () => {
        const result = parseStormData(sampleInput);

        // Проверяем форматированный вывод
        const sverdlovsk = result.rawWarnings.find(w => w.region === 'Свердловская область');
        expect(formatCategories(sverdlovsk.categories)).toBe('сильные осадки, гололед');

        const krasnodar = result.rawWarnings.find(w => w.region === 'Краснодарский край');
        expect(formatCategories(krasnodar.categories)).toContain('сильные осадки с грозой');
        expect(formatCategories(krasnodar.categories)).toContain('сильный ветер');
    });
});