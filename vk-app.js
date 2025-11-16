class VKApp {
    constructor() {
        this.isVK = typeof vkBridge !== 'undefined';
        this.loading = document.getElementById('loading');
        this.mapContainer = document.getElementById('mapContainer');
        this.mapFrame = document.getElementById('mapFrame');
        this.reloadButton = document.getElementById('reloadButton');
        
        // Прокси серверы (можно добавить несколько для надежности)
        this.proxyServers = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://corsproxy.io/?'
        ];
        
        this.currentProxyIndex = 0;
        
        this.init();
    }
    
    async init() {
        try {
            // Инициализация VK Bridge
            if (this.isVK) {
                await vkBridge.send('VKWebAppInit');
                console.log('VK Mini App инициализирован');
            }
            
            // Загружаем карту с обходом блокировки
            await this.loadMapWithBypass();
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showError('Ошибка загрузки приложения');
        }
    }
    
    async loadMapWithBypass() {
        try {
            console.log('Загрузка карты с обходом блокировки...');
            
            // Метод 1: Пытаемся загрузить через прокси
            const success = await this.tryProxyLoad();
            
            if (!success) {
                // Метод 2: Пытаемся загрузить напрямую с измененными параметрами
                await this.tryDirectLoad();
            }
            
        } catch (error) {
            console.error('Все методы загрузки не удались:', error);
            this.showError('Не удалось загрузить карты');
        }
    }
    
    async tryProxyLoad() {
        try {
            const proxyUrl = this.proxyServers[this.currentProxyIndex];
            const targetUrl = 'https://azimutmap.ru';
            
            console.log(`Попытка загрузки через прокси: ${proxyUrl}`);
            
            // Создаем iframe с проксированным URL
            this.mapFrame.src = proxyUrl + targetUrl;
            
            // Ждем загрузки
            await this.waitForFrameLoad(this.mapFrame);
            
            this.showMap();
            return true;
            
        } catch (error) {
            console.log(`Прокси ${this.currentProxyIndex} не сработал:`, error);
            
            // Пробуем следующий прокси
            this.currentProxyIndex++;
            if (this.currentProxyIndex < this.proxyServers.length) {
                return await this.tryProxyLoad();
            }
            
            return false;
        }
    }
    
    async tryDirectLoad() {
        try {
            console.log('Попытка прямой загрузки с обходом ограничений...');
            
            // Создаем iframe с вашим сайтом
            this.mapFrame.src = 'https://azimutmap.ru';
            
            // Добавляем обработчики для обхода ограничений
            this.addBypassHandlers();
            
            // Ждем загрузки с таймаутом
            await Promise.race([
                this.waitForFrameLoad(this.mapFrame),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 10000)
                )
            ]);
            
            this.showMap();
            return true;
            
        } catch (error) {
            console.log('Прямая загрузка не удалась:', error);
            throw error;
        }
    }
    
    addBypassHandlers() {
        // Перехватываем сообщения об ошибках
        window.addEventListener('error', (event) => {
            if (event.target === this.mapFrame) {
                console.log('Ошибка в iframe:', event);
            }
        });
        
        // Обрабатываем сообщения от iframe
        window.addEventListener('message', (event) => {
            if (event.source === this.mapFrame.contentWindow) {
                this.handleFrameMessage(event);
            }
        });
        
        // Периодически проверяем статус iframe
        this.startFrameHealthCheck();
    }
    
    handleFrameMessage(event) {
        console.log('Сообщение от iframe:', event.data);
        
        // Если iframe сообщает о блокировке, пробуем другой метод
        if (event.data && event.data.type === 'BLOCKED') {
            this.retryWithDifferentMethod();
        }
    }
    
    startFrameHealthCheck() {
        // Периодически проверяем, не заблокирован ли iframe
        const healthCheck = setInterval(() => {
            try {
                // Пытаемся получить доступ к содержимому iframe
                if (this.mapFrame.contentWindow && 
                    this.mapFrame.contentWindow.location.href) {
                    // Iframe доступен
                    console.log('Iframe health: OK');
                }
            } catch (error) {
                // Iframe заблокирован
                console.log('Iframe заблокирован:', error);
                clearInterval(healthCheck);
                this.retryWithDifferentMethod();
            }
        }, 5000);
    }
    
    async retryWithDifferentMethod() {
        console.log('Повторная попытка загрузки другим методом...');
        
        // Показываем кнопку перезагрузки
        this.reloadButton.classList.remove('hidden');
        
        // Обработчик кнопки перезагрузки
        this.reloadButton.onclick = () => {
            this.reloadButton.classList.add('hidden');
            this.loadMapWithBypass();
        };
    }
    
    waitForFrameLoad(frame) {
        return new Promise((resolve, reject) => {
            const onLoad = () => {
                frame.removeEventListener('load', onLoad);
                frame.removeEventListener('error', onError);
                resolve();
            };
            
            const onError = () => {
                frame.removeEventListener('load', onLoad);
                frame.removeEventListener('error', onError);
                reject(new Error('Frame load error'));
            };
            
            frame.addEventListener('load', onLoad);
            frame.addEventListener('error', onError);
            
            // Если iframe уже загружен
            if (frame.contentDocument && frame.contentDocument.readyState === 'complete') {
                resolve();
            }
        });
    }
    
    showMap() {
        console.log('Показываем карту...');
        this.loading.classList.add('hidden');
        this.mapContainer.classList.remove('hidden');
        this.reloadButton.classList.add('hidden');
        
        // Фокус на iframe для работы с картой
        setTimeout(() => {
            try {
                this.mapFrame.focus();
            } catch (error) {
                console.log('Не удалось установить фокус на iframe');
            }
        }, 1000);
    }
    
    showError(message) {
        this.loading.classList.add('hidden');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h3>Ошибка</h3>
                <p>${message}</p>
                <button onclick="location.reload()">Перезагрузить</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new VKApp();
});

// Глобальные обработчики ошибок
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
