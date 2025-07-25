# Fiverr Pinterest Generator 🎨

**Дюше от Дюши с Любовью! 💕**

Мощный генератор Pinterest контента для услуг Fiverr с интеграцией Claude AI. Создает оптимизированные посты, хэштеги и промпты для генерации изображений.

## 🚀 Особенности

- **Анализ услуг Fiverr** - Автоматический анализ страниц Fiverr
- **Оптимизация контента** - Генерация оптимизированных Pinterest постов
- **Хэштеги** - Автоматическое создание релевантных хэштегов
- **Промпты для AI** - Генерация промптов для Sora и Idiogramm
- **Партнерские ссылки** - Автоматическое создание партнерских ссылок
- **Пакетная обработка** - Обработка до 20 URL одновременно
- **Современный UI** - Темная/светлая тема, адаптивный дизайн

## 🌐 Развертывание

### GitHub Pages
Проект уже развернут на GitHub Pages: https://kilevoy.github.io/fiverr/

### Netlify (Рекомендуется)
Netlify предоставляет лучшую производительность и решает проблемы CORS благодаря серверным функциям:

1. **Регистрация на Netlify**
   - Перейдите на [netlify.com](https://netlify.com)
   - Войдите через GitHub аккаунт

2. **Подключение репозитория**
   - Нажмите "New site from Git"
   - Выберите репозиторий `kilevoy/fiverr`
   - Настройки:
     - Branch: `main`
     - Build command: (оставьте пустым)
     - Publish directory: (оставьте пустым)

3. **Автоматическое развертывание**
   - Netlify автоматически развернет сайт
   - Создаст URL типа `https://amazing-name-123456.netlify.app`
   - Каждый push в GitHub будет автоматически обновлять сайт

## 🔧 Решение проблем CORS

### Проблема
Claude API не разрешает прямые запросы из браузера (политика CORS).

### Решение на Netlify
Создана серверная функция `netlify/functions/claude-proxy.js` которая:
- Проксирует запросы к Claude API
- Добавляет правильные CORS заголовки
- Обрабатывает ошибки API

### Fallback для других хостингов
Для GitHub Pages и локальной разработки используются CORS прокси:
- cors-anywhere.herokuapp.com
- api.allorigins.win
- corsproxy.io
- cors.bridged.cc
- yacdn.org

## 📝 Использование

1. **Получить API ключ Claude**
   - Зарегистрируйтесь на [console.anthropic.com](https://console.anthropic.com)
   - Получите API ключ

2. **Настроить приложение**
   - Откройте приложение
   - Введите API ключ в настройках
   - Протестируйте соединение

3. **Генерировать контент**
   - Введите URL Fiverr услуги
   - Нажмите "Генерировать"
   - Получите оптимизированный контент

## 🛠️ Технические детали

### Структура проекта
```
├── index.html          # Главная страница
├── app.js              # Основная логика приложения
├── style.css           # Стили
├── script.js           # Вспомогательные скрипты
├── netlify.toml        # Конфигурация Netlify
├── package.json        # Зависимости Node.js
└── netlify/functions/
    └── claude-proxy.js # Серверная функция для Claude API
```

### Используемые технологии
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI**: Claude 3.5 Sonnet API
- **Hosting**: Netlify / GitHub Pages
- **Serverless**: Netlify Functions

### Кэширование
- Результаты кэшируются на 1 час
- Используется localStorage
- Автоматическая очистка устаревших данных

## 🔒 Безопасность

- API ключи хранятся только в localStorage
- Серверная функция не логирует чувствительные данные
- Все запросы проходят через HTTPS

## 🐛 Решение проблем

### Ошибка "CORS/Сеть"
- Используйте Netlify для полного решения CORS
- Проверьте интернет-соединение
- Отключите блокировщики рекламы

### Ошибка "Неверный API ключ"
- Проверьте правильность API ключа
- Убедитесь, что ключ активен
- Проверьте лимиты API

### Медленная работа
- Используйте Netlify для лучшей производительности
- Очистите кэш браузера
- Проверьте стабильность интернета

## 📊 Мониторинг

Приложение ведет детальное логирование:
- Запросы к API
- Ошибки и их типы
- Время выполнения операций
- Использование кэша

Откройте консоль разработчика (F12) для просмотра логов.

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте консоль браузера на ошибки
2. Убедитесь, что API ключ корректен
3. Попробуйте обновить страницу
4. Используйте Netlify для лучшей стабильности

## 📄 Лицензия

MIT License - свободное использование с указанием авторства.

---

**Создано с ❤️ для эффективной работы с Fiverr и Pinterest** 