import { parseFloodData } from './parser/floodParser';
import { compareData, mergeComparisonResults } from './comparison/dataComparator';
import { generateFullReport } from './renderer/tableRenderer';
import { generateFullSummary } from './summary/summaryGenerator';

export class MonitorApp {
    constructor() {
        this.reset();
    }

    /**
     * Сброс всех данных
     */
    reset() {
        this.currentData = { flood: null, fire: null, storm: null };
        this.previousData = { flood: null, fire: null, storm: null };
        this.currentDate = '';
        this.previousDate = '';
    }

    /**
     * Устанавливает даты периодов
     */
    setDates(currentDate, previousDate) {
        this.currentDate = currentDate || '';
        this.previousDate = previousDate || '';
    }

    /**
     * Получает отформатированную предыдущую дату
     */
    getFormattedPreviousDate() {
        if (!this.previousDate) return '';

        try {
            const date = new Date(this.previousDate);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        } catch (error) {
            return this.previousDate;
        }
    }

    /**
     * Обрабатывает данные о подтоплениях
     */
    processFloodData(currentText, previousText = '') {
        try {
            if (!currentText || !currentText.trim()) {
                return false;
            }

            this.currentData.flood = parseFloodData(currentText);

            if (previousText && previousText.trim()) {
                this.previousData.flood = parseFloodData(previousText);
            }

            return true;
        } catch (error) {
            console.error('Error parsing flood data:', error);
            return false;
        }
    }

    /**
     * Обрабатывает данные о пожарах (заглушка)
     */
    processFireData(currentText, previousText = '') {
        // TODO: Реализовать парсер для пожаров
        console.log('Fire data processing not implemented yet');
        return Boolean(currentText && currentText.trim());
    }

    /**
     * Обрабатывает данные о штормах (заглушка)
     */
    processStormData(currentText, previousText = '') {
        // TODO: Реализовать парсер для штормов
        console.log('Storm data processing not implemented yet');
        return Boolean(currentText && currentText.trim());
    }

    /**
     * Генерирует отчет на основе всех данных
     */
    generateReport() {
        const floodComparison = compareData(
            this.currentData.flood || {},
            this.previousData.flood || {}
        );

        const fireComparison = {};
        const stormComparison = {};

        return mergeComparisonResults(floodComparison, fireComparison, stormComparison);
    }

    /**
     * Отображает отчет в контейнере
     */
    renderReport(container) {
        if (!container) {
            console.error('Container element is required');
            return;
        }

        const report = this.generateReport();
        generateFullReport(container, report);
    }

    /**
     * Получить текстовую сводку
     */
    getSummary() {
        return generateFullSummary(
            this.currentData.flood,
            this.currentData.fire,
            this.currentData.storm,
            this.previousData,
            this.getFormattedPreviousDate() // Передаем дату
        );
    }

    /**
     * Получить HTML сводки
     */
    getSummaryHTML() {
        const summaries = this.getSummary();
        return summaries.map(s => s.html).join('');
    }
}