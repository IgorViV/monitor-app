/**
 * Вычисляет разницу между текущим и предыдущим значением
 * @param {number|null} current - текущее значение
 * @param {number|null} previous - предыдущее значение
 * @returns {number} разница
 */
export function calculateDifference(current, previous) {
    const cur = current || 0;
    const prev = previous || 0;
    return cur - prev;
}

/**
 * Определяет статус изменения
 * @param {number} difference - разница
 * @param {boolean} isNew - новый элемент
 * @param {boolean} isRemoved - удаленный элемент
 * @returns {string} статус ('increase', 'decrease', 'unchanged', 'new', 'removed')
 */
export function getChangeStatus(difference, isNew = false, isRemoved = false) {
    if (isNew) return 'new';
    if (isRemoved) return 'removed';
    if (difference > 0) return 'increase';
    if (difference < 0) return 'decrease';
    return 'unchanged';
}

/**
 * Сравнивает данные текущего и предыдущего периодов
 * @param {Object} currentData - текущие данные
 * @param {Object} previousData - предыдущие данные
 * @returns {Object} результат сравнения
 */
export function compareData(currentData, previousData = {}) {
    const result = {};
    // Обходим все федеральные округа в текущих данных
    Object.keys(currentData).forEach(federalDistrict => {
        if (!result[federalDistrict]) {
            result[federalDistrict] = {};
        }

        const currentRegions = currentData[federalDistrict];
        const previousRegions = previousData[federalDistrict] || {};

        // Обходим регионы
        Object.keys(currentRegions).forEach(region => {
            if (!result[federalDistrict][region]) {
                result[federalDistrict][region] = [];
            }

            const currentCompanies = currentRegions[region];
            const previousCompanies = previousRegions[region] || [];

            // Сравниваем предприятия
            currentCompanies.forEach(currentCompany => {
                const previousCompany = previousCompanies.find(
                    prev => prev.company === currentCompany.company
                );

                const difference = calculateDifference(
                    currentCompany.totalPoles,
                    previousCompany ? previousCompany.totalPoles : null
                );

                const isNew = !previousCompany;
                const status = getChangeStatus(difference, isNew);

                result[federalDistrict][region].push({
                    company: currentCompany.company,
                    currentPoles: currentCompany.totalPoles,
                    previousPoles: previousCompany ? previousCompany.totalPoles : null,
                    currentLines: currentCompany.totalLines,
                    previousLines: previousCompany ? previousCompany.totalLines : null,
                    voltageRange: currentCompany.voltageRange,
                    currentSubstations: currentCompany.totalSubstations,
                    previousSubstations: previousCompany ? previousCompany.totalSubstations : null,
                    difference,
                    status,
                    // Добавляем разницу для линий
                    linesDifference: calculateDifference(
                        currentCompany.totalLines,
                        previousCompany ? previousCompany.totalLines : null
                    ),
                    linesStatus: getChangeStatus(
                        calculateDifference(
                            currentCompany.totalLines,
                            previousCompany ? previousCompany.totalLines : null
                        ),
                        isNew
                    ),
                    // Добавляем статус для подстанций
                    substationsStatus: getChangeStatus(
                        calculateDifference(
                            currentCompany.totalSubstations,
                            previousCompany ? previousCompany.totalSubstations : null
                        ),
                        isNew
                    )
                });
            });
        });

        // Добавляем регионы, которые были в предыдущих данных, но отсутствуют в текущих
        Object.keys(previousRegions).forEach(region => {
            if (!result[federalDistrict][region]) {
                result[federalDistrict][region] = [];
            }

            const previousCompanies = previousRegions[region];

            previousCompanies.forEach(previousCompany => {
                const currentCompanies = currentRegions[region] || [];
                const currentCompany = currentCompanies.find(
                    curr => curr.company === previousCompany.company
                );

                if (!currentCompany) {
                    const difference = calculateDifference(null, previousCompany.totalPoles);
                    const status = getChangeStatus(difference, false, true);

                    result[federalDistrict][region].push({
                        company: previousCompany.company,
                        currentPoles: null,
                        previousPoles: previousCompany.totalPoles,
                        currentLines: null,
                        previousLines: previousCompany.totalLines,
                        voltageRange: previousCompany.voltageRange,
                        currentSubstations: null,
                        previousSubstations: previousCompany.totalSubstations,
                        difference,
                        status,
                        linesDifference: calculateDifference(null, previousCompany.totalLines),
                        linesStatus: getChangeStatus(
                            calculateDifference(null, previousCompany.totalLines),
                            false,
                            true
                        )
                    });
                }
            });
        });
    });

    return result;
}

/**
 * Объединяет результаты сравнения по разным типам происшествий
 * @param {Object} floodComparison - сравнение по подтоплениям
 * @param {Object} fireComparison - сравнение по пожарам
 * @param {Object} stormComparison - сравнение по штормам
 * @returns {Object} объединенные данные
 */
export function mergeComparisonResults(floodComparison = {}, fireComparison = {}, stormComparison = {}) {
    const allDistricts = new Set([
        ...Object.keys(floodComparison),
        ...Object.keys(fireComparison),
        ...Object.keys(stormComparison)
    ]);

    const merged = {};

    allDistricts.forEach(district => {
        merged[district] = {
            flood: floodComparison[district] || {},
            fire: fireComparison[district] || {},
            storm: stormComparison[district] || {}
        };
    });

    return merged;
}

/**
 * Сортирует регионы внутри федерального округа по алфавиту
 * @param {Object} data - данные для сортировки
 * @returns {Object} отсортированные данные
 */
export function sortRegions(data) {
    const sorted = {};

    Object.keys(data).sort().forEach(district => {
        sorted[district] = {};
        Object.keys(data[district]).sort().forEach(region => {
            sorted[district][region] = data[district][region].sort((a, b) =>
                a.company.localeCompare(b.company)
            );
        });
    });

    return sorted;
}

/**
 * Сравнивает данные о пожарах
 */
export function compareFireData(currentFireData = {}, previousFireData = {}) {
    const result = {};

    // Собираем все округа
    const allDistricts = new Set([
        ...Object.keys(currentFireData),
        ...Object.keys(previousFireData),
    ]);

    allDistricts.forEach(district => {
        result[district] = {};

        const currentRegions = currentFireData[district] || {};
        const previousRegions = previousFireData[district] || {};

        const allRegions = new Set([
            ...Object.keys(currentRegions),
            ...Object.keys(previousRegions),
        ]);

        allRegions.forEach(region => {
            const currentItems = currentRegions[region] || [];
            const previousItems = previousRegions[region] || [];

            if (currentItems.length > 0 || previousItems.length > 0) {
                const current = currentItems[0] || {};
                const previous = previousItems[0] || {};

                result[district][region] = [{
                    company: 'Природные пожары',
                    currentFires: current.currentFires || 0,
                    previousFires: previous.currentFires || 0,
                    currentArea: current.currentArea || 0,
                    previousArea: previous.currentArea || 0,
                    fireStatus: (current.currentFires || 0) > (previous.currentFires || 0) ? 'increase' :
                        (current.currentFires || 0) < (previous.currentFires || 0) ? 'decrease' : 'unchanged',
                    areaStatus: (current.currentArea || 0) > (previous.currentArea || 0) ? 'increase' :
                        (current.currentArea || 0) < (previous.currentArea || 0) ? 'decrease' : 'unchanged',
                    type: 'fire',
                }];
            }
        });
    });

    return result;
}