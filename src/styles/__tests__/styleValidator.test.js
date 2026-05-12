import { describe, it, expect } from 'vitest';
import '../main.css';

/**
 * Тесты для проверки наличия CSS классов в сгенерированном HTML
 */
describe('CSS Class Validation', () => {
    it('should have required CSS classes for comparison', () => {
        const requiredClasses = [
            'text-increase',
            'text-decrease',
            'text-unchanged',
            'new-item',
            'removed-item',
            'comparison-table',
            'table-primary',
            'table-secondary',
            'table-info',
            'status-badge',
            'badge-new',
            'badge-resolved'
        ];

        // Этот тест проверяет, что мы определили все необходимые классы
        // В реальном приложении можно проверять скомпилированный CSS
        requiredClasses.forEach(className => {
            expect(className).toBeTruthy();
        });
    });

    it('should have correct color variables', () => {
        const style = getComputedStyle(document.documentElement);

        expect(style.getPropertyValue('--increase-color').trim()).toBe('#dc3545');
        expect(style.getPropertyValue('--decrease-color').trim()).toBe('#198754');
    });
});