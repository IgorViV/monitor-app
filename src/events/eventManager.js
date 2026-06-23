import { Modal, Toast } from 'bootstrap';
import {exportToPDF, generatePrintableHTML} from "../renderer/pdfGenerator.js";

export class EventManager {
    constructor(app) {
        this.app = app;
        this.elements = {};
        this.modals = {};
        this.isInitialized = false;
    }

    /**
     * Инициализация менеджера событий
     */
    initialize() {
        if (this.isInitialized) {
            console.warn('EventManager already initialized');
            return;
        }

        this.cacheElements();
        this.attachEventListeners();
        this.setupAutoSave();
        this.setupKeyboardShortcuts();

        this.isInitialized = true;
        console.log('EventManager initialized successfully');
    }

    /**
     * Кеширование DOM элементов
     */
    cacheElements() {
        this.elements = {
            // Текстовые поля
            textareaFlood: document.getElementById('textareaFlood'),
            textareaFloodPrev: document.getElementById('textareaFloodPrev'),
            textareaFire: document.getElementById('textareaFire'),
            textareaFirePrev: document.getElementById('textareaFirePrev'),
            textareaStorm: document.getElementById('textareaStorm'),

            // Поля дат
            nextDate: document.getElementById('nextDate'),
            prevDate: document.getElementById('prevDate'),

            // Кнопки
            btnMakeMonitor: document.getElementById('btn-make-monitor'),
            btnPreview: document.getElementById('btn-preview'),
            btnResetMonitor: document.getElementById('btn-reset-monitor'),

            // Кнопки очистки текстовых полей
            clearButtons: document.querySelectorAll('[data-clear-target]'),

            // Контейнер для отчета
            reportContainer: document.getElementById('report-container') || this.createReportContainer(),

            // Формы
            mainForm: document.forms['mainForm'],
            dateForm: document.forms['formDate']
        };

        // Проверяем наличие всех необходимых элементов
        this.validateElements();
    }

    /**
     * Создает контейнер для отчета, если его нет
     */
    createReportContainer() {
        const container = document.createElement('div');
        container.id = 'report-container';
        // container.className = 'mt-4';

        const main = document.querySelector('main');
        if (main) {
            // Вставляем после формы
            const form = document.querySelector('form[name="mainForm"]');
            if (form) {
                form.after(container);
            } else {
                main.appendChild(container);
            }
        }
        return container;
    }

    /**
     * Создаем страницу отчета Монитора
     * @return {HTMLElement} - Страница отчета Монитора
     */
    createMapPage() {
        const templateMap = document.getElementById('template-map');
        const templateMapContent = templateMap.content;
        const mapPage = templateMapContent.cloneNode(true);
        const nextDate = this.elements.nextDate?.value;
        const mapTitleDate = mapPage.querySelector('.map-title-date');
        mapTitleDate.textContent = `${this.formatDate(nextDate)}`;

        return mapPage;
    }

    /**
     * Форматирует дату
     * @param dateString {string} - Дата в формате YYYY-MM-DD
     * @return {string} - Дата в формате DD.MM.YYYY
     */
    formatDate(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}.${month}.${year}`;
    }

    /**
     * Проверяет наличие всех необходимых элементов
     */
    validateElements() {
        const requiredElements = [
            'textareaFlood',
            'textareaFloodPrev',
            'btnMakeMonitor',
            'btnPreview',
            'btnResetMonitor'
        ];

        const missingElements = [];

        requiredElements.forEach(elementName => {
            if (!this.elements[elementName]) {
                missingElements.push(elementName);
            }
        });

        if (missingElements.length > 0) {
            console.warn('Missing required elements:', missingElements.join(', '));
        }

        // Устанавливаем даты по умолчанию
        this.setDefaultDates();
    }

    /**
     * Устанавливает даты по умолчанию
     */
    setDefaultDates() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (this.elements.nextDate && !this.elements.nextDate.value) {
            this.elements.nextDate.value = today.toISOString().split('T')[0];
        }

        if (this.elements.prevDate && !this.elements.prevDate.value) {
            this.elements.prevDate.value = yesterday.toISOString().split('T')[0];
        }
    }

    /**
     * Привязка обработчиков событий
     */
    attachEventListeners() {
        // Основные кнопки
        if (this.elements.btnMakeMonitor) {
            this.elements.btnMakeMonitor.addEventListener('click', () => {
                this.handleMakeMonitor();
            });
        }

        if (this.elements.btnPreview) {
            this.elements.btnPreview.addEventListener('click', () => {
                this.handlePreview();
            });
        }

        if (this.elements.btnResetMonitor) {
            this.elements.btnResetMonitor.addEventListener('click', () => {
                this.handleReset();
            });
        }

        // Кнопки очистки текстовых полей
        if (this.elements.clearButtons) {
            this.elements.clearButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    this.handleClearTextarea(e.target);
                });
            });
        }

        // Автоматическое сохранение при вводе
        this.setupAutoSaveTriggers();

        // Валидация при изменении дат
        this.setupValidationTriggers();
    }

    /**
     * Настройка триггеров автосохранения
     */
    setupAutoSaveTriggers() {
        // Добавляем обработчики на все текстовые поля
        const textareas = [
            this.elements.textareaFlood,
            this.elements.textareaFloodPrev,
            this.elements.textareaFire,
            this.elements.textareaFirePrev,
            this.elements.textareaStorm
        ].filter(Boolean); // Фильтруем несуществующие элементы

        textareas.forEach(textarea => {
            // Сохраняем при вводе (с дебаунсом)
            textarea.addEventListener('input', () => {
                this.debouncedSave();
            });

            // Сохраняем при потере фокуса
            textarea.addEventListener('blur', () => {
                this.saveToLocalStorage();
            });
        });

        // Сохраняем при изменении дат
        if (this.elements.nextDate) {
            this.elements.nextDate.addEventListener('change', () => {
                this.saveToLocalStorage();
            });
        }

        if (this.elements.prevDate) {
            this.elements.prevDate.addEventListener('change', () => {
                this.saveToLocalStorage();
            });
        }
    }

    /**
     * Настройка валидации
     */
    setupValidationTriggers() {
        // Валидация дат при изменении
        if (this.elements.nextDate) {
            this.elements.nextDate.addEventListener('change', () => {
                this.validateDates();
            });
        }

        if (this.elements.prevDate) {
            this.elements.prevDate.addEventListener('change', () => {
                this.validateDates();
            });
        }

        // Валидация форм при отправке (если бы использовалась стандартная отправка)
        if (this.elements.mainForm) {
            this.elements.mainForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMakeMonitor();
            });
        }

        if (this.elements.dateForm) {
            this.elements.dateForm.addEventListener('submit', (e) => {
                e.preventDefault();
            });
        }
    }

    /**
     * Дебаунсированное сохранение
     */
    debouncedSave() {
        // Очищаем предыдущий таймаут
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        // Устанавливаем новый таймаут
        this.saveTimeout = setTimeout(() => {
            this.saveToLocalStorage();
        }, 1000); // Сохраняем через 1 секунду после последнего ввода
    }

    /**
     * Обработка создания монитора
     */
    async handleMakeMonitor() {
        try {
            this.showLoading(true);

            if (!this.validateAllInputs()) {
                this.showLoading(false);
                return;
            }

            // Сохраняем даты
            const currentDate = this.elements.nextDate?.value || '';
            const previousDate = this.elements.prevDate?.value || '';
            this.app.setDates(currentDate, previousDate);

            // Собираем данные
            const floodText = this.elements.textareaFlood?.value || '';
            const floodPrevText = this.elements.textareaFloodPrev?.value || '';
            const fireText = this.elements.textareaFire?.value || '';
            const firePrevText = this.elements.textareaFirePrev?.value || '';
            const stormText = this.elements.textareaStorm?.value || '';

            // Сбрасываем приложение перед обработкой новых данных
            this.app.reset();
            this.app.setDates(currentDate, previousDate);

            // Обрабатываем данные
            let hasData = false;

            if (floodText.trim()) {
                const floodSuccess = this.app.processFloodData(floodText, floodPrevText);
                hasData = hasData || floodSuccess;
            }

            if (fireText.trim()) {
                const fireSuccess = this.app.processFireData(fireText, firePrevText);
                hasData = hasData || fireSuccess;
            }

            if (stormText.trim()) {
                const stormSuccess = this.app.processStormData(stormText);
                hasData = hasData || stormSuccess;
            }

            if (!hasData) {
                this.showNotification('Не удалось обработать данные. Проверьте формат ввода.', 'danger');
                this.showLoading(false);
                return;
            }

            // Очищаем контейнер отчета перед добавлением новых данных
            const reportContainer = this.elements.reportContainer;
            if (reportContainer) {
                reportContainer.innerHTML = '';
            }

            // Удаляем старую карту, если есть
            if (document.querySelector('.map-container')) {
                document.querySelector('.map-container').remove();
            }

            // Генерируем и отображаем отчет
            // this.app.renderReport(reportContainer); // TODO закомментировано на время отладки соседнего кода

            // Добавляем сводку перед отчетом
            const summaryHTML = this.app.getSummaryHTML();

            // Создаем страницу карты
            const mapPage = this.createMapPage();
            const mapMainContainer = mapPage.querySelector('.map-main-container');
            mapMainContainer.insertAdjacentHTML('afterbegin', summaryHTML);
            const mapDistrictContainer = mapPage.querySelector('.map-district-container');
            const mapIconsContainer = mapPage.querySelector('#icons-use');
            this.app.renderReport(mapDistrictContainer);
            this.app.renderIcons(mapIconsContainer);
            document.getElementById('main').appendChild(mapPage); // TODO: убрать после реализации pdf отчета

            // Генерируем PDF версию
            // await this.generatePDFReport(mapPage); // TODO: закомментировано на время отладки соседнего кода

            if (summaryHTML && reportContainer) {
                // Удаляем старый summary-container если есть
                const oldSummary = document.getElementById('summary-container');
                if (oldSummary) {
                    oldSummary.remove();
                }

                // Создаем новый summary-container
                // const summaryContainer = this.createSummaryContainer(); // TODO: убрать после полной реализации pdf отчета
                // summaryContainer.innerHTML = summaryHTML;
                //
                // // Вставляем сводку перед таблицами округов
                // if (reportContainer.firstChild) {
                //     reportContainer.insertBefore(summaryContainer, reportContainer.firstChild);
                // } else {
                //     reportContainer.appendChild(summaryContainer);
                // }
            }

            // Скроллим к отчету
            if (reportContainer && typeof reportContainer.scrollIntoView === 'function') {
                setTimeout(() => {
                    try {
                        reportContainer.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                            inline: 'nearest'
                        });
                        if (typeof window.scrollBy === 'function') {
                            window.scrollBy(0, -20);
                        }
                    } catch (scrollError) {
                        console.debug('Scroll failed:', scrollError);
                    }
                }, 100);
            }

            this.saveToLocalStorage();
            this.showNotification('Монитор успешно подготовлен', 'success');

        } catch (error) {
            console.error('Error generating monitor:', error);
            console.error('Stack:', error.stack);
            this.showNotification('Произошла ошибка при подготовке монитора', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Генерирует PDF отчет
     */
    async generatePDFReport(mapPage) {
        try {
            // Создаем временный контейнер для PDF версии
            const pdfContainer = document.createElement('div');
            pdfContainer.id = 'pdf-container';
            pdfContainer.style.cssText = 'width: 297mm; height: 210mm;';
            pdfContainer.appendChild(mapPage);
            document.body.appendChild(pdfContainer);

            // Генерируем HTML
            const printableHTML = generatePrintableHTML(
                this.app,
                this.elements.nextDate?.value,
                this.elements.prevDate?.value
            );
            // pdfContainer.innerHTML = printableHTML;

            // Ждем загрузки изображений
            await new Promise(resolve => setTimeout(resolve, 500));

            // Экспортируем в PDF
            await exportToPDF(pdfContainer, `monitor-${this.formatDate(this.elements.nextDate?.value) || 'report'}.pdf`);

            // Удаляем временный контейнер
            document.body.removeChild(pdfContainer);

            this.showNotification('PDF отчет сгенерирован', 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showNotification('Ошибка при создании PDF', 'danger');
        }
    }

    createSummaryContainer() {
        // Удаляем старый если есть
        const oldContainer = document.getElementById('summary-container');
        if (oldContainer) {
            oldContainer.remove();
        }

        const container = document.createElement('div');
        container.id = 'summary-container';
        container.className = 'summary-container mb-4';
        return container;
    }

    /**
     * Обработка предпросмотра
     */
    handlePreview() {
        try {
            // Собираем данные
            const floodText = this.elements.textareaFlood?.value || '';
            const floodPrevText = this.elements.textareaFloodPrev?.value || '';
            const fireText = this.elements.textareaFire?.value || '';
            const stormText = this.elements.textareaStorm?.value || '';

            if (!floodText && !fireText && !stormText) {
                this.showNotification('Нет данных для предпросмотра. Заполните хотя бы одно поле.', 'info');
                return;
            }

            // Создаем временный экземпляр приложения для предпросмотра
            const previewApp = new this.app.constructor();

            let hasData = false;

            if (floodText.trim()) {
                const floodSuccess = previewApp.processFloodData(floodText, floodPrevText);
                hasData = hasData || floodSuccess;
            }

            if (fireText.trim()) {
                const fireSuccess = previewApp.processFireData(fireText, '');
                hasData = hasData || fireSuccess;
            }

            if (stormText.trim()) {
                const stormSuccess = previewApp.processStormData(stormText);
                hasData = hasData || stormSuccess;
            }

            if (!hasData) {
                this.showNotification('Не удалось обработать данные для предпросмотра', 'warning');
                return;
            }

            // Создаем модальное окно
            const modalElement = this.createPreviewModal();
            const modal = new Modal(modalElement, {
                backdrop: 'static',
                keyboard: true
            });

            // Отображаем предпросмотр в модальном окне
            const previewContainer = modalElement.querySelector('.modal-body');
            previewApp.renderReport(previewContainer);

            // Генерируем HTML для печати
            const printableHTML = generatePrintableHTML(
                this.app,
                this.elements.nextDate?.value,
                this.elements.prevDate?.value
            );

            previewContainer.innerHTML = printableHTML;

            // Показываем модальное окно
            modal.show();

            // Фокус на модальном окне для доступности
            modalElement.addEventListener('shown.bs.modal', () => {
                modalElement.querySelector('.btn-close')?.focus();
            });

        } catch (error) {
            console.error('Error showing preview:', error);
            this.showNotification('Ошибка при создании предпросмотра', 'danger');
        }
    }

    /**
     * Создает модальное окно для предпросмотра
     */
    createPreviewModal() {
        // Удаляем существующее модальное окно, если есть
        const existingModal = document.getElementById('preview-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
      <div class="modal fade modal-preview" id="preview-modal" tabindex="-1" aria-labelledby="preview-modal-label">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header bg-light">
              <h5 class="modal-title" id="preview-modal-label">
                <i class="bi bi-eye"></i> Предпросмотр данных
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
            </div>
            <div class="modal-body">
              <div class="text-center p-3">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Загрузка...</span>
                </div>
                <p class="mt-2 text-muted">Подготовка предпросмотра...</p>
              </div>
            </div>
            <div class="modal-footer bg-light">
              <div class="d-flex justify-content-between w-100">
                <small class="text-muted align-self-center">
                  Данные предпросмотра не сохраняются
                </small>
                <div>
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                  <button type="button" class="btn btn-outline-primary" id="btn-print-preview">
                    <i class="bi bi-printer"></i> Печать
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modalElement = document.getElementById('preview-modal');

        // Добавляем обработчик печати // TODO подумать нужна печать из модального окна или нет
        modalElement.querySelector('#btn-print-preview')?.addEventListener('click', () => {
            window.print();
        });

        // Очистка при закрытии
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });

        return modalElement;
    }

    /**
     * Обработка сброса формы
     */
    handleReset() {
        // Показываем модальное окно подтверждения вместо простого confirm
        if (this.hasDataToLose()) {
            this.showConfirmDialog(
                'Очистить все данные?',
                'Это действие нельзя будет отменить. Все введенные данные будут потеряны.',
                () => this.performReset()
            );
        } else {
            this.performReset();
        }
    }

    /**
     * Проверяет, есть ли данные которые можно потерять
     */
    hasDataToLose() {
        const textareas = document.querySelectorAll('textarea');
        for (let textarea of textareas) {
            if (textarea.value.trim()) {
                return true;
            }
        }

        const reportContainer = document.getElementById('report-container');
        if (reportContainer && reportContainer.children.length > 0) {
            return true;
        }

        return false;
    }

    /**
     * Показывает диалог подтверждения
     */
    showConfirmDialog(title, message, onConfirm) {
        const modalHTML = `
      <div class="modal fade" id="confirm-modal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
              <button type="button" class="btn btn-danger" id="btn-confirm-reset">Очистить</button>
            </div>
          </div>
        </div>
      </div>
    `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modalElement = document.getElementById('confirm-modal');
        const modal = new Modal(modalElement);

        modalElement.querySelector('#btn-confirm-reset').addEventListener('click', () => {
            modal.hide();
            onConfirm();
        });

        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });

        modal.show();
    }

    /**
     * Выполняет сброс
     */
    performReset() {
        // Очищаем все текстовые поля
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.value = '';
        });

        // Очищаем отчет
        const reportContainer = document.getElementById('report-container');
        if (reportContainer) {
            reportContainer.innerHTML = '';
        }

        // Сбрасываем приложение
        this.app.reset();

        // Очищаем localStorage
        localStorage.removeItem('monitorData');

        // Сбрасываем даты на значения по умолчанию
        this.setDefaultDates();

        this.showNotification('Все данные успешно очищены', 'info');

        // Скроллим к началу страницы
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Очистка конкретного текстового поля
     */
    handleClearTextarea(button) {
        const targetId = button.getAttribute('data-clear-target');
        if (!targetId) return;

        const textarea = document.getElementById(targetId);
        if (!textarea) return;

        // Проверяем, есть ли данные для очистки
        if (textarea.value.trim()) {
            textarea.value = '';
            textarea.focus();

            // Показываем маленькую подсказку только если текст был
            try {
                this.showTemporaryTooltip(button, 'Очищено');
            } catch (error) {
                // Игнорируем ошибки тултипа
            }

            // Сохраняем состояние
            this.saveToLocalStorage();
        }
    }

    /**
     * Показывает временную подсказку
     */
    showTemporaryTooltip(element, message, duration = 1500) {
        if (!element) return;

        const originalTitle = element.getAttribute('title');
        element.setAttribute('title', message);

        // Сохраняем timeout ID для возможной очистки
        const timeoutId = setTimeout(() => {
            // Восстанавливаем оригинальное состояние
            if (originalTitle === null) {
                // Если атрибута не было, удаляем его
                element.removeAttribute('title');
            } else {
                // Если атрибут был, восстанавливаем его значение
                element.setAttribute('title', originalTitle);
            }
        }, duration);

        // Проверяем наличие Bootstrap Tooltip
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            try {
                const tooltip = new bootstrap.Tooltip(element, {
                    trigger: 'manual',
                    placement: 'top'
                });

                if (tooltip && typeof tooltip.show === 'function') {
                    tooltip.show();

                    setTimeout(() => {
                        try {
                            if (tooltip && typeof tooltip.hide === 'function') {
                                tooltip.hide();
                            }
                            if (tooltip && typeof tooltip.dispose === 'function') {
                                tooltip.dispose();
                            }
                        } catch (error) {
                            // Игнорируем ошибки при очистке тултипа
                        }
                    }, duration);
                }
            } catch (error) {
                console.warn('Failed to show tooltip:', error);
            }
        }

        return timeoutId;
    }

    /**
     * Валидация всех входных данных
     */
    validateAllInputs() {
        let isValid = true;

        // Проверяем даты
        if (!this.validateDates()) {
            isValid = false;
        }

        // Проверяем, что хотя бы одно поле заполнено
        const hasFloodData = this.elements.textareaFlood?.value.trim();
        const hasFireData = this.elements.textareaFire?.value.trim();
        const hasStormData = this.elements.textareaStorm?.value.trim();

        if (!hasFloodData && !hasFireData && !hasStormData) {
            this.showNotification('Заполните хотя бы одно поле с данными', 'warning');
            this.highlightEmptyFields();
            isValid = false;
        }

        // Проверяем формат данных (базовая валидация)
        if (hasFloodData && !this.validateFloodFormat(hasFloodData)) {
            this.showNotification('Проверьте формат данных о подтоплениях', 'warning');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Базовая валидация формата данных о подтоплениях
     */
    validateFloodFormat(text) {
        // Проверяем наличие базовых паттернов
        const hasCompany = /«[^»]+»/.test(text);
        const hasRegion = /\([^)]+\)/.test(text);
        const hasNumbers = /\d+/.test(text);

        return hasCompany && hasRegion && hasNumbers;
    }

    /**
     * Подсвечивает незаполненные обязательные поля
     */
    highlightEmptyFields() {
        const fields = [
            this.elements.textareaFlood,
            this.elements.textareaFire,
            this.elements.textareaStorm
        ];

        fields.forEach(field => {
            if (field && !field.value.trim()) {
                field.classList.add('is-invalid');

                // Убираем подсветку при вводе
                const removeHighlight = () => {
                    field.classList.remove('is-invalid');
                    field.removeEventListener('input', removeHighlight);
                };

                field.addEventListener('input', removeHighlight);
            }
        });
    }

    /**
     * Валидация дат
     */
    validateDates() {
        const nextDate = this.elements.nextDate?.value;
        const prevDate = this.elements.prevDate?.value;

        // Сбрасываем предыдущие ошибки
        this.elements.nextDate?.classList.remove('is-invalid');
        this.elements.prevDate?.classList.remove('is-invalid');

        if (!nextDate) {
            this.showNotification('Укажите текущую дату', 'warning');
            this.elements.nextDate?.classList.add('is-invalid');
            return false;
        }

        if (prevDate && nextDate) {
            const next = new Date(nextDate);
            const prev = new Date(prevDate);

            if (prev > next) {
                this.showNotification('Предыдущая дата не может быть позже текущей', 'danger');
                this.elements.prevDate?.classList.add('is-invalid');
                return false;
            }

            // Проверяем, что разница не слишком большая (больше года)
            const diffTime = Math.abs(next - prev);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 365) {
                this.showNotification('Разница между датами не должна превышать 1 год', 'warning');
                return false;
            }
        }

        return true;
    }

    /**
     * Настройка автосохранения
     */
    setupAutoSave() {
        // Автосохранение при уходе со страницы
        window.addEventListener('beforeunload', () => {
            this.saveToLocalStorage();
        });

        // Автосохранение при скрытии страницы (мобильные устройства)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveToLocalStorage();
            }
        });
    }

    /**
     * Настройка горячих клавиш
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Игнорируем события, когда фокус в текстовых полях
            const isTextarea = e.target.tagName === 'TEXTAREA';

            // Ctrl/Cmd + Enter - подготовить монитор
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.handleMakeMonitor();
            }

            // Ctrl/Cmd + Shift + P - предпросмотр (если не в текстовом поле)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.handlePreview();
            }

            // Ctrl/Cmd + Shift + R - сброс
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.handleReset();
            }

            // Escape - закрыть модальное окно предпросмотра
            if (e.key === 'Escape') {
                const previewModal = document.getElementById('preview-modal');
                if (previewModal) {
                    const modal = Modal.getInstance(previewModal);
                    if (modal) {
                        modal.hide();
                    }
                }
            }
        });
    }

    /**
     * Сохранение данных в localStorage
     */
    saveToLocalStorage() {
        try {
            const data = {
                flood: this.elements.textareaFlood?.value || '',
                floodPrev: this.elements.textareaFloodPrev?.value || '',
                fire: this.elements.textareaFire?.value || '',
                firePrev: this.elements.textareaFirePrev?.value || '',
                storm: this.elements.textareaStorm?.value || '',
                nextDate: this.elements.nextDate?.value || '',
                prevDate: this.elements.prevDate?.value || '',
                timestamp: new Date().toISOString()
            };

            localStorage.setItem('monitorData', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);

            // Если localStorage переполнен, показываем предупреждение
            if (error.name === 'QuotaExceededError') {
                this.showNotification('Не удалось сохранить данные: хранилище переполнено', 'warning');
            }
        }
    }

    /**
     * Загрузка данных из localStorage
     */
    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('monitorData');
            if (!savedData) return false;

            const data = JSON.parse(savedData);

            // Проверяем, не устарели ли данные (старше 24 часов)
            const timestamp = new Date(data.timestamp);
            const now = new Date();
            const hoursDiff = (now - timestamp) / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                localStorage.removeItem('monitorData');
                return false;
            }

            // Восстанавливаем данные
            if (data.nextDate && this.elements.nextDate) {
                this.elements.nextDate.value = data.nextDate;
            }
            if (data.prevDate && this.elements.prevDate) {
                this.elements.prevDate.value = data.prevDate;
            }
            if (data.flood && this.elements.textareaFlood) {
                this.elements.textareaFlood.value = data.flood;
            }
            if (data.floodPrev && this.elements.textareaFloodPrev) {
                this.elements.textareaFloodPrev.value = data.floodPrev;
            }
            if (data.fire && this.elements.textareaFire) {
                this.elements.textareaFire.value = data.fire;
            }
            if (data.firePrev && this.elements.textareaFirePrev) {
                this.elements.textareaFirePrev.value = data.firePrev;
            }
            if (data.storm && this.elements.textareaStorm) {
                this.elements.textareaStorm.value = data.storm;
            }

            return true;
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
            return false;
        }
    }

    /**
     * Показывает уведомление
     */
    showNotification(message, type = 'info') {
        // Создаем контейнер для уведомлений, если его нет
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '1060';
            document.body.appendChild(toastContainer);
        }

        // Создаем уведомление
        const toastId = `toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Закрыть"></button>
      </div>
    `;

        toastContainer.appendChild(toast);

        // Показываем через Bootstrap Toast
        const bsToast = new Toast(toast, {
            delay: 3000,
            animation: true
        });
        bsToast.show();

        // Удаляем после скрытия
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    /**
     * Показывает/скрывает индикатор загрузки
     */
    showLoading(show) {
        let spinner = document.querySelector('.spinner-overlay');

        if (show && !spinner) {
            spinner = document.createElement('div');
            spinner.className = 'spinner-overlay';
            spinner.innerHTML = `
        <div class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Загрузка...</span>
          </div>
          <div class="spinner-text mt-2">Подготовка монитора...</div>
        </div>
      `;
            document.body.appendChild(spinner);
        } else if (!show && spinner) {
            spinner.remove();
        }
    }
}