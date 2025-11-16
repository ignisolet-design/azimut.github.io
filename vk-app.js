// Главный файл приложения
class VKApp {
    constructor() {
        this.isVK = typeof vkBridge !== 'undefined';
        this.iframe = document.getElementById('siteFrame');
        this.loading = document.getElementById('loading');
        
        this.init();
    }
    
    async init() {
        try {
            // Инициализация VK Bridge
            if (this.isVK) {
                await vkBridge.send('VKWebAppInit');
                console.log('VK Mini App инициализирован');
                
                // Настраиваем полноэкранный режим
                this.setupFullscreen();
            }
            
            // Загружаем карту
            this.loadMap();
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showMap(); // Показываем карту даже при ошибке
        }
    }
    
    setupFullscreen() {
        // Устанавливаем полноэкранные размеры
        document.documentElement.style.width = '100vw';
        document.documentElement.style.height = '100vh';
        document.body.style.width = '100vw';
        document.body.style.height = '100vh';
        
        // Скрываем системные элементы VK если нужно
        this.hideVKElements();
    }
    
    hideVKElements() {
        // Стили для скрытия возможных системных элементов
        const style = document.createElement('style');
        style.textContent = `
            [class*="vkui"] [class*="PanelHeader"] {
                display: none !important;
            }
            [class*="vkui"] [class*="panelheader"] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    loadMap() {
        // Показываем карту когда iframe загрузится
        this.iframe.onload = () => {
            setTimeout(() => {
                this.showMap();
                
                // Сообщаем сайту, что он в VK
                if (this.isVK) {
                    this.sendToSite({
                        type: 'VK_APP_INIT',
                        isVK: true,
                        fullscreen: true
                    });
                }
            }, 1000);
        };
        
        // Fallback на случай проблем с загрузкой
        setTimeout(() => {
            this.showMap();
        }, 5000);
        
        // Обработка ошибок загрузки
        this.iframe.onerror = () => {
            console.error('Ошибка загрузки карты');
            this.showMap(); // Все равно показываем iframe
        };
    }
    
    showMap() {
        this.loading.classList.add('hidden');
        this.iframe.classList.remove('hidden');
        
        // Фокус на iframe для работы клавиатуры
        setTimeout(() => {
            this.iframe.focus();
        }, 100);
    }
    
    sendToSite(data) {
        if (this.iframe && this.iframe.contentWindow) {
            this.iframe.contentWindow.postMessage(data, 'https://azimutmap.ru');
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new VKApp();
});

// Обработка ошибок
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});
