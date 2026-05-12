import { vi } from 'vitest';

// Мок для Bootstrap с правильной реализацией Tooltip
const mockTooltipInstance = {
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
    tip: document.createElement('div')
};

const MockTooltip = vi.fn().mockImplementation(() => mockTooltipInstance);

global.bootstrap = {
    Modal: vi.fn().mockImplementation(() => ({
        show: vi.fn(),
        hide: vi.fn(),
        dispose: vi.fn(),
        _element: document.createElement('div')
    })),
    Toast: vi.fn().mockImplementation((element) => ({
        show: vi.fn(),
        hide: vi.fn(),
        dispose: vi.fn(),
        _element: element || document.createElement('div')
    })),
    Tooltip: MockTooltip
};

// Мок для localStorage
const localStorageMock = {
    store: {},
    getItem: vi.fn((key) => {
        return localStorageMock.store[key] || null;
    }),
    setItem: vi.fn((key, value) => {
        localStorageMock.store[key] = value;
    }),
    removeItem: vi.fn((key) => {
        delete localStorageMock.store[key];
    }),
    clear: vi.fn(() => {
        localStorageMock.store = {};
    })
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
});

// Мок для window.scrollTo
window.scrollTo = vi.fn();

// Мок для window.scrollBy
window.scrollBy = vi.fn();

// Мок для window.print
window.print = vi.fn();

// Мок для matchMedia (нужен для Bootstrap)
window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
}));

// Очистка моков перед каждым тестом
beforeEach(() => {
    localStorageMock.clear();
    document.body.innerHTML = '';
    vi.clearAllMocks();

    // Сбрасываем счетчики вызовов для моков Bootstrap
    mockTooltipInstance.show.mockClear();
    mockTooltipInstance.hide.mockClear();
    mockTooltipInstance.dispose.mockClear();
    MockTooltip.mockClear();
});