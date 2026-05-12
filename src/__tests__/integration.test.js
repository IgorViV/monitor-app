import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MonitorApp } from '../app';
import { EventManager } from '../events/eventManager';

describe('MonitorApp Integration', () => {
    let app;
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);

        const form = document.createElement('form');
        form.name = 'mainForm';
        form.innerHTML = `
      <textarea id="textareaFlood"></textarea>
      <textarea id="textareaFloodPrev"></textarea>
      <textarea id="textareaFire"></textarea>
      <textarea id="textareaFirePrev"></textarea>
      <textarea id="textareaStorm"></textarea>
      <button id="btn-make-monitor" type="button">Подготовить монитор</button>
      <button id="btn-preview" type="button">Предпросмотр</button>
      <button id="btn-reset-monitor" type="button">Очистить</button>
    `;

        const dateForm = document.createElement('form');
        dateForm.name = 'formDate';
        dateForm.innerHTML = `
      <input type="date" id="nextDate" />
      <input type="date" id="prevDate" />
    `;

        document.body.appendChild(dateForm);
        document.body.appendChild(form);

        app = new MonitorApp();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('should initialize without errors', () => {
        const eventManager = new EventManager(app);
        expect(() => {
            eventManager.initialize();
        }).not.toThrow();
    });

    it('should process flood data correctly', () => {
        const floodText = `МЭС Волги (Самарское ПМЭС. Самарская область): 21 опора 9 ЛЭП 220 кВ`;

        const result = app.processFloodData(floodText);
        expect(result).toBe(true);
        expect(app.currentData.flood).toBeTruthy();
        expect(app.currentData.flood).toHaveProperty('Приволжский ФО');
    });

    it('should handle empty flood data', () => {
        const result = app.processFloodData('');
        expect(result).toBe(false);

        const result2 = app.processFloodData(null);
        expect(result2).toBe(false);
    });

    it('should generate report with flood data', () => {
        app.processFloodData('МЭС Волги (Самарское ПМЭС. Самарская область): 21 опора 9 ЛЭП 220 кВ');

        const report = app.generateReport();
        expect(report).toBeTruthy();
        expect(Object.keys(report).length).toBeGreaterThan(0);
        expect(report).toHaveProperty('Приволжский ФО');
    });

    it('should render report to container', () => {
        app.processFloodData('МЭС Волги (Самарское ПМЭС. Самарская область): 21 опора 9 ЛЭП 220 кВ');

        expect(() => {
            app.renderReport(container);
        }).not.toThrow();

        expect(container.children.length).toBeGreaterThan(0);
    });

    it('should reset all data', () => {
        app.processFloodData('МЭС Волги (Самарское ПМЭС. Самарская область): 21 опора 9 ЛЭП 220 кВ');
        expect(app.currentData.flood).toBeTruthy();

        app.reset();
        expect(app.currentData.flood).toBeNull();
        expect(app.previousData.flood).toBeNull();
    });
});

describe('EventManager', () => {
    let eventManager;
    let mockApp;

    beforeEach(() => {
        mockApp = {
            constructor: MonitorApp,
            processFloodData: vi.fn().mockReturnValue(true),
            processFireData: vi.fn().mockReturnValue(true),
            processStormData: vi.fn().mockReturnValue(true),
            renderReport: vi.fn(),
            reset: vi.fn(),
            generateReport: vi.fn().mockReturnValue({
                'Приволжский ФО': {
                    flood: {
                        'Самарская область': []
                    }
                }
            }),
            currentData: { flood: null, fire: null, storm: null },
            previousData: { flood: null, fire: null, storm: null }
        };

        document.body.innerHTML = `
      <form name="formDate">
        <input type="date" id="nextDate" value="2024-01-15" />
        <input type="date" id="prevDate" value="2024-01-14" />
      </form>
      <form name="mainForm" id="test-form">
        <textarea id="textareaFlood">МЭС Волги (Самарское ПМЭС. Самарская область): 21 опора 9 ЛЭП 220 кВ</textarea>
        <textarea id="textareaFloodPrev"></textarea>
        <textarea id="textareaFire">Test fire data</textarea>
        <textarea id="textareaFirePrev"></textarea>
        <textarea id="textareaStorm">Test storm data</textarea>
        <button id="btn-make-monitor" type="button">Подготовить монитор</button>
        <button id="btn-preview" type="button">Предпросмотр</button>
        <button id="btn-reset-monitor" type="button">Очистить</button>
      </form>
    `;

        eventManager = new EventManager(mockApp);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
        localStorage.clear();
        vi.useRealTimers();
    });

    it('should attach event listeners', () => {
        const attachSpy = vi.spyOn(eventManager, 'attachEventListeners');
        eventManager.initialize();
        expect(attachSpy).toHaveBeenCalled();
    });

    it('should handle make monitor button click', () => {
        eventManager.initialize();

        vi.spyOn(eventManager, 'showLoading').mockImplementation(() => {});
        vi.spyOn(eventManager, 'validateAllInputs').mockReturnValue(true);
        vi.spyOn(eventManager, 'showNotification').mockImplementation(() => {});
        vi.spyOn(eventManager, 'saveToLocalStorage').mockImplementation(() => {});

        // Мокаем setTimeout чтобы избежать реального ожидания
        vi.spyOn(global, 'setTimeout').mockImplementation((fn) => {
            if (typeof fn === 'function') {
                fn(); // Выполняем немедленно
            }
            return 1;
        });

        const reportContainer = eventManager.elements.reportContainer;
        if (reportContainer) {
            reportContainer.scrollIntoView = vi.fn();
        }
        window.scrollBy = vi.fn();

        document.getElementById('btn-make-monitor').click();

        expect(mockApp.processFloodData).toHaveBeenCalled();
        expect(mockApp.renderReport).toHaveBeenCalled();

        // Восстанавливаем setTimeout
        global.setTimeout.mockRestore();
    });

    it('should not process when validation fails', () => {
        eventManager.initialize();

        vi.spyOn(eventManager, 'showLoading').mockImplementation(() => {});
        vi.spyOn(eventManager, 'validateAllInputs').mockReturnValue(false);
        vi.spyOn(eventManager, 'showNotification').mockImplementation(() => {});

        document.getElementById('btn-make-monitor').click();

        expect(mockApp.processFloodData).not.toHaveBeenCalled();
        expect(mockApp.renderReport).not.toHaveBeenCalled();
    });

    it('should handle preview button click', () => {
        eventManager.initialize();

        vi.spyOn(eventManager, 'createPreviewModal').mockImplementation(() => {
            const modalElement = document.createElement('div');
            modalElement.className = 'modal fade modal-preview';
            modalElement.id = 'preview-modal';
            modalElement.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Предпросмотр данных</h5>
            </div>
            <div class="modal-body"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
            </div>
          </div>
        </div>
      `;
            document.body.appendChild(modalElement);
            return modalElement;
        });

        vi.spyOn(eventManager, 'showNotification').mockImplementation(() => {});

        document.getElementById('btn-preview').click();

        const modal = document.querySelector('.modal');
        expect(modal).toBeTruthy();
        expect(eventManager.createPreviewModal).toHaveBeenCalled();
    });

    it('should handle preview with empty data', () => {
        eventManager.initialize();

        document.getElementById('textareaFlood').value = '';
        document.getElementById('textareaFire').value = '';
        document.getElementById('textareaStorm').value = '';

        vi.spyOn(eventManager, 'showNotification').mockImplementation(() => {});

        document.getElementById('btn-preview').click();

        expect(eventManager.showNotification).toHaveBeenCalledWith(
            expect.stringContaining('Нет данных'),
            'info'
        );

        const modal = document.querySelector('.modal');
        expect(modal).toBeNull();
    });

    it('should handle reset button click when form has data', () => {
        eventManager.initialize();

        vi.spyOn(eventManager, 'hasDataToLose').mockReturnValue(true);
        vi.spyOn(eventManager, 'showConfirmDialog').mockImplementation((title, message, onConfirm) => {
            onConfirm();
        });
        vi.spyOn(eventManager, 'performReset').mockImplementation(() => {});

        document.getElementById('btn-reset-monitor').click();

        expect(eventManager.showConfirmDialog).toHaveBeenCalled();
        expect(eventManager.performReset).toHaveBeenCalled();
    });

    it('should handle reset button click when form is empty', () => {
        eventManager.initialize();

        vi.spyOn(eventManager, 'hasDataToLose').mockReturnValue(false);
        vi.spyOn(eventManager, 'showConfirmDialog').mockImplementation(() => {});
        vi.spyOn(eventManager, 'performReset').mockImplementation(() => {});

        document.getElementById('btn-reset-monitor').click();

        expect(eventManager.performReset).toHaveBeenCalled();
        expect(eventManager.showConfirmDialog).not.toHaveBeenCalled();
    });

    it('should validate date inputs correctly', () => {
        eventManager.initialize();

        const nextDate = document.getElementById('nextDate');
        const prevDate = document.getElementById('prevDate');

        nextDate.value = '2024-01-15';
        prevDate.value = '2024-01-14';
        expect(eventManager.validateDates()).toBe(true);

        nextDate.value = '2024-01-15';
        prevDate.value = '2024-01-15';
        expect(eventManager.validateDates()).toBe(true);

        nextDate.value = '2024-01-14';
        prevDate.value = '2024-01-15';
        expect(eventManager.validateDates()).toBe(false);

        nextDate.value = '';
        prevDate.value = '2024-01-15';
        expect(eventManager.validateDates()).toBe(false);
    });

    it('should show notification', () => {
        eventManager.initialize();

        const mockToastShow = vi.fn();
        const originalBootstrap = global.bootstrap;
        global.bootstrap = {
            ...originalBootstrap,
            Toast: vi.fn().mockImplementation(() => ({
                show: mockToastShow,
                hide: vi.fn(),
                dispose: vi.fn()
            }))
        };

        eventManager.showNotification('Test message', 'info');

        const toasts = document.querySelectorAll('.toast');
        expect(toasts.length).toBeGreaterThan(0);
        expect(toasts[0].textContent).toContain('Test message');

        global.bootstrap = originalBootstrap;
    });

    it('should clear textarea when clear button clicked', () => {
        eventManager.initialize();

        vi.spyOn(eventManager, 'showTemporaryTooltip').mockImplementation(() => {});
        vi.spyOn(eventManager, 'saveToLocalStorage').mockImplementation(() => {});

        const clearBtn = document.createElement('button');
        clearBtn.setAttribute('data-clear-target', 'textareaFlood');
        clearBtn.type = 'button';
        document.body.appendChild(clearBtn);

        const textarea = document.getElementById('textareaFlood');
        textarea.value = 'Test data to clear';

        eventManager.handleClearTextarea(clearBtn);

        expect(textarea.value).toBe('');
        expect(eventManager.showTemporaryTooltip).toHaveBeenCalled();
    });

    // src/__tests__/integration.test.js

    it('should handle temporary tooltip', async () => {
        eventManager.initialize();

        const element = document.createElement('button');
        element.setAttribute('title', 'Original title');
        document.body.appendChild(element);

        eventManager.showTemporaryTooltip(element, 'Test tooltip');

        // Проверяем что title сразу изменился
        expect(element.getAttribute('title')).toBe('Test tooltip');

        // Ждем реальное время
        await new Promise(resolve => setTimeout(resolve, 1600));

        // Проверяем что title вернулся к оригинальному
        expect(element.getAttribute('title')).toBe('Original title');
    }, 5000);

    it('should handle temporary tooltip without original title', async () => {
        eventManager.initialize();

        const element = document.createElement('button');
        // Не устанавливаем title вообще
        document.body.appendChild(element);

        // Проверяем что title изначально отсутствует
        expect(element.hasAttribute('title')).toBe(false);
        expect(element.getAttribute('title')).toBeNull();

        eventManager.showTemporaryTooltip(element, 'Test tooltip');

        // Проверяем что title установлен
        expect(element.getAttribute('title')).toBe('Test tooltip');

        // Ждем реальное время
        await new Promise(resolve => setTimeout(resolve, 1600));

        // Проверяем что атрибут title удален (вернулся к исходному состоянию)
        expect(element.hasAttribute('title')).toBe(false);
        expect(element.getAttribute('title')).toBeNull();
    }, 5000);

    it('should handle temporary tooltip with empty title', async () => {
        eventManager.initialize();

        const element = document.createElement('button');
        element.setAttribute('title', '');
        document.body.appendChild(element);

        eventManager.showTemporaryTooltip(element, 'Test tooltip');

        expect(element.getAttribute('title')).toBe('Test tooltip');

        await new Promise(resolve => setTimeout(resolve, 1600));

        // Пустая строка title сохраняется
        expect(element.getAttribute('title')).toBe('');
    }, 5000);

    it('should handle temporary tooltip without original title', async () => {
        eventManager.initialize();

        const element = document.createElement('button');
        document.body.appendChild(element);

        eventManager.showTemporaryTooltip(element, 'Test tooltip');

        expect(element.getAttribute('title')).toBe('Test tooltip');

        await new Promise(resolve => setTimeout(resolve, 1600));

        expect(element.hasAttribute('title')).toBe(false);
        expect(element.getAttribute('title')).toBeNull();
    }, 5000);

    it('should handle temporary tooltip with null element', () => {
        eventManager.initialize();

        expect(() => {
            eventManager.showTemporaryTooltip(null, 'Test');
        }).not.toThrow();
    });

    it('should handle temporary tooltip when Bootstrap throws error', () => {
        eventManager.initialize();

        // Мокаем Bootstrap Tooltip чтобы выбрасывал ошибку
        const originalBootstrap = global.bootstrap;
        global.bootstrap = {
            ...originalBootstrap,
            Tooltip: vi.fn().mockImplementation(() => {
                throw new Error('Tooltip error');
            })
        };

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const element = document.createElement('button');
        document.body.appendChild(element);

        expect(() => {
            eventManager.showTemporaryTooltip(element, 'Test');
        }).not.toThrow();

        expect(consoleSpy).toHaveBeenCalled();

        global.bootstrap = originalBootstrap;
        consoleSpy.mockRestore();
    });

    it('should handle temporary tooltip with Bootstrap Tooltip', async () => {
        eventManager.initialize();

        // Убеждаемся что Bootstrap доступен
        expect(global.bootstrap).toBeDefined();
        expect(global.bootstrap.Tooltip).toBeDefined();

        const element = document.createElement('button');
        element.setAttribute('title', 'Original title');
        document.body.appendChild(element);

        eventManager.showTemporaryTooltip(element, 'Test tooltip');

        expect(element.getAttribute('title')).toBe('Test tooltip');

        // Проверяем что Tooltip был создан
        expect(global.bootstrap.Tooltip).toHaveBeenCalled();

        await new Promise(resolve => setTimeout(resolve, 1600));

        expect(element.getAttribute('title')).toBe('Original title');
    }, 5000);
});

describe('hasDataToLose', () => {
    let eventManager;

    beforeEach(() => {
        const mockAppForData = {
            constructor: MonitorApp,
            processFloodData: vi.fn().mockReturnValue(true),
            processFireData: vi.fn().mockReturnValue(true),
            processStormData: vi.fn().mockReturnValue(true),
            renderReport: vi.fn(),
            reset: vi.fn(),
            generateReport: vi.fn().mockReturnValue({}),
            currentData: { flood: null, fire: null, storm: null },
            previousData: { flood: null, fire: null, storm: null }
        };

        document.body.innerHTML = `
      <form name="mainForm">
        <textarea id="textareaFlood"></textarea>
        <textarea id="textareaFire"></textarea>
        <textarea id="textareaStorm"></textarea>
      </form>
    `;

        eventManager = new EventManager(mockAppForData);
        eventManager.initialize();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should return true when textareas have content', () => {
        document.getElementById('textareaFlood').value = 'Test data';
        expect(eventManager.hasDataToLose()).toBe(true);
    });

    it('should return false when everything is empty', () => {
        document.getElementById('textareaFlood').value = '';
        document.getElementById('textareaFire').value = '';
        document.getElementById('textareaStorm').value = '';

        const reportContainer = eventManager.elements.reportContainer;
        if (reportContainer) {
            reportContainer.innerHTML = '';
        }

        expect(eventManager.hasDataToLose()).toBe(false);
    });
});