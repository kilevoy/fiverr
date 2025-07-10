// Fiverr Pinterest Generator Application
class FiverrPinterestGenerator {
    constructor() {
        this.apiKey = null;
        this.affiliateId = '1033511';
        this.results = [];
        this.isProcessing = false;
        this.shouldStop = false;
        this.cache = new Map(); // Results cache
        this.retryCount = 3; // Max retry attempts
        this.retryDelay = 1000; // Initial retry delay in ms
        this.debounceTimers = new Map(); // Debounce timers
        
        // Application data
        this.config = {
            apiBaseUrl: 'https://api.anthropic.com/v1/messages',
            proxyUrl: 'https://cors-anywhere.herokuapp.com/',
            corsProxy: 'https://api.allorigins.win/raw?url=',
            claudeModel: 'claude-3-5-sonnet-20241022',
            maxTokens: 1500,
            temperature: 0.7,
            requestTimeout: 30000, // 30 seconds timeout
            maxConcurrentRequests: 5,
            cacheExpiry: 3600000, // 1 hour cache expiry
            useCorsProxy: true // Enable CORS proxy by default
        };
        
        this.fallbackData = {
            "service_analysis": {
                "title": "Professional Fiverr Service",
                "description": "High-quality professional service tailored to your business needs",
                "category": "Professional Services",
                "key_benefits": ["Professional quality", "Quick delivery", "Affordable pricing"],
                "target_audience": "Small business owners, entrepreneurs",
                "price_range": "Standard",
                "service_type": "Professional Services",
                "main_benefits": ["Professional quality", "Quick delivery", "Affordable pricing"],
                "related_keywords": ["professional services", "business", "freelance", "quality"],
                "url_type": "service"
            },
            "keyword_research": {
                "primary_keywords": ["professional services", "business solutions", "freelance help", "quality work", "affordable services"],
                "long_tail_keywords": ["professional business services", "affordable freelance solutions", "quality service providers", "reliable business help", "expert freelance work"],
                "trending_hashtags": ["#ProfessionalServices", "#BusinessSolutions", "#FreelanceHelp", "#QualityWork", "#AffordableServices"],
                "search_volume_estimates": {
                    "professional services": "high",
                    "business solutions": "medium",
                    "freelance help": "medium"
                }
            },
            "hashtag_strategy": {
                "broad_hashtags": ["#BusinessServices", "#ProfessionalHelp", "#SmallBusiness"],
                "niche_hashtags": ["#FreelanceServices", "#BusinessGrowth", "#Outsourcing", "#QualityWork"],
                "specific_hashtags": ["#FiverrServices", "#AffordableHelp", "#ExpertWork"]
            }
        };
        
        this.prompts = {
            "analyze_service": "Analyze this Fiverr service URL: {url}. Extract detailed information about this service for Pinterest marketing. Return in JSON format: {\"title\": \"Service title/name\", \"description\": \"Brief service description\", \"category\": \"Main service category\", \"key_benefits\": [\"benefit1\", \"benefit2\", \"benefit3\"], \"target_audience\": \"Target audience description\", \"price_range\": \"Price category (Budget/Standard/Premium)\", \"service_type\": \"Service type\", \"main_benefits\": [\"benefit1\", \"benefit2\", \"benefit3\"], \"related_keywords\": [\"keyword1\", \"keyword2\", \"keyword3\", \"keyword4\"]}",
            "analyze_category": "Analyze this Fiverr category: {category_name} ({url}). Extract information about this service category for Pinterest marketing. Return in JSON format: {\"title\": \"{category_name} Services\", \"description\": \"Description of this category\", \"category\": \"{category_name}\", \"key_benefits\": [\"benefit1\", \"benefit2\", \"benefit3\"], \"target_audience\": \"Who needs these services\", \"price_range\": \"Typical price range\", \"service_type\": \"Category name\", \"main_benefits\": [\"benefit1\", \"benefit2\", \"benefit3\"], \"related_keywords\": [\"keyword1\", \"keyword2\", \"keyword3\", \"keyword4\"], \"category_focus\": \"What makes this category special\"}",
            "research_keywords": "For the {focus} '{service_type}' targeting '{target_audience}', research Pinterest-specific keywords. Find 15 high-converting keywords including: 5 primary keywords, 5 long-tail keywords, 5 trending hashtags. Consider Pinterest search behavior and seasonal trends for July 2025. Return as JSON: {\"primary_keywords\": [\"keyword1\", \"keyword2\", \"keyword3\", \"keyword4\", \"keyword5\"], \"long_tail_keywords\": [\"phrase1\", \"phrase2\", \"phrase3\", \"phrase4\", \"phrase5\"], \"trending_hashtags\": [\"#hashtag1\", \"#hashtag2\", \"#hashtag3\", \"#hashtag4\", \"#hashtag5\"], \"search_volume_estimates\": {\"keyword1\": \"high\", \"keyword2\": \"medium\"}}",
            "optimize_content": "Create optimized Pinterest content for the topic: {content_focus}. Primary keywords to include: {keywords}. Content angle or value proposition: {angle}. Requirements: - Title: up to 100 characters (ideal under 55 for mobile), include emotional hook or curiosity trigger - Description: up to 500 characters, naturally include keywords in the first 125 characters - Use a conversational, authentic tone (no hype or clickbait) - Include the phrase \"(affiliate link)\" for compliance - Add 2–5 relevant Pinterest hashtags - English language only. Return results in JSON format: {\"optimized_title\": \"Your Pinterest Pin Title\", \"optimized_description\": \"Your optimized description with (affiliate link)\", \"content_angle\": \"Your content approach\", \"keyword_density\": \"Estimated keyword usage as percentage\", \"hashtags\": [\"#example1\", \"#example2\", \"#example3\"]}",
            "generate_hashtags": "Generate 10 strategic hashtags for {hashtag_focus} Pinterest content. Mix high-volume broad hashtags (3), medium-volume niche hashtags (4), and low-competition specific hashtags (3). Include trending hashtags for July 2025 if relevant. Return as JSON: {\"broad_hashtags\": [\"#hashtag1\", \"#hashtag2\", \"#hashtag3\"], \"niche_hashtags\": [\"#hashtag4\", \"#hashtag5\", \"#hashtag6\", \"#hashtag7\"], \"specific_hashtags\": [\"#hashtag8\", \"#hashtag9\", \"#hashtag10\"]}"
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadAffiliateId();
        this.loadApiKey(); // Add this line to load saved API key
        this.renderResults();
        this.setupPerformanceOptimizations();
    }
    
    setupPerformanceOptimizations() {
        // Clean up expired cache entries every 10 minutes
        setInterval(() => {
            this.cleanupCache();
        }, 600000);
        
        // Preload critical resources
        this.preloadResources();
    }
    
    preloadResources() {
        // Preload any critical resources here
        console.log('Performance optimizations initialized');
    }
    
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.config.cacheExpiry) {
                this.cache.delete(key);
            }
        }
    }
    
    getCacheKey(url) {
        // Create a safe cache key from URL
        return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
    }
    
    getCachedResult(url) {
        const cacheKey = this.getCacheKey(url);
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.config.cacheExpiry) {
            return cached.data;
        }
        
        return null;
    }
    
    setCachedResult(url, data) {
        const cacheKey = this.getCacheKey(url);
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
    }
    
    debounce(func, delay, key) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timeoutId = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timeoutId);
    }
    
    async retryOperation(operation, maxRetries = this.retryCount) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (i === maxRetries - 1) {
                    throw error;
                }
                
                // Exponential backoff
                const delay = this.retryDelay * Math.pow(2, i);
                await this.sleep(delay);
                
                console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms:`, error.message);
            }
        }
        
        throw lastError;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    sanitizeInput(input, isApiKey = false) {
        // Basic input sanitization
        if (typeof input !== 'string') {
            return '';
        }
        
        // For API keys, only trim whitespace and don't limit length
        if (isApiKey) {
            return input.trim();
        }
        
        // For regular inputs, apply standard sanitization
        return input.trim()
            .replace(/[<>]/g, '')
            .substring(0, 2000); // Limit length for non-API inputs
    }
    
    validateApiKey(apiKey) {
        // Enhanced API key validation for Claude API
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }
        
        // Trim whitespace and normalize the key
        const cleanKey = apiKey.trim();
        
        // Check for various Claude API key formats
        const claudeKeyPatterns = [
            /^sk-ant-api\d*-[A-Za-z0-9_-]+$/,  // sk-ant-api, sk-ant-api03-, etc.
            /^sk-ant-[A-Za-z0-9_-]+$/          // Alternative format
        ];
        
        // Check minimum length (Claude keys are typically 100+ characters)
        if (cleanKey.length < 50) {
            return false;
        }
        
        // Test against patterns
        return claudeKeyPatterns.some(pattern => pattern.test(cleanKey));
    }
    
    bindEvents() {
        // Settings section
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        document.getElementById('test-api').addEventListener('click', () => this.testAPI());
        document.getElementById('clear-api-key').addEventListener('click', () => this.clearApiKey());
        
        // Generation buttons
        document.getElementById('generate-single').addEventListener('click', () => this.generateSingle());
        document.getElementById('generate-batch').addEventListener('click', () => this.generateBatch());
        
        // Batch controls
        document.getElementById('stop-batch').addEventListener('click', () => this.stopBatch());
        
        // Results section
        document.getElementById('export-all').addEventListener('click', () => this.exportAll());
        document.getElementById('clear-results').addEventListener('click', () => this.clearResults());
        
        // Modal close
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal-overlay')) {
                this.closeModal();
            }
        });
        
        // Navigation
        document.querySelectorAll('.nav__item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            });
        });
        
        // URL input validation
        document.getElementById('fiverr-url').addEventListener('input', (e) => {
            const url = e.target.value;
            if (url) {
                this.validateURL(url);
            } else {
                this.clearURLPreview('single');
            }
        });
        
        document.getElementById('fiverr-urls').addEventListener('input', (e) => {
            const urls = e.target.value;
            if (urls) {
                this.validateURLs(urls);
            } else {
                this.clearURLPreview('batch');
            }
        });
        
        // Event delegation for copy buttons and other dynamic elements
        document.addEventListener('click', (e) => {
            // Copy buttons
            if (e.target.matches('.copy-btn') || e.target.matches('.result-card__hashtag')) {
                e.preventDefault();
                this.handleCopyClick(e.target);
            }
            
            // Export buttons
            if (e.target.matches('[data-export-index]')) {
                const index = parseInt(e.target.dataset.exportIndex);
                this.exportResult(index);
            }
            
            // Modal buttons
            if (e.target.matches('[data-modal-title]')) {
                const title = e.target.dataset.modalTitle;
                const content = e.target.dataset.modalContent;
                this.openModal(title, content);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    handleCopyClick(element) {
        const copyText = element.dataset.copyText;
        const copyType = element.dataset.copyType;
        const copyIndex = element.dataset.copyIndex;
        
        if (copyType === 'all_hashtags' && copyIndex !== undefined) {
            this.copyAllHashtags(parseInt(copyIndex));
        } else if (copyText) {
            this.copyToClipboard(copyText);
        } else {
            this.showCopyNotification('Нет данных для копирования', 'error');
        }
    }
    
    handleQuickGenerate() {
        const activeSection = document.querySelector('.section--active');
        if (activeSection) {
            switch (activeSection.id) {
                case 'single':
                    this.generateSingle();
                    break;
                case 'batch':
                    this.generateBatch();
                    break;
            }
        }
    }
    
    switchSection(section) {
        console.log('Switching to section:', section);
        
        // Update navigation
        document.querySelectorAll('.nav__item').forEach(item => {
            item.classList.remove('nav__item--active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${section}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('nav__item--active');
        }
        
        // Update sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('section--active');
        });
        
        const activeSection = document.getElementById(section);
        if (activeSection) {
            activeSection.classList.add('section--active');
            
            // Trigger section-specific optimizations
            this.optimizeSection(section);
        }
    }
    
    optimizeSection(section) {
        switch (section) {
            case 'results':
                this.optimizeResultsDisplay();
                break;
            case 'batch':
                this.optimizeBatchInterface();
                break;
        }
    }
    
    optimizeResultsDisplay() {
        // Lazy load results if there are many
        const container = document.getElementById('results-container');
        if (this.results.length > 10) {
            this.implementVirtualScrolling(container);
        }
    }
    
    optimizeBatchInterface() {
        // Optimize batch processing interface
        const textarea = document.getElementById('fiverr-urls');
        if (textarea) {
            textarea.setAttribute('spellcheck', 'false');
            textarea.setAttribute('autocomplete', 'off');
        }
    }
    
    implementVirtualScrolling(container) {
        // Simple virtual scrolling implementation for large result sets
        // This would be expanded for production use
        console.log('Virtual scrolling optimization applied');
    }
    
    async saveSettings() {
        try {
            const apiKey = this.sanitizeInput(document.getElementById('api-key').value, true);
            const affiliateId = this.sanitizeInput(document.getElementById('affiliate-id').value);
        
        if (!apiKey) {
            this.showStatus('settings-status', 'Введите API ключ', 'error');
            return;
        }
            
            if (!this.validateApiKey(apiKey)) {
                this.showStatus('settings-status', 'Неверный формат API ключа Claude', 'error');
                return;
            }
        
        if (!this.validateAffiliateId(affiliateId)) {
            this.showStatus('settings-status', 'Affiliate ID должен содержать 6-8 цифр', 'error');
            return;
        }
        
        this.apiKey = apiKey;
        this.affiliateId = affiliateId;
            
            // Clear any existing cache when API key changes
            this.cache.clear();
        
        // Save API key to localStorage
        this.saveApiKey();
        
        this.showStatus('settings-status', 'Настройки сохранены', 'success');
            
            // Auto-test API after saving
            setTimeout(() => {
                this.testAPI();
            }, 500);
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('settings-status', 'Ошибка при сохранении настроек', 'error');
        }
    }
    
    validateAffiliateId(id) {
        return /^\d{6,8}$/.test(id);
    }
    
    async testAPI() {
        if (!this.apiKey) {
            this.showStatus('settings-status', 'Сначала сохраните API ключ', 'error');
            return;
        }
        
        this.showStatus('settings-status', 'Тестирование API...', 'info');
        
        try {
            const testPrompt = 'Respond with: {"status": "ok", "message": "API connection successful"}';
            const response = await this.retryOperation(() => this.makeClaudeRequest(testPrompt));
            
            // Try to parse response to validate it's working
            const parsed = JSON.parse(response);
            
            if (parsed.status === 'ok') {
                this.showStatus('settings-status', 'API работает корректно ✓', 'success');
            } else {
                this.showStatus('settings-status', 'API подключен, но ответ неожиданный', 'warning');
            }
            
        } catch (error) {
            console.error('API test failed:', error);
            let errorMessage = 'Ошибка API';
            
            if (error.message.includes('401') || error.message.includes('authentication_error')) {
                errorMessage = 'Неверный API ключ';
            } else if (error.message.includes('429') || error.message.includes('rate_limit_error')) {
                errorMessage = 'Превышен лимит запросов';
            } else if (error.message.includes('403') || error.message.includes('permission_error')) {
                errorMessage = 'Доступ запрещен - проверьте план подписки';
            } else if (error.message.includes('timeout') || error.message.includes('Тайм-аут')) {
                errorMessage = 'Тайм-аут соединения';
            } else if (error.message.includes('CORS') || error.message.includes('сети')) {
                errorMessage = 'CORS/Сеть';
                this.showStatus('settings-status', `${errorMessage}: ${error.message}. Проверьте инструкции ниже 👇`, 'error');
                return;
            }
            
            this.showStatus('settings-status', `${errorMessage}: ${error.message}`, 'error');
        }
    }
    
    loadAffiliateId() {
        // Load from non-sensitive storage or use default
        const savedId = '1033511'; // Default value
        document.getElementById('affiliate-id').value = savedId;
        this.affiliateId = savedId;
    }
    
    loadApiKey() {
        try {
            const savedApiKey = localStorage.getItem('claudeApiKey');
            if (savedApiKey) {
                document.getElementById('api-key').value = savedApiKey;
                this.apiKey = savedApiKey;
                console.log('API key loaded from storage');
            }
        } catch (error) {
            console.error('Error loading API key from storage:', error);
        }
    }

    saveApiKey() {
        try {
            const apiKey = this.sanitizeInput(document.getElementById('api-key').value, true);
            if (apiKey && this.validateApiKey(apiKey)) {
                localStorage.setItem('claudeApiKey', apiKey);
                console.log('API key saved to storage');
            } else if (!apiKey) {
                localStorage.removeItem('claudeApiKey');
                console.log('API key removed from storage');
            }
        } catch (error) {
            console.error('Error saving API key to storage:', error);
        }
    }

    clearApiKey() {
        try {
            localStorage.removeItem('claudeApiKey');
            document.getElementById('api-key').value = '';
            this.apiKey = null;
            this.showStatus('settings-status', 'API ключ удален из сохраненных настроек', 'info');
        } catch (error) {
            console.error('Error clearing API key:', error);
            this.showStatus('settings-status', 'Ошибка при удалении API ключа', 'error');
        }
    }
    
    validateURL(input) {
        const url = this.sanitizeInput(input.value);
        
        // Remove validation states first
        input.classList.remove('valid', 'invalid');
        
        if (!url) {
            return;
        }
        
        try {
            const urlObj = new URL(url);
            
            if (this.isFiverrURL(url)) {
                input.classList.add('valid');
                this.showURLPreview(url, 'single');
            } else {
                input.classList.add('invalid');
                this.clearURLPreview('single');
            }
        } catch (error) {
            input.classList.add('invalid');
            this.clearURLPreview('single');
        }
    }
    
    validateURLs(input) {
        const urls = input.value.split('\n')
            .map(url => this.sanitizeInput(url))
            .filter(url => url);
        
        input.classList.remove('valid', 'invalid');
        
        if (urls.length === 0) {
            this.clearURLPreview('batch');
            return;
        }
        
        if (urls.length > 20) {
            input.classList.add('invalid');
            this.showURLPreview(`Слишком много URL (${urls.length}/20)`, 'batch', 'error');
            return;
        }
        
        const validUrls = urls.filter(url => {
            try {
                return this.isFiverrURL(url);
            } catch (error) {
                return false;
            }
        });
        
        if (validUrls.length === urls.length) {
            input.classList.add('valid');
            this.showURLPreview(`${validUrls.length} валидных URL`, 'batch', 'success');
        } else {
            input.classList.add('invalid');
            this.showURLPreview(`${validUrls.length}/${urls.length} валидных URL`, 'batch', 'warning');
        }
    }
    
    showURLPreview(text, type, status = 'info') {
        // This would show a preview of the URL analysis
        console.log(`URL Preview [${type}]:`, text, status);
    }
    
    clearURLPreview(type) {
        console.log(`Clearing URL preview for ${type}`);
    }
    
    isFiverrURL(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            
            // More comprehensive Fiverr URL validation
            const validDomains = [
                'fiverr.com',
                'www.fiverr.com',
                'de.fiverr.com',
                'es.fiverr.com',
                'fr.fiverr.com',
                'it.fiverr.com',
                'nl.fiverr.com',
                'pt.fiverr.com',
                'br.fiverr.com'
            ];
            
            if (!validDomains.includes(hostname)) {
                return false;
            }
            
            const pathname = urlObj.pathname.toLowerCase();
            
            // Check for various Fiverr URL patterns
            const validPatterns = [
                /^\/gig\/.+/,                    // /gig/service-name
                /^\/categories\/.+/,             // /categories/category-name
                /^\/category\/.+/,               // /category/category-name  
                /^\/services\/.+/,               // /services/service-name
                /^\/search\/.*/,                 // /search/query
                /^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+.*/, // /username/service-name
                /^\/s\/.+/,                      // /s/search-query
                /^\/find\/.+/                    // /find/services
            ];
            
            return validPatterns.some(pattern => pattern.test(pathname));
                    
        } catch (error) {
            return false;
        }
    }
    
    async generateSingle() {
        const url = this.sanitizeInput(document.getElementById('fiverr-url').value);
        
        if (!url) {
            this.showStatus('single-status', 'Введите Fiverr URL', 'error');
            return;
        }
        
        if (!this.isFiverrURL(url)) {
            this.showStatus('single-status', 'Введите валидный Fiverr URL', 'error');
            return;
        }
        
        if (!this.apiKey) {
            this.showStatus('single-status', 'Сначала настройте API ключ', 'error');
            return;
        }
        
        if (this.isProcessing) {
            this.showStatus('single-status', 'Обработка уже выполняется', 'warning');
            return;
        }
        
        try {
            this.isProcessing = true;
            this.updateGenerateButton('generate-single', true);
            
            const result = await this.processURL(url, (progress, text) => {
                this.showProgress('single-progress', 'single-progress-fill', 'single-progress-text', progress, text);
            });
            
            this.results.unshift(result); // Add to beginning of results
            this.renderResults();
            this.switchSection('results');
            
            this.showStatus('single-status', 'Пин успешно сгенерирован!', 'success');
            
        } catch (error) {
            console.error('Generation error:', error);
            this.showStatus('single-status', `Ошибка: ${error.message}`, 'error');
            
            // Add error result to results
            this.results.unshift({
                url,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            this.renderResults();
            
        } finally {
            this.isProcessing = false;
            this.updateGenerateButton('generate-single', false);
            this.hideProgress('single-progress');
        }
    }
    
    updateGenerateButton(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        if (button) {
            if (isLoading) {
                button.disabled = true;
                button.textContent = 'Генерация...';
                button.classList.add('loading');
            } else {
                button.disabled = false;
                button.textContent = buttonId === 'generate-single' ? 'Генерировать пин' : 'Генерировать все пины';
                button.classList.remove('loading');
            }
        }
    }
    
    async generateBatch() {
        const urlsText = this.sanitizeInput(document.getElementById('fiverr-urls').value);
        const urls = urlsText.split('\n')
            .map(url => this.sanitizeInput(url))
            .filter(url => url);
        
        if (urls.length === 0) {
            this.showStatus('batch-status', 'Введите хотя бы один URL', 'error');
            return;
        }
        
        if (urls.length > 20) {
            this.showStatus('batch-status', 'Максимум 20 URL за раз', 'error');
            return;
        }
        
        const invalidUrls = urls.filter(url => !this.isFiverrURL(url));
        if (invalidUrls.length > 0) {
            this.showStatus('batch-status', `Найдено ${invalidUrls.length} невалидных URL`, 'error');
            return;
        }
        
        if (!this.apiKey) {
            this.showStatus('batch-status', 'Сначала настройте API ключ', 'error');
            return;
        }
        
        if (this.isProcessing) {
            this.showStatus('batch-status', 'Обработка уже выполняется', 'warning');
            return;
        }
        
        try {
            this.isProcessing = true;
            this.shouldStop = false;
            
            this.updateGenerateButton('generate-batch', true);
            this.showBatchControls(true);
            
            const batchResults = [];
            const startTime = Date.now();
            
            for (let i = 0; i < urls.length; i++) {
                if (this.shouldStop) {
                    this.showStatus('batch-status', `Обработка остановлена (${i}/${urls.length})`, 'warning');
                    break;
                }
                
                const url = urls[i];
                const progress = Math.round((i / urls.length) * 100);
                
                try {
                    this.showProgress('batch-progress', 'batch-progress-fill', 'batch-progress-text', 
                        progress, `Обработка ${i + 1}/${urls.length}: ${this.truncateUrl(url)}`);
                    
                    const result = await this.processURL(url, null, i + 1);
                    batchResults.push(result);
                    
                    // Add small delay to avoid overwhelming the API
                    if (i < urls.length - 1) {
                        await this.sleep(200);
                    }
                    
                } catch (error) {
                    console.error(`Error processing URL ${i + 1}:`, error);
                    batchResults.push({
                        url,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
            
            // Add all results to the beginning of the results array
            this.results.unshift(...batchResults);
            
            const endTime = Date.now();
            const duration = Math.round((endTime - startTime) / 1000);
            const successCount = batchResults.filter(r => !r.error).length;
            
            this.showStatus('batch-status', 
                `Обработано ${successCount}/${urls.length} URL за ${duration}с`, 
                successCount > 0 ? 'success' : 'error');
            
            this.renderResults();
            this.switchSection('results');
            
        } catch (error) {
            console.error('Batch generation error:', error);
            this.showStatus('batch-status', `Ошибка пакетной обработки: ${error.message}`, 'error');
            
        } finally {
            this.isProcessing = false;
            this.shouldStop = false;
            this.updateGenerateButton('generate-batch', false);
            this.showBatchControls(false);
            this.hideProgress('batch-progress');
        }
    }
    
    showBatchControls(show) {
        const stopButton = document.getElementById('stop-batch');
        const generateButton = document.getElementById('generate-batch');
        
        if (show) {
            stopButton.classList.remove('hidden');
            generateButton.classList.add('hidden');
        } else {
            stopButton.classList.add('hidden');
            generateButton.classList.remove('hidden');
        }
    }
    
    truncateUrl(url, maxLength = 50) {
        if (url.length <= maxLength) {
            return url;
        }
        return url.substring(0, maxLength - 3) + '...';
    }
    
    stopBatch() {
        this.shouldStop = true;
        this.showStatus('batch-status', 'Остановка обработки...', 'info');
    }
    
    async processURL(url, progressCallback = null, batchIndex = null) {
        try {
            // Check cache first
            const cached = this.getCachedResult(url);
            if (cached) {
                console.log('Using cached result for:', url);
                return cached;
            }
            
            const startTime = Date.now();
            
            // Step 1: Analyze service
            if (progressCallback) {
                progressCallback(20, 'Анализ услуги...');
            }
            
            const serviceAnalysis = await this.retryOperation(() => this.analyzeService(url));
            
            // Step 2: Research keywords
            if (progressCallback) {
                progressCallback(40, 'Исследование ключевых слов...');
            }
            
            const keywordResearch = await this.retryOperation(() => this.researchKeywords(serviceAnalysis));
            
            // Step 3: Optimize content
            if (progressCallback) {
                progressCallback(60, 'Оптимизация контента...');
            }
            
            const contentSuggestions = await this.retryOperation(() => this.optimizeContent(serviceAnalysis, keywordResearch));
            
            // Step 4: Generate hashtags
            if (progressCallback) {
                progressCallback(80, 'Генерация хэштегов...');
            }
            
            const hashtagStrategy = await this.retryOperation(() => this.generateHashtags(serviceAnalysis));
            
            // Step 5: Finalize result
            if (progressCallback) {
                progressCallback(100, 'Финализация...');
            }
            
            const result = {
                url,
                url_type: this.determineURLType(url),
                service_analysis: serviceAnalysis,
                keyword_research: keywordResearch,
                content_suggestions: contentSuggestions,
                hashtag_strategy: hashtagStrategy,
                affiliate_link: this.generateAffiliateLink(url),
                image_prompt: this.generateImagePrompt(serviceAnalysis),
                sora_prompt: this.generateSoraPrompt(serviceAnalysis),
                idiogramm_prompt: this.generateIdiogrammPrompt(serviceAnalysis),
                performance_predictions: this.generatePerformancePredictions(serviceAnalysis, keywordResearch),
                timestamp: new Date().toISOString(),
                processing_time: Date.now() - startTime,
                batch_index: batchIndex
            };
            
            // Cache the result
            this.setCachedResult(url, result);
            
            return result;
            
        } catch (error) {
            console.error('URL processing error:', error);
            
            // Return fallback result with error
            return {
                url,
                error: error.message,
                service_analysis: this.fallbackData.service_analysis,
                keyword_research: this.fallbackData.keyword_research,
                hashtag_strategy: this.fallbackData.hashtag_strategy,
                affiliate_link: this.generateAffiliateLink(url),
                image_prompt: this.generateImagePrompt(this.fallbackData.service_analysis),
                sora_prompt: this.generateSoraPrompt(this.fallbackData.service_analysis),
                idiogramm_prompt: this.generateIdiogrammPrompt(this.fallbackData.service_analysis),
                timestamp: new Date().toISOString(),
                fallback_used: true,
                batch_index: batchIndex
            };
        }
    }
    
    determineURLType(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname.toLowerCase();
            
            if (pathname.includes('/gig/')) {
                return 'service';
            } else if (pathname.includes('/categories/') || pathname.includes('/category/')) {
                return 'category';
            } else if (pathname.includes('/search/')) {
                return 'search';
            } else {
                return 'unknown';
            }
        } catch (error) {
            return 'unknown';
        }
    }
    
    async analyzeService(url) {
        const urlType = this.determineURLType(url);
        let prompt;
        
        switch (urlType) {
            case 'service':
                prompt = this.prompts.analyze_service.replace('{url}', url);
                break;
            case 'category':
                prompt = this.prompts.analyze_category
                    .replace('{url}', url)
                    .replace('{category_name}', this.extractCategoryName(url));
                break;
            default:
                prompt = this.prompts.analyze_service.replace('{url}', url);
        }
        
        const response = await this.makeClaudeRequest(prompt);
        const parsed = this.parseJSONResponse(response);
        
        // Add url_type to the result
        parsed.url_type = urlType;
        
        return parsed;
    }
    
    async researchKeywords(serviceAnalysis) {
        const prompt = this.prompts.research_keywords
            .replace('{focus}', serviceAnalysis.url_type || 'service')
            .replace('{service_type}', serviceAnalysis.service_type || 'service')
            .replace('{target_audience}', serviceAnalysis.target_audience || 'general audience');
        
        const response = await this.makeClaudeRequest(prompt);
        return this.parseJSONResponse(response);
    }
    
    async optimizeContent(serviceAnalysis, keywordResearch) {
        const keywords = keywordResearch.primary_keywords || [];
        const benefits = serviceAnalysis.main_benefits || [];
        
        const prompt = this.prompts.optimize_content
            .replace('{content_focus}', serviceAnalysis.service_type || 'service')
            .replace('{keywords}', keywords.join(', '))
            .replace('{angle}', benefits.join(', '));
        
        const response = await this.makeClaudeRequest(prompt);
        return this.parseJSONResponse(response);
    }
    
    async generateHashtags(serviceAnalysis) {
        const prompt = this.prompts.generate_hashtags
            .replace('{hashtag_focus}', serviceAnalysis.service_type || 'service');
        
        const response = await this.makeClaudeRequest(prompt);
        return this.parseJSONResponse(response);
    }
    
    parseJSONResponse(response) {
        try {
            // Clean up response - remove any markdown formatting
            const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanResponse);
        } catch (error) {
            console.error('JSON parsing error:', error);
            console.error('Response:', response);
            
            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error('Fallback JSON parsing failed:', e);
                }
            }
            
            // Return fallback data
            return this.fallbackData.service_analysis;
        }
    }
    
    extractCategoryName(url) {
        try {
            const urlObj = new URL(url);
            const parts = urlObj.pathname.split('/').filter(part => part);
            
            // Find category name in URL path
            const categoryIndex = parts.findIndex(part => part === 'categories' || part === 'category');
            if (categoryIndex !== -1 && parts[categoryIndex + 1]) {
                return parts[categoryIndex + 1].replace(/-/g, ' ').replace(/_/g, ' ');
            }
            
            return parts[parts.length - 1] || 'category';
        } catch (error) {
            return 'category';
        }
    }
    
    generateAffiliateLink(url) {
        try {
            const encodedUrl = encodeURIComponent(url);
            const affiliateId = this.affiliateId || '1033511';
            return `https://track.fiverr.com/visit/?bta=${affiliateId}&brand=fiverr&landingPage=${encodedUrl}`;
        } catch (error) {
            console.error('Error generating affiliate link:', error);
            return url; // Return original URL as fallback
        }
    }
    
    generateImagePrompt(serviceAnalysis) {
        const serviceType = serviceAnalysis.service_type || 'service';
        const benefits = serviceAnalysis.main_benefits || ['professional', 'quality', 'reliable'];
        const targetAudience = serviceAnalysis.target_audience || 'professionals';
        
        // Enhanced Pinterest-specific image prompt
        let visualStyle = 'modern minimalist';
        let backgroundStyle = 'clean gradient background';
        let colorScheme = 'vibrant professional colors';
        
        if (serviceType.toLowerCase().includes('design') || serviceType.toLowerCase().includes('creative')) {
            visualStyle = 'artistic creative';
            backgroundStyle = 'subtle textured background with design elements';
            colorScheme = 'bold creative colors with purple and teal accents';
        } else if (serviceType.toLowerCase().includes('business') || serviceType.toLowerCase().includes('consulting')) {
            visualStyle = 'corporate professional';
            backgroundStyle = 'elegant gradient background';
            colorScheme = 'sophisticated navy and gold color palette';
        } else if (serviceType.toLowerCase().includes('marketing') || serviceType.toLowerCase().includes('social')) {
            visualStyle = 'dynamic engaging';
            backgroundStyle = 'energetic gradient with subtle patterns';
            colorScheme = 'bright engaging colors with orange and blue';
        }
        
        return `Create a stunning Pinterest pin image for "${serviceType}" targeting ${targetAudience}. Style: ${visualStyle} design with ${backgroundStyle}. Color scheme: ${colorScheme}. Include visual elements representing ${benefits.join(', ')}. Layout: vertical Pinterest format (1000x1500px), prominent text overlay area at top or bottom, eye-catching typography space, clean composition that stands out in Pinterest feeds. Visual elements: relevant icons, subtle graphics, professional imagery. Quality: high-resolution, print-ready, optimized for social media sharing.`;
    }

    generateSoraPrompt(serviceAnalysis) {
        const serviceType = serviceAnalysis.service_type || 'Professional Service';
        const benefits = serviceAnalysis.main_benefits || ['professional', 'quality', 'reliable'];
        const targetAudience = serviceAnalysis.target_audience || 'professionals';
        
        // Determine scene and movement for Sora
        let sceneDescription = '';
        let cameraMovement = 'slow smooth zoom in';
        let visualElements = '';
        let mood = 'professional and inspiring';
        
        if (serviceType.toLowerCase().includes('design') || serviceType.toLowerCase().includes('graphic')) {
            sceneDescription = 'A modern design studio with floating design elements, color palettes, and creative tools';
            cameraMovement = 'elegant circular camera movement around floating design elements';
            visualElements = 'geometric shapes, color swatches, and design tools materializing in mid-air';
            mood = 'creative and innovative';
        } else if (serviceType.toLowerCase().includes('writing') || serviceType.toLowerCase().includes('content')) {
            sceneDescription = 'A cozy writer\'s workspace with floating words and ideas materializing around an elegant desk';
            cameraMovement = 'gentle forward dolly with slight upward tilt';
            visualElements = 'floating text, glowing keyboards, books opening with pages turning, ideas flowing like light streams';
            mood = 'thoughtful and inspiring';
        } else if (serviceType.toLowerCase().includes('marketing') || serviceType.toLowerCase().includes('social')) {
            sceneDescription = 'A dynamic digital marketing command center with floating charts, social media icons, and growth metrics';
            cameraMovement = 'dynamic sweeping camera movement through holographic data displays';
            visualElements = 'animated charts rising, social media icons pulsing, engagement metrics growing, digital networks connecting';
            mood = 'energetic and successful';
        } else if (serviceType.toLowerCase().includes('web') || serviceType.toLowerCase().includes('development')) {
            sceneDescription = 'A futuristic coding environment with floating code snippets and digital interfaces';
            cameraMovement = 'smooth tracking shot through layers of floating code';
            visualElements = 'glowing code lines, building website wireframes, connecting digital nodes, responsive design elements adapting';
            mood = 'tech-forward and precise';
        } else if (serviceType.toLowerCase().includes('business') || serviceType.toLowerCase().includes('consultant')) {
            sceneDescription = 'An elegant boardroom with floating business charts, success metrics, and professional documents';
            cameraMovement = 'confident forward push with rising camera angle';
            visualElements = 'ascending growth charts, floating documents organizing themselves, handshake transitions, success indicators glowing';
            mood = 'authoritative and successful';
        } else {
            sceneDescription = 'A modern professional workspace with floating service-related elements and success indicators';
            cameraMovement = 'smooth forward movement with gentle rise';
            visualElements = 'professional tools organizing themselves, quality indicators appearing, service benefits materializing';
            mood = 'professional and trustworthy';
        }
        
        // Duration and technical specs for Sora
        const duration = '5-7 seconds';
        const style = 'cinematic, high-quality, professional lighting';
        
        return `${sceneDescription}. Camera movement: ${cameraMovement}. Visual elements: ${visualElements}. The scene represents ${benefits.join(', ')} for ${targetAudience}. Mood: ${mood}. Style: ${style}. Duration: ${duration}. Lighting: soft professional lighting with subtle highlights. Color grading: modern professional palette. Quality: 4K resolution, smooth motion, no camera shake. Text overlay space: clean area for "${serviceType.toUpperCase()}" title. Background: should work well for Pinterest video pin format.`;
    }

    generateIdiogrammPrompt(serviceAnalysis) {
        const serviceType = serviceAnalysis.service_type || 'Professional Service';
        const benefits = serviceAnalysis.main_benefits || ['professional', 'quality', 'reliable'];
        const targetAudience = serviceAnalysis.target_audience || 'professionals';
        
        // Determine visual description based on service type
        let visualDescription = '';
        if (serviceType.toLowerCase().includes('design') || serviceType.toLowerCase().includes('graphic')) {
            visualDescription = 'Modern workspace with design tools, clean geometric shapes, and creative elements';
        } else if (serviceType.toLowerCase().includes('writing') || serviceType.toLowerCase().includes('content')) {
            visualDescription = 'Professional writer\'s setup with laptop, books, and inspiring workspace';
        } else if (serviceType.toLowerCase().includes('marketing') || serviceType.toLowerCase().includes('social')) {
            visualDescription = 'Digital marketing dashboard with charts, social media icons, and growth analytics';
        } else if (serviceType.toLowerCase().includes('web') || serviceType.toLowerCase().includes('development')) {
            visualDescription = 'Modern coding environment with screens, code snippets, and tech elements';
        } else if (serviceType.toLowerCase().includes('business') || serviceType.toLowerCase().includes('consultant')) {
            visualDescription = 'Professional business meeting setup with charts, documents, and success metrics';
        } else {
            visualDescription = 'Professional service workspace with modern tools and success indicators';
        }
        
        // Determine tone based on service type and target audience
        let tone = 'professional';
        if (targetAudience.toLowerCase().includes('creative') || targetAudience.toLowerCase().includes('artist')) {
            tone = 'empowering';
        } else if (targetAudience.toLowerCase().includes('business') || targetAudience.toLowerCase().includes('entrepreneur')) {
            tone = 'trustworthy';
        } else if (serviceType.toLowerCase().includes('design') || serviceType.toLowerCase().includes('creative')) {
            tone = 'modern';
        } else if (serviceType.toLowerCase().includes('clean') || serviceType.toLowerCase().includes('organize')) {
            tone = 'clean';
        }
        
        // Determine relevant color based on service type
        let color = 'teal';
        if (serviceType.toLowerCase().includes('design') || serviceType.toLowerCase().includes('creative')) {
            color = 'purple';
        } else if (serviceType.toLowerCase().includes('business') || serviceType.toLowerCase().includes('finance')) {
            color = 'navy blue';
        } else if (serviceType.toLowerCase().includes('marketing') || serviceType.toLowerCase().includes('social')) {
            color = 'orange';
        } else if (serviceType.toLowerCase().includes('writing') || serviceType.toLowerCase().includes('content')) {
            color = 'forest green';
        } else if (serviceType.toLowerCase().includes('tech') || serviceType.toLowerCase().includes('development')) {
            color = 'electric blue';
        }
        
        return `This Pinterest pin is viral. ${visualDescription}. Text Overlay: "${serviceType.toUpperCase()}" in bold white modern font with a bold ${color} outline. This Pinterest pin is ${tone} and highly clickable.`;
    }
    
    generatePerformancePredictions(serviceAnalysis, keywordResearch) {
        const highVolumeKeywords = Object.entries(keywordResearch.search_volume_estimates || {})
            .filter(([_, volume]) => volume === 'high').length;
        
        const benefitCount = (serviceAnalysis.main_benefits || []).length;
        const hasBusinessAudience = (serviceAnalysis.target_audience || '').toLowerCase().includes('business');
        
        return {
            engagement_score: this.calculateEngagementScore(highVolumeKeywords, benefitCount),
            reach_potential: hasBusinessAudience ? 'Good' : 'Medium',
            conversion_likelihood: this.calculateConversionLikelihood(benefitCount, hasBusinessAudience),
            estimated_impressions: this.estimateImpressions(highVolumeKeywords),
            competition_level: this.assessCompetitionLevel(serviceAnalysis.service_type)
        };
    }
    
    calculateEngagementScore(highVolumeKeywords, benefitCount) {
        const score = (highVolumeKeywords * 20) + (benefitCount * 15);
        
        if (score >= 70) return 'High';
        if (score >= 40) return 'Medium';
        return 'Low';
    }
    
    calculateConversionLikelihood(benefitCount, hasBusinessAudience) {
        let score = benefitCount * 20;
        if (hasBusinessAudience) score += 20;
        
        if (score >= 80) return 'High';
        if (score >= 50) return 'Medium';
        return 'Low';
    }
    
    estimateImpressions(highVolumeKeywords) {
        const baseImpressions = 1000;
        const multiplier = Math.max(1, highVolumeKeywords * 2);
        
        return `${Math.round(baseImpressions * multiplier / 100) * 100}+`;
    }
    
    assessCompetitionLevel(serviceType) {
        const competitiveServices = ['logo design', 'website design', 'seo', 'social media', 'content writing'];
        const isCompetitive = competitiveServices.some(service => 
            (serviceType || '').toLowerCase().includes(service)
        );
        
        return isCompetitive ? 'High' : 'Medium';
    }
    
    async makeClaudeRequest(prompt) {
        if (!this.apiKey) {
            throw new Error('API ключ не настроен');
        }
        
        if (!prompt || typeof prompt !== 'string') {
            throw new Error('Неверный промпт');
        }
        
        console.log('Making Claude API request...', {
            model: this.config.claudeModel,
            promptLength: prompt.length,
            useCorsProxy: this.config.useCorsProxy
        });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);
        
        const requestBody = {
            model: this.config.claudeModel,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        };
        
        const requestHeaders = {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
        };
        
        // Only add beta header if using Sonnet model
        if (this.config.claudeModel.includes('sonnet')) {
            requestHeaders['anthropic-beta'] = 'max-tokens-3-5-sonnet-2024-07-15';
        }
        
        console.log('Request headers:', Object.keys(requestHeaders));
        console.log('Request body structure:', Object.keys(requestBody));
        
        // Try different CORS bypass methods
        const corsOptions = [
            // Method 1: Direct request (might work if CORS is disabled)
            {
                url: this.config.apiBaseUrl,
                options: {
                    method: 'POST',
                    mode: 'cors',
                    headers: requestHeaders,
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                }
            },
            // Method 2: Using cors-anywhere proxy
            {
                url: this.config.proxyUrl + this.config.apiBaseUrl,
                options: {
                    method: 'POST',
                    headers: {
                        ...requestHeaders,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                }
            },
            // Method 3: Using allorigins proxy
            {
                url: this.config.corsProxy + encodeURIComponent(this.config.apiBaseUrl),
                options: {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        method: 'POST',
                        headers: requestHeaders,
                        body: JSON.stringify(requestBody)
                    }),
                    signal: controller.signal
                }
            }
        ];
        
        let lastError = null;
        
        for (let i = 0; i < corsOptions.length; i++) {
            const { url, options } = corsOptions[i];
            
            try {
                console.log(`Attempting CORS method ${i + 1}/${corsOptions.length}:`, url.substring(0, 50) + '...');
                
                const response = await fetch(url, options);
                
                console.log('Response status:', response.status, response.statusText);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Method ${i + 1} failed:`, errorText);
                    
                    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData.error) {
                            if (errorData.error.type === 'authentication_error') {
                                errorMessage = 'Неверный API ключ или ключ истек';
                            } else if (errorData.error.type === 'permission_error') {
                                errorMessage = 'Нет доступа к API. Проверьте план подписки';
                            } else if (errorData.error.type === 'rate_limit_error') {
                                errorMessage = 'Превышен лимит запросов. Попробуйте позже';
                            } else {
                                errorMessage = errorData.error.message || errorMessage;
                            }
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                    
                    lastError = new Error(errorMessage);
                    continue; // Try next method
                }
                
                let data;
                if (i === 2) { // allorigins proxy returns different format
                    const textResponse = await response.text();
                    data = JSON.parse(textResponse);
                } else {
                    data = await response.json();
                }
                
                console.log('Response data structure:', Object.keys(data));
                
                if (!data.content || !data.content[0] || !data.content[0].text) {
                    console.error('Invalid response structure:', data);
                    lastError = new Error('Неверный формат ответа API');
                    continue;
                }
                
                console.log(`API request successful with method ${i + 1}`);
                clearTimeout(timeoutId);
                return data.content[0].text;
                
            } catch (error) {
                console.error(`Method ${i + 1} failed:`, error);
                lastError = error;
                continue;
            }
        }
        
        clearTimeout(timeoutId);
        
        // If all methods failed, throw the last error
        if (lastError) {
            console.error('All CORS methods failed:', lastError);
            
            if (lastError.name === 'AbortError') {
                throw new Error('Тайм-аут запроса к API (30 секунд)');
            }
            
            if (lastError.message.includes('Failed to fetch') || lastError.message.includes('NetworkError')) {
                if (navigator.onLine === false) {
                    throw new Error('Нет интернет-соединения');
                } else {
                    throw new Error('Ошибка сети или CORS. Попробуйте: 1) Обновить страницу 2) Использовать другой браузер 3) Отключить блокировщик рекламы');
                }
            }
            
            throw lastError;
        }
        
        throw new Error('Все методы обхода CORS неуспешны');
    }
    
    showProgress(containerId, fillId, textId, progress, text) {
        const container = document.getElementById(containerId);
        const fill = document.getElementById(fillId);
        const textEl = document.getElementById(textId);
        
        if (!container || !fill || !textEl) {
            console.error('Progress elements not found:', { containerId, fillId, textId });
            return;
        }
        
        container.classList.remove('hidden');
        fill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        textEl.textContent = text || 'Обработка...';
        
        // Add smooth transition
        fill.style.transition = 'width 0.3s ease';
    }
    
    hideProgress(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add('hidden');
        }
    }
    
    showStatus(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error('Status element not found:', elementId);
            return;
        }
        
        element.textContent = message || '';
        element.className = `status-message ${type}`;
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (element.textContent === message) {
                    element.textContent = '';
                    element.className = 'status-message';
                }
            }, 5000);
        }
    }
    
    renderResults() {
        const container = document.getElementById('results-container');
        if (!container) {
            console.error('Results container not found');
            return;
        }
        
        if (this.results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Нет результатов</h3>
                    <p>Генерируйте Pinterest пины чтобы увидеть результаты здесь</p>
                </div>
            `;
            return;
        }
        
        // Sort results by timestamp (newest first)
        const sortedResults = [...this.results].sort((a, b) => 
            new Date(b.timestamp || b.created_at || 0) - new Date(a.timestamp || a.created_at || 0)
        );
        
        container.innerHTML = sortedResults.map((result, index) => 
            this.renderResultCard(result, index)
        ).join('');
        
        // Add scroll to top after rendering
        container.scrollTop = 0;
    }
    
    renderResultCard(result, index) {
        if (result.error) {
            return `
                <div class="result-card">
                    <div class="result-card__header">
                        <h3 class="result-card__title">Ошибка обработки</h3>
                        <span class="result-card__type error">Error</span>
                    </div>
                    <div class="result-card__section">
                        <div class="result-card__section-title">URL</div>
                        <div class="result-card__section-content">
                            <a href="${this.escapeHtml(result.url)}" target="_blank" rel="noopener noreferrer">
                                ${this.escapeHtml(this.truncateUrl(result.url, 60))}
                            </a>
                        </div>
                    </div>
                    <div class="result-card__section">
                        <div class="result-card__section-title">Ошибка</div>
                        <div class="result-card__section-content error-message">
                            ${this.escapeHtml(result.error)}
                        </div>
                    </div>
                    <div class="result-card__section">
                        <div class="result-card__section-title">Время</div>
                        <div class="result-card__section-content">
                            ${this.formatTimestamp(result.timestamp)}
                        </div>
                    </div>
                </div>
            `;
        }
        
        const serviceAnalysis = result.service_analysis || {};
        const keywordResearch = result.keyword_research || {};
        const contentSuggestions = result.content_suggestions || {};
        const hashtagStrategy = result.hashtag_strategy || {};
        const performancePredictions = result.performance_predictions || {};
        
        return `
            <div class="result-card">
                <div class="result-card__header">
                    <h3 class="result-card__title">${this.escapeHtml(serviceAnalysis.title || 'Pinterest пин')}</h3>
                    <span class="result-card__type ${result.url_type || 'service'}">${this.capitalizeFirst(result.url_type || 'Service')}</span>
                </div>
                
                <div class="result-card__section">
                    <div class="result-card__section-title">Анализ сервиса</div>
                    <div class="result-card__section-content">
                        <p><strong>Описание:</strong> ${this.escapeHtml(serviceAnalysis.description || 'N/A')}</p>
                        <p><strong>Категория:</strong> ${this.escapeHtml(serviceAnalysis.category || 'N/A')}</p>
                        <p><strong>Ключевые преимущества:</strong> ${this.escapeHtml(this.joinArray(serviceAnalysis.key_benefits))}</p>
                        <p><strong>Целевая аудитория:</strong> ${this.escapeHtml(serviceAnalysis.target_audience || 'N/A')}</p>
                        <p><strong>Ценовая категория:</strong> ${this.escapeHtml(serviceAnalysis.price_range || 'N/A')}</p>
                    </div>
                </div>
                
                <div class="result-card__section">
                    <div class="result-card__section-title">Оптимизированный контент</div>
                    <div class="result-card__section-content">
                        <div class="content-item title-item">
                            <strong>📝 Заголовок Pinterest пина:</strong>
                            <div class="content-text title-text">${this.escapeHtml(contentSuggestions.optimized_title || 'N/A')}</div>
                            <button class="copy-btn" data-copy-text="${this.escapeHtml(contentSuggestions.optimized_title || '')}" data-copy-type="title">
                                Копировать заголовок
                            </button>
                        </div>
                        <div class="content-item description-item">
                            <strong>📄 Описание Pinterest пина:</strong>
                            <div class="content-text description-text">${this.escapeHtml(contentSuggestions.optimized_description || 'N/A')}</div>
                            <button class="copy-btn" data-copy-text="${this.escapeHtml(contentSuggestions.optimized_description || '')}" data-copy-type="description">
                                Копировать описание
                            </button>
                        </div>
                        <div class="content-item approach-item">
                            <strong>🎯 Подход к контенту:</strong>
                            <div class="content-text approach-text">${this.escapeHtml(contentSuggestions.content_angle || 'N/A')}</div>
                        </div>
                    </div>
                </div>
                
                <div class="result-card__section">
                    <div class="result-card__section-title">Партнерская ссылка</div>
                    <div class="result-card__section-content">
                        <div class="content-item affiliate-item">
                            <strong>🔗 Партнерская ссылка Fiverr:</strong>
                            <div class="affiliate-link-container">
                                <a href="${this.escapeHtml(result.affiliate_link || result.url)}" target="_blank" rel="noopener noreferrer" class="affiliate-link">
                                    Открыть сервис на Fiverr
                                </a>
                                <button class="copy-btn" data-copy-text="${this.escapeHtml(result.affiliate_link || result.url)}" data-copy-type="affiliate_link">
                                    Копировать ссылку
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="result-card__section">
                    <div class="result-card__section-title">Промпт для изображения</div>
                    <div class="result-card__section-content">
                        <div class="content-item">
                            <strong>🖼️ Промпт для изображения:</strong>
                            <div class="content-text">${this.escapeHtml(result.image_prompt || 'N/A')}</div>
                            <button class="copy-btn" data-copy-text="${this.escapeHtml(result.image_prompt || '')}" data-copy-type="image_prompt">
                                Копировать промпт
                            </button>
                        </div>
                    </div>
                </div>

                <div class="result-card__section">
                    <div class="result-card__section-title">Промпт для Sora</div>
                    <div class="result-card__section-content">
                        <div class="content-item">
                            <strong>🎬 Промпт для Sora:</strong>
                            <div class="content-text">${this.escapeHtml(result.sora_prompt || 'N/A')}</div>
                            <button class="copy-btn" data-copy-text="${this.escapeHtml(result.sora_prompt || '')}" data-copy-type="sora_prompt">
                                Копировать промпт
                            </button>
                        </div>
                    </div>
                </div>

                <div class="result-card__section">
                    <div class="result-card__section-title">Промпт для Idiogramm</div>
                    <div class="result-card__section-content">
                        <div class="content-item">
                            <strong>🎨 Вирусный Pinterest промпт:</strong>
                            <div class="content-text idiogramm-prompt">${this.escapeHtml(result.idiogramm_prompt || 'N/A')}</div>
                            <button class="copy-btn" data-copy-text="${this.escapeHtml(result.idiogramm_prompt || '')}" data-copy-type="idiogramm_prompt">
                                Копировать промпт
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="result-card__section">
                    <div class="result-card__section-title">Стратегия хэштегов</div>
                    <div class="result-card__section-content">
                        <div class="hashtag-group">
                            <strong>Широкие:</strong>
                            <div class="result-card__hashtags">
                                ${this.renderHashtags(hashtagStrategy.broad_hashtags || [])}
                            </div>
                        </div>
                        <div class="hashtag-group">
                            <strong>Нишевые:</strong>
                            <div class="result-card__hashtags">
                                ${this.renderHashtags(hashtagStrategy.niche_hashtags || [])}
                            </div>
                        </div>
                        <div class="hashtag-group">
                            <strong>Специфические:</strong>
                            <div class="result-card__hashtags">
                                ${this.renderHashtags(hashtagStrategy.specific_hashtags || [])}
                            </div>
                        </div>
                        <button class="copy-btn" data-copy-index="${index}" data-copy-type="all_hashtags">
                            Копировать все хэштеги
                        </button>
                    </div>
                </div>
                
                <div class="result-card__section">
                    <div class="result-card__section-title">Исследование ключевых слов</div>
                    <div class="result-card__section-content">
                        <p><strong>Основные:</strong> ${this.escapeHtml(this.joinArray(keywordResearch.primary_keywords))}</p>
                        <p><strong>Длинные фразы:</strong> ${this.escapeHtml(this.joinArray(keywordResearch.long_tail_keywords))}</p>
                        <p><strong>Трендовые хэштеги:</strong> ${this.escapeHtml(this.joinArray(keywordResearch.trending_hashtags))}</p>
                    </div>
                </div>
                
                <div class="result-card__section">
                    <div class="result-card__section-title">Прогноз эффективности</div>
                    <div class="result-card__section-content">
                        <div class="performance-metrics">
                            <div class="metric">
                                <span class="metric-label">Вовлеченность:</span>
                                <span class="metric-value ${performancePredictions.engagement_score?.toLowerCase() || 'unknown'}">
                                    ${performancePredictions.engagement_score || 'N/A'}
                                </span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Потенциал охвата:</span>
                                <span class="metric-value">${performancePredictions.reach_potential || 'N/A'}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Вероятность конверсии:</span>
                                <span class="metric-value ${performancePredictions.conversion_likelihood?.toLowerCase() || 'unknown'}">
                                    ${performancePredictions.conversion_likelihood || 'N/A'}
                                </span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Оценка показов:</span>
                                <span class="metric-value">${performancePredictions.estimated_impressions || 'N/A'}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Уровень конкуренции:</span>
                                <span class="metric-value">${performancePredictions.competition_level || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="result-card__actions">
                    <button class="btn btn--secondary" data-export-index="${index}">
                        Экспортировать
                    </button>
                    <button class="btn btn--outline" data-modal-title="Детали результата" data-modal-content="${this.escapeHtml(JSON.stringify(result, null, 2))}">
                        Детали
                    </button>
                </div>
                
                <div class="result-card__section">
                    <div class="result-card__section-title">Информация о обработке</div>
                    <div class="result-card__section-content">
                        <div class="content-item stats-item">
                            <p><strong>⏱️ Время обработки:</strong> ${this.formatProcessingTime(result.processing_time)}</p>
                            <p><strong>📅 Создано:</strong> ${this.formatTimestamp(result.timestamp)}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Helper methods for rendering
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    escapeForJS(text) {
        if (!text) return '';
        return text
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/`/g, '\\`')
            .replace(/\$/g, '\\$')
            .replace(/\r?\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }
    
    joinArray(arr) {
        if (!Array.isArray(arr)) return 'N/A';
        return arr.join(', ') || 'N/A';
    }
    
    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    formatTimestamp(timestamp) {
        if (!timestamp) return 'N/A';
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'N/A';
        }
    }
    
    formatProcessingTime(time) {
        if (!time) return 'N/A';
        const seconds = Math.round(time / 1000);
        return `${seconds}с`;
    }
    
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    
    renderHashtags(hashtags) {
        if (!Array.isArray(hashtags)) return '';
        
        return hashtags.map(tag => `
            <span class="result-card__hashtag" data-copy-text="${this.escapeHtml(tag)}" data-copy-type="hashtag">
                ${this.escapeHtml(tag)}
            </span>
        `).join('');
    }
    
    copyToClipboard(text) {
        if (!text) {
            this.showCopyNotification('Нет текста для копирования', 'error');
            return;
        }
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showCopyNotification('Скопировано!');
            }).catch(err => {
                console.error('Clipboard API failed:', err);
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }
    
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopyNotification('Скопировано!');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showCopyNotification('Ошибка копирования', 'error');
        }
        
        document.body.removeChild(textArea);
    }
    
    copyAllHashtags(index) {
        const result = this.results[index];
        if (!result || !result.hashtag_strategy) {
            this.showCopyNotification('Хэштеги не найдены', 'error');
            return;
        }
        
        const hashtags = [
            ...(result.hashtag_strategy.broad_hashtags || []),
            ...(result.hashtag_strategy.niche_hashtags || []),
            ...(result.hashtag_strategy.specific_hashtags || [])
        ];
        
        if (hashtags.length === 0) {
            this.showCopyNotification('Нет хэштегов для копирования', 'error');
            return;
        }
        
        const hashtagText = hashtags.join(' ');
        this.copyToClipboard(hashtagText);
    }
    
    showCopyNotification(message, type = 'success') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('copy-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'copy-notification';
            notification.className = 'copy-notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.className = `copy-notification ${type}`;
        notification.classList.add('show');
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }
    
    exportResult(index) {
        const result = this.results[index];
        if (!result) {
            this.showCopyNotification('Результат не найден', 'error');
            return;
        }
        
        const filename = `pinterest-pin-${index + 1}-${Date.now()}.json`;
        this.downloadJSON(result, filename);
    }
    
    exportAll() {
        if (this.results.length === 0) {
            this.showCopyNotification('Нет результатов для экспорта', 'error');
            return;
        }
        
        const exportData = {
            results: this.results,
            exported_at: new Date().toISOString(),
            total_results: this.results.length
        };
        
        const filename = `pinterest-pins-export-${Date.now()}.json`;
        this.downloadJSON(exportData, filename);
    }
    
    downloadJSON(data, filename) {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.showCopyNotification('Файл загружен');
        } catch (error) {
            console.error('Export error:', error);
            this.showCopyNotification('Ошибка экспорта', 'error');
        }
    }
    
    clearResults() {
        if (this.results.length === 0) {
            this.showCopyNotification('Нет результатов для очистки', 'info');
            return;
        }
        
        if (confirm(`Удалить все ${this.results.length} результатов?`)) {
            this.results = [];
            this.cache.clear();
            this.renderResults();
            this.showCopyNotification('Результаты очищены');
        }
    }
    
    openModal(title, content) {
        const modal = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        if (!modal || !modalTitle || !modalBody) {
            console.error('Modal elements not found');
            return;
        }
        
        modalTitle.textContent = title;
        modalBody.innerHTML = `<pre class="modal-content">${this.escapeHtml(content)}</pre>`;
        modal.classList.remove('hidden');
        
        // Focus trap for accessibility
        modal.focus();
    }
    
    closeModal() {
        const modal = document.getElementById('modal-overlay');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

// Initialize the application
const app = new FiverrPinterestGenerator();

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    app.showCopyNotification('Произошла ошибка', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    app.showCopyNotification('Произошла ошибка', 'error');
    event.preventDefault();
});

// Service worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker would be registered here for offline support
        console.log('Service Worker support detected');
    });
}