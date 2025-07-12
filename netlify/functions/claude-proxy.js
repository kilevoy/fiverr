const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Разрешаем CORS для всех источников
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Обработка preflight запроса
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🌐 Netlify function called');
    
    // Проверяем тело запроса
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const requestBody = JSON.parse(event.body);
    const { apiKey, messages } = requestBody;

    if (!apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'API key is required' })
      };
    }

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array is required' })
      };
    }

    console.log('📤 Making request to Claude API...');

    // Запрос к Claude API с таймаутом
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 секунд

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: messages
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📡 Claude API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      
      let errorMessage = 'API request failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // Ignore parse error
      }
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'Claude API error', 
          message: errorMessage,
          status: response.status
        })
      };
    }

    const data = await response.json();
    console.log('✅ Claude API success');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('💥 Function error:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout';
      statusCode = 408;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Network error - cannot reach Claude API';
      statusCode = 503;
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Invalid request format';
      statusCode = 400;
    }
    
    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage, 
        details: error.message
      })
    };
  }
}; 