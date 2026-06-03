import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/main.css';
import './styles/comparison.css';
import './styles/tables.css';
import './styles/components.css';
import './styles/notifications.css';
import './styles/district-tables.css';
import './styles/summary.css';
import './styles/responsive.css';
import { MonitorApp } from './app';
import { EventManager } from './events/eventManager';

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Создаем экземпляр приложения
        const app = new MonitorApp();

        // Создаем и инициализируем менеджер событий
        const eventManager = new EventManager(app);
        eventManager.initialize();

        // Пытаемся восстановить данные из localStorage
        const restored = eventManager.loadFromLocalStorage();

        if (restored) {
            console.log('Данные восстановлены из предыдущей сессии');
        }

        // Добавляем информацию о горячих клавишах
        console.log('Горячие клавиши:');
        console.log('Ctrl+Enter - Подготовить монитор');
        console.log('Ctrl+P - Предпросмотр');
        console.log('Ctrl+Shift+R - Очистить форму');

        console.log('Монитор паводковой и пожарной обстановки успешно инициализирован');

    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);

        // Показываем сообщение об ошибке пользователю
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger m-3';
        errorAlert.innerHTML = `
      <h4>Ошибка инициализации</h4>
      <p>Произошла ошибка при запуске приложения. Пожалуйста, обновите страницу.</p>
      <p class="small text-muted">${error.message}</p>
    `;

        document.querySelector('main')?.prepend(errorAlert);
    }
});