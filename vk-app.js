// vk-integration.js - добавьте на azimutmap.ru
(function() {
    'use strict';
    
    // Проверяем, загружены ли мы в iframe
    const isInIframe = window.parent !== window;
    const isVK = navigator.userAgent.includes('VK') || 
                 document.referrer.includes('vk.com') ||
                 window.location.search.includes('vk=');
    
    if (isInIframe || isVK) {
        console.log('AzimutMap загружен в VK Mini App');
        
        // Адаптируем интерфейс для VK
        adaptForVK();
        
        // Сообщаем о успешной загрузке
        notifyParent();
    }
    
    function adaptForVK() {
        // Добавляем стили для полноэкранного режима
        const style = document.createElement('style');
        style.textContent = `
            /* Полноэкранный режим для VK */
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                overflow: hidden !important;
            }
            
            /* Карта на весь экран */
            #map, .map, [class*="map"], 
            .map-container, .google-map {
                width: 100vw !important;
                height: 100vh !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                border: none !important;
            }
            
            /* Скрываем лишние элементы для мобильного вида */
            @media (max-width: 768px) {
                header, footer, .header, .footer,
                .navbar, .ads, .advertisement {
                    display: none !important;
                }
            }
            
            /* Улучшаем touch-взаимодействие */
            .gm-style iframe {
                pointer-events: auto !important;
            }
        `;
        
        document.head.appendChild(style);
        
        // Удаляем любые ограничения размера
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        
        // Перезагружаем карту если нужно
        setTimeout(() => {
            if (typeof google !== 'undefined' && google.maps) {
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 1000);
            }
        }, 500);
    }
    
    function notifyParent() {
        // Сообщаем родительскому окну о загрузке
        const sendMessage = () => {
            try {
                window.parent.postMessage({
                    type: 'AZIMUTMAP_LOADED',
                    status: 'success',
                    timestamp: Date.now(),
                    url: window.location.href,
                    ready: true
                }, '*');
            } catch (error) {
                console.log('Не удалось отправить сообщение родителю');
            }
        };
        
        // Отправляем при загрузке и когда DOM готов
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', sendMessage);
        } else {
            sendMessage();
        }
        
        // Также отправляем когда страница полностью загружена
        window.addEventListener('load', sendMessage);
    }
})();
