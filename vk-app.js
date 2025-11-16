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
            }
            
            // Загружаем карту с десктопным user-agent
            this.loadMapWithDesktopView();
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showMap();
        }
    }
    
    loadMapWithDesktopView() {
        // Создаем iframe с десктопным user-agent
        this.setDesktopUserAgent();
        
        this.iframe.onload = () => {
            console.log('Карта загружена');
            setTimeout(() => {
                this.showMap();
                this.injectFullscreenCSS();
            }, 2000);
        };
        
        // Fallback
        setTimeout(() => {
            this.showMap();
            this.injectFullscreenCSS();
        }, 5000);
    }
    
    setDesktopUserAgent() {
        // Пытаемся обмануть карты, что это десктоп
        Object.defineProperty(navigator, 'userAgent', {
            get: function() {
                return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            }
        });
        
        Object.defineProperty(navigator, 'platform', {
            get: function() {
                return 'Win32';
            }
        });
    }
    
    injectFullscreenCSS() {
        // Внедряем CSS прямо в iframe для принудительного полноэкранного режима
        try {
            const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
            const style = iframeDoc.createElement('style');
            style.textContent = `
                /* Принудительно скрываем все элементы управления Google Maps */
                .gm-style-mtc, 
                .gmnoprint, 
                .gm-control-active,
                .gm-svpc,
                .gm-style-moc,
                .gm-style-mot,
                [class*="gm-"],
                [aria-label*="карт"],
                [aria-label*="map"],
                [role="button"],
                button {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                }
                
                /* Основная карта на весь экран */
                #map, 
                [class*="map"],
                .gm-style,
                .gm-fullscreen,
                body, 
                html {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    overflow: hidden !important;
                }
                
                /* Скрываем все лишнее */
                header, footer, nav, .header, .footer, .navbar {
                    display: none !important;
                }
            `;
            iframeDoc.head.appendChild(style);
        } catch (e) {
            console.log('Не удалось внедрить CSS в iframe');
        }
    }
    
    showMap() {
        this.loading.classList.add('hidden');
        this.iframe.classList.remove('hidden');
        
        // Дополнительные стили для iframe
        this.iframe.style.width = '100vw';
        this.iframe.style.height = '100vh';
        this.iframe.style.position = 'fixed';
        this.iframe.style.top = '0';
        this.iframe.style.left = '0';
        this.iframe.style.zIndex = '9999';
        
        // Фокус на iframe
        setTimeout(() => {
            this.iframe.focus();
        }, 100);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new VKApp();
});
