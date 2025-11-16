// Главный файл приложения
class VKApp {
    constructor() {
        this.isVK = typeof vkBridge !== 'undefined';
        this.iframe = document.getElementById('siteFrame');
        this.loading = document.getElementById('loading');
        this.content = document.getElementById('content');
        this.backButton = document.getElementById('backButton');
        
        this.init();
    }
    
    async init() {
        try {
            // Инициализация VK Bridge
            if (this.isVK) {
                await vkBridge.send('VKWebAppInit');
                console.log('VK Mini App инициализирован');
                
                // Получаем данные пользователя
                await this.getUserInfo();
                
                // Настраиваем интерфейс под VK
                this.setupVKInterface();
            }
            
            // Загружаем основной контент
            this.loadContent();
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showContent(); // Показываем контент даже при ошибке
        }
    }
    
    async getUserInfo() {
        try {
            const user = await vkBridge.send('VKWebAppGetUserInfo');
            console.log('Пользователь VK:', user);
            
            // Можно передать данные пользователя на сайт
            this.sendToSite({
                type: 'VK_USER_DATA',
                user: user
            });
            
        } catch (error) {
            console.log('Не удалось получить данные пользователя');
        }
    }
    
    setupVKInterface() {
        // Устанавливаем высоту для VK
        document.documentElement.style.height = '100vh';
        document.body.style.height = '100vh';
        
        // Слушаем сообщения от сайта
        this.setupMessageListener();
        
        // Обработка кнопки "Назад"
        this.setupBackButton();
    }
    
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            // Проверяем origin для безопасности
            if (event.origin !== 'https://azimutmap.ru') return;
            
            const data = event.data;
            console.log('Сообщение от сайта:', data);
            
            // Обрабатываем команды от вашего сайта
            this.handleSiteMessage(data, event);
        });
    }
    
    handleSiteMessage(data, event) {
        switch (data.type) {
            case 'VK_SHARE':
                this.shareContent(data.url);
                break;
                
            case 'VK_BACK_BUTTON':
                this.toggleBackButton(data.visible);
                break;
                
            case 'VK_CLOSE_APP':
                this.closeApp();
                break;
                
            case 'VK_GET_USER':
                this.getUserInfo().then(user => {
                    this.sendToSite({
                        type: 'VK_USER_RESPONSE',
                        user: user
                    });
                });
                break;
        }
    }
    
    sendToSite(data) {
        if (this.iframe && this.iframe.contentWindow) {
            this.iframe.contentWindow.postMessage(data, 'https://azimutmap.ru');
        }
    }
    
    loadContent() {
        // Показываем контент когда iframe загрузится
        this.iframe.onload = () => {
            setTimeout(() => {
                this.showContent();
                
                // Сообщаем сайту, что он в VK
                if (this.isVK) {
                    this.sendToSite({
                        type: 'VK_APP_INIT',
                        isVK: true,
                        timestamp: Date.now()
                    });
                }
            }, 1000);
        };
        
        // Fallback на случай проблем с загрузкой
        setTimeout(() => {
            this.showContent();
        }, 5000);
    }
    
    showContent() {
        this.loading.style.display = 'none';
        this.content.classList.remove('hidden');
    }
    
    setupBackButton() {
        this.backButton.addEventListener('click', () => {
            // Отправляем команду "назад" на сайт
            this.sendToSite({
                type: 'VK_BACK_ACTION'
            });
        });
        
        // Обработка системной кнопки "Назад" в VK
        if (this.isVK) {
            vkBridge.subscribe((e) => {
                if (e.detail.type === 'VKWebAppGoBack') {
                    this.sendToSite({
                        type: 'VK_BACK_ACTION'
                    });
                }
            });
        }
    }
    
    toggleBackButton(visible) {
        if (visible) {
            this.backButton.classList.remove('hidden');
        } else {
            this.backButton.classList.add('hidden');
        }
    }
    
    async shareContent(url) {
        if (this.isVK) {
            try {
                await vkBridge.send('VKWebAppShare', {
                    link: url || 'https://azimutmap.ru'
                });
            } catch (error) {
                console.error('Ошибка шаринга:', error);
            }
        } else {
            // Fallback для обычного браузера
            if (navigator.share) {
                navigator.share({
                    title: 'AzimutMap',
                    url: url || 'https://azimutmap.ru'
                });
            }
        }
    }
    
    closeApp() {
        if (this.isVK) {
            vkBridge.send('VKWebAppClose', {
                status: 'success'
            });
        }
    }
}

// Инициализация приложения когда DOM готов
document.addEventListener('DOMContentLoaded', () => {
    new VKApp();
});

// Обработка ошибок
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});