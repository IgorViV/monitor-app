/**
 * Управление динамическими стилями
 */
export class StyleManager {
    constructor() {
        this.styleElement = null;
    }

    /**
     * Добавляет динамические стили
     */
    addDynamicStyles() {
        if (this.styleElement) {
            return;
        }

        this.styleElement = document.createElement('style');
        this.styleElement.textContent = `
      .comparison-value { transition: color 0.3s ease; }
      .comparison-value.increase { color: var(--increase-color); font-weight: 600; }
      .comparison-value.decrease { color: var(--decrease-color); font-weight: 600; }
      .comparison-value.unchanged { color: inherit; }
      
      .highlight-critical {
        animation: criticalPulse 2s ease-in-out infinite;
      }
      
      @keyframes criticalPulse {
        0%, 100% { background-color: transparent; }
        50% { background-color: rgba(220, 53, 69, 0.1); }
      }
      
      .data-loading {
        opacity: 0.6;
        pointer-events: none;
      }
      
      .error-shake {
        animation: shake 0.5s ease-in-out;
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
    `;

        document.head.appendChild(this.styleElement);
    }

    /**
     * Удаляет динамические стили
     */
    removeDynamicStyles() {
        if (this.styleElement) {
            document.head.removeChild(this.styleElement);
            this.styleElement = null;
        }
    }

    /**
     * Применяет класс в зависимости от статуса
     */
    static getStatusClass(status) {
        const classMap = {
            increase: 'comparison-value increase',
            decrease: 'comparison-value decrease',
            unchanged: 'comparison-value unchanged',
            new: 'comparison-value increase new-item',
            removed: 'comparison-value decrease removed-item'
        };
        return classMap[status] || '';
    }

    /**
     * Добавляет визуальную индикацию для критических значений
     */
    static markAsCritical(element) {
        element.classList.add('highlight-critical', 'critical-increase');

        // Удаляем анимацию через 5 секунд
        setTimeout(() => {
            element.classList.remove('highlight-critical');
        }, 5000);
    }
}