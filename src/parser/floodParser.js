import { parseNumber, getFederalDistrict, normalizeText, parseLine, PATTERNS } from '../utils/textUtils.js';

/**
 * Парсит одну строку с информацией о подтоплении
 *
 * @param {string} line Одна строка с информацией
 * @return {Object} Результат парсинга
 */
export function parseFloodLine(line) {
    line = line.replace('', '').trim().replace(/[;.]$/, '');

    const lineMatch = parseLine(line);
    if (!lineMatch) {
        throw new Error(`Cannot parse line: ${line}`);
    }

    const region = lineMatch.area;
    const company = lineMatch.org;
    const details = lineMatch.data;

    const breakdownParts = details.split(/,\s*из них\s*/);

    if (breakdownParts.length === 1) {
        const mainMatch = breakdownParts[0].match(/(\d+)\s+(опор[аы]?)\s+(\d+)\s+(ЛЭП|ВЛ)\s+(.+?)(?:\s*\(|$)/);
        if (mainMatch) {
            return {
                company,
                region,
                totalPoles: parseNumber(mainMatch[1]),
                totalLines: parseNumber(mainMatch[3]),
                voltageRange: mainMatch[5].trim(),
                breakdown: []
            };
        }
    } else {
        const totalMatch = breakdownParts[0].match(/(\d+)\s+опор[аы]?/);
        const totalPoles = totalMatch ? parseNumber(totalMatch[1]) : 0;

        const breakdownItems = [];
        const detailParts = breakdownParts[1].split(/,\s*(?=\d+\s+опор)/);

        let totalLines = 0;
        let minVoltage = Infinity;
        let maxVoltage = 0;
        let voltageUnit = 'кВ';

        detailParts.forEach(part => {
            const match = part.match(/(\d+)\s+опор[аы]?\s+(\d+)\s+(ЛЭП|ВЛ)\s+(.+?)(?:\s*\(| кВ,|$)/);
            if (match) {
                const poles = parseNumber(match[1]);
                const lines = parseNumber(match[2]);
                const voltage = match[4].trim();

                totalLines += lines;

                const voltageMatch = voltage.match(/(\d+[,.]?\d*)\s*(кВ)?/);

                if (voltageMatch) {
                    const voltageValue = parseFloat(voltageMatch[1].replace(',', '.'));
                    minVoltage = Math.min(minVoltage, voltageValue);
                    maxVoltage = Math.max(maxVoltage, voltageValue);
                    if (voltageMatch[2]) voltageUnit = voltageMatch[2];
                }

                breakdownItems.push({
                    poles,
                    lines,
                    voltage,
                });
            }
        });

        const voltageRange = minVoltage === maxVoltage
            ? `${maxVoltage} ${voltageUnit}`
            : `${minVoltage.toString().replace('.', ',')}-${maxVoltage} ${voltageUnit}`;

        return {
            company,
            region,
            totalPoles,
            totalLines,
            voltageRange,
            breakdown: breakdownItems
        };
    }

    throw new Error(`Cannot parse details: ${details}`);
}

/**
 * Парсит весь текст с данными о подтоплениях
 *
 * @param {string} text Текст с данными
 * @return {Object} Результат парсинга
 */
export function parseFloodData(text) {
    if (typeof text !== 'string' || !text.trim()) {
        console.warn('parseFloodData: invalid or empty input');
        return {};
    }

    if (!PATTERNS?.FLOOD?.SEGMENT) {
        console.error('parseFloodData: PATTERNS.FLOOD.SEGMENT is not defined');
        return {};
    }

    const normalizedText = normalizeText(text);
    const cleanedText = normalizedText.replace('В электросетевом комплексе', '');
    const lines = cleanedText
        .split(PATTERNS.FLOOD.SEGMENT)
        .filter(line => line.trim());

    const result = {};

    lines.forEach(line => {
        if (line.includes('«Россети» подтоплен')) {
            console.debug(`Skipping Rosseti line: ${line.substring(0, 50)}...`);
            return;
        }

        try {
            const parsed = parseFloodLine(line.trim());

            if (!parsed || !parsed.region) {
                console.warn(`Incomplete parse result for line: ${line}`);
                return;
            }

            const federalDistrict = getFederalDistrict(parsed.region);

            if (!result[federalDistrict]) {
                result[federalDistrict] = {};
            }
            if (!result[federalDistrict][parsed.region]) {
                result[federalDistrict][parsed.region] = [];
            }

            result[federalDistrict][parsed.region].push({
                company: parsed.company,
                totalPoles: parsed.totalPoles,
                totalLines: parsed.totalLines,
                voltageRange: parsed.voltageRange
            });

        } catch (error) {
            console.warn(`Failed to parse line: ${line}`, error);
        }
    });

    return result;
}