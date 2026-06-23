import { parseFloodData } from './parser/floodParser';
import { parseFireData, parseFireSummary } from './parser/fireParser';
import { parseStormData } from './parser/stormParser';
import { compareData, mergeComparisonResults, compareFireData } from './comparison/dataComparator';
import { generateFullSummary, generateFloodSummary, generateFireSummary } from './summary/summaryGenerator';
import { generateFullReport } from './renderer/tableRenderer';
import { generateIcon } from './renderer/iconGenerator.js';


export class MonitorApp {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentData = { flood: null, fire: null, storm: null, fireSummary: null };
        this.previousData = { flood: null, fire: null, storm: null, fireSummary: null };
        this.currentDate = '';
        this.previousDate = '';
    }

    setDates(currentDate, previousDate) {
        this.currentDate = currentDate || '';
        this.previousDate = previousDate || '';
    }

    getFormattedPreviousDate() {
        if (!this.previousDate) return '';

        try {
            const date = new Date(this.previousDate);
            if (isNaN(date.getTime())) {
                return this.previousDate;
            }
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        } catch (error) {
            console.warn('Error formatting date:', error);
            return this.previousDate;
        }
    }

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

    processFireData(currentText, previousText = '') {
        try {
            if (!currentText || !currentText.trim()) {
                return false;
            }

            const fireData = parseFireData(currentText);

            if (fireData) {
                // Сохраняем суммарную информацию
                this.currentData.fireSummary = fireData.summary;

                // Сохраняем данные по регионам (если есть)
                if (fireData.regions && Object.keys(fireData.regions).length > 0) {
                    this.currentData.fire = fireData.regions;
                }

                // Парсим предыдущие данные
                if (previousText && previousText.trim()) {
                    const prevFireData = parseFireData(previousText);
                    if (prevFireData) {
                        this.previousData.fireSummary = prevFireData.summary;
                        if (prevFireData.regions && Object.keys(prevFireData.regions).length > 0) {
                            this.previousData.fire = prevFireData.regions;
                        }
                    }
                }

                return true;
            }

            // Если не получилось распарсить как полные данные, пробуем только сводку
            const summary = parseFireSummary(currentText);
            if (summary) {
                this.currentData.fireSummary = summary;

                if (previousText && previousText.trim()) {
                    const prevSummary = parseFireSummary(previousText);
                    if (prevSummary) {
                        this.previousData.fireSummary = prevSummary;
                    }
                }

                return true;
            }

            return false;
        } catch (error) {
            console.error('Error parsing fire data:', error);
            return false;
        }
    }

    processStormData(currentText, previousText = '') {
        try {
            if (!currentText || !currentText.trim()) {
                return false;
            }

            const stormData = parseStormData(currentText);
            if (stormData && stormData.regions && Object.keys(stormData.regions).length > 0) {
                this.currentData.storm = stormData.regions;

                if (previousText && previousText.trim()) {
                    const prevStormData = parseStormData(previousText);
                    if (prevStormData && prevStormData.regions) {
                        this.previousData.storm = prevStormData.regions;
                    }
                }

                return true;
            }

            return false;

        } catch (error) {
            console.error('Error parsing storm data:', error);
            return false;
        }
    }

    generateReport() {
        const floodComparison = compareData(
            this.currentData.flood || {},
            this.previousData.flood || {}
        );

        const fireComparison = compareFireData(
            this.currentData.fire || {},
            this.previousData.fire || {}
        );

        const stormComparison = this.currentData.storm || {};

        return mergeComparisonResults(floodComparison, fireComparison, stormComparison);
    }

    renderReport(container) {
        if (!container) {
            console.error('Container element is required');
            return;
        }

        // Контейнер уже должен быть очищен в EventManager
        const report = this.generateReport();

        // Проверяем, есть ли данные для отображения
        if (!report || Object.keys(report).length === 0) {
            const alert = document.createElement('div');
            alert.className = 'alert alert-info';
            alert.textContent = 'Нет данных для отображения';
            container.appendChild(alert);
            return;
        }

        generateFullReport(container, report);
    }

    renderIcons(containerIcons) {
        if (!containerIcons) {
            console.error('Container icons element is required');
            return;
        }

        const report = this.generateReport();

        // Проверяем, есть ли данные для отображения
        if (!report || Object.keys(report).length === 0) {
            console.error('Report data is required');
            return;
        }

        // console.log(generateIcon(report).join('\n'));
        containerIcons.innerHTML = generateIcon(report).join('\n');
    }

    getSummary() {
        return generateFullSummary(
            this.currentData.flood,
            this.currentData.fire,
            this.currentData.storm,
            this.previousData,
            this.getFormattedPreviousDate(),
            this.currentData.fireSummary,
            this.previousData.fireSummary
        );
    }

    getSummaryHTML() {
        const summaries = this.getSummary();
        return summaries.map(s => s.html).join('');
    }
}
