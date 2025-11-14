import { FC, useState } from 'react';
import Head from 'next/head';
import useTranslation from 'next-translate/useTranslation';

const WidgetTestPage: FC = () => {
  const { t } = useTranslation('common');
  const [group, setGroup] = useState('');
  const [lang, setLang] = useState('de');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyForValidation, setApiKeyForValidation] = useState('');
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const buildWidgetUrl = (includeApiKey?: boolean, customGroup?: string, customLang?: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
    let url = `${baseUrl}/widget/courses`;
    const params: string[] = [];
    
    if (includeApiKey && apiKey) {
      params.push(`apiKey=${encodeURIComponent(apiKey)}`);
    }
    if (customGroup !== undefined ? customGroup : group) {
      params.push(`group=${customGroup !== undefined ? customGroup : group}`);
    }
    if (customLang !== undefined ? customLang : lang) {
      params.push(`lang=${customLang !== undefined ? customLang : lang}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return url;
  };

  const handleValidateApiKey = async () => {
    if (!apiKeyForValidation) {
      setValidationResult('<p style="color:red;">Please enter an API key</p>');
      return;
    }

    setValidating(true);
    setValidationResult('<p>Validating...</p>');

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/widget/validate-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKeyForValidation }),
      });

      const data = await response.json();

      if (data.valid) {
        setValidationResult(`
          <p style="color:green;"><strong>✓ Valid API Key</strong></p>
          <p><strong>Organization ID:</strong> ${data.organizationId}</p>
          <p><strong>Organization Name:</strong> ${data.organizationName || 'N/A'}</p>
        `);
      } else {
        setValidationResult(`
          <p style="color:red;"><strong>✗ Invalid API Key</strong></p>
          <p><strong>Error:</strong> ${data.error || 'Unknown error'}</p>
        `);
      }
    } catch (error: any) {
      setValidationResult(`
        <p style="color:red;"><strong>✗ Validation Failed</strong></p>
        <p><strong>Error:</strong> ${error.message}</p>
      `);
    } finally {
      setValidating(false);
    }
  };

  return (
    <>
      <Head>
        <title>EduHub Widget Test Page</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
        <h1 style={{ color: '#333' }}>EduHub Course Widget Test Page</h1>
        
        <div style={{ background: 'white', padding: '20px', margin: '20px 0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#666', marginTop: 0 }}>Test 1: All Courses (No Filter)</h2>
          <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', wordBreak: 'break-all', margin: '10px 0' }}>
            {buildWidgetUrl()}
          </div>
          <iframe 
            src={buildWidgetUrl()} 
            frameBorder="0" 
            style={{ width: '100%', height: '435px', border: 'none', borderRadius: '4px', overflow: 'hidden', background: 'transparent' }}
            title="Test 1: All Courses"
            allow="fullscreen"
            loading="lazy"
          />
        </div>

        <div style={{ background: 'white', padding: '20px', margin: '20px 0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#666', marginTop: 0 }}>Test 2: Filter by Course Group</h2>
          <div style={{ margin: '10px 0' }}>
            <label style={{ marginRight: '10px' }}>Group:</label>
            <select 
              value={group} 
              onChange={(e) => setGroup(e.target.value)}
              style={{ padding: '8px', margin: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">All</option>
              <option value="1">Group 1</option>
              <option value="2">Group 2</option>
              <option value="3">Group 3</option>
              <option value="4">Group 4</option>
              <option value="5">Group 5</option>
            </select>
            <label style={{ marginRight: '10px', marginLeft: '20px' }}>Language:</label>
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
              style={{ padding: '8px', margin: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="de">German</option>
              <option value="en">English</option>
            </select>
          </div>
          <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', wordBreak: 'break-all', margin: '10px 0' }}>
            {buildWidgetUrl()}
          </div>
          <iframe 
            src={buildWidgetUrl()} 
            frameBorder="0" 
            style={{ width: '100%', height: '435px', border: 'none', borderRadius: '4px', overflow: 'hidden', background: 'transparent' }}
            title="Test 2: Filter by Course Group"
            key={`${group}-${lang}`}
            allow="fullscreen"
            loading="lazy"
          />
        </div>

        <div style={{ background: 'white', padding: '20px', margin: '20px 0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#666', marginTop: 0 }}>Test 3: With API Key (Organization Filter)</h2>
          <div style={{ margin: '10px 0' }}>
            <label style={{ marginRight: '10px' }}>API Key:</label>
            <input 
              type="text" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="edh_live_org123_sk_..." 
              style={{ width: '300px', padding: '8px', margin: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', wordBreak: 'break-all', margin: '10px 0' }}>
            {buildWidgetUrl(true)}
          </div>
          <iframe 
            src={buildWidgetUrl(true)} 
            frameBorder="0" 
            style={{ width: '100%', height: '435px', border: 'none', borderRadius: '4px', overflow: 'hidden', background: 'transparent' }}
            title="Test 3: With API Key"
            key={apiKey}
            allow="fullscreen"
            loading="lazy"
          />
        </div>

        <div style={{ background: 'white', padding: '20px', margin: '20px 0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#666', marginTop: 0 }}>Test 4: API Key Validation Endpoint</h2>
          <div style={{ margin: '10px 0' }}>
            <label style={{ marginRight: '10px' }}>API Key:</label>
            <input 
              type="text" 
              value={apiKeyForValidation}
              onChange={(e) => setApiKeyForValidation(e.target.value)}
              placeholder="edh_live_org123_sk_..." 
              style={{ width: '300px', padding: '8px', margin: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <button 
              onClick={handleValidateApiKey}
              disabled={validating}
              style={{ 
                padding: '8px 16px', 
                background: validating ? '#ccc' : '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: validating ? 'not-allowed' : 'pointer',
                marginLeft: '10px'
              }}
            >
              {validating ? 'Validating...' : 'Validate API Key'}
            </button>
          </div>
          {validationResult && (
            <div 
              style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}
              dangerouslySetInnerHTML={{ __html: validationResult }}
            />
          )}
        </div>

        <div style={{ background: 'white', padding: '20px', margin: '20px 0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#666', marginTop: 0 }}>Test 5: Error Cases</h2>
          <h3 style={{ color: '#666' }}>Invalid Group</h3>
          <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', wordBreak: 'break-all', margin: '10px 0' }}>
            {buildWidgetUrl(false, '99', lang)}
          </div>
          <iframe 
            src={buildWidgetUrl(false, '99', lang)} 
            frameBorder="0" 
            style={{ width: '100%', height: '435px', border: 'none', borderRadius: '4px', marginBottom: '20px', overflow: 'hidden', background: 'transparent' }}
            title="Test 5: Invalid Group"
            allow="fullscreen"
            loading="lazy"
          />
          
          <h3 style={{ color: '#666' }}>Invalid API Key</h3>
          <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', wordBreak: 'break-all', margin: '10px 0' }}>
            {buildWidgetUrl(false, '', lang).replace('/widget/courses', '/widget/courses?apiKey=invalid_key')}
          </div>
          <iframe 
            src={buildWidgetUrl(false, '', lang).replace('/widget/courses', '/widget/courses?apiKey=invalid_key')} 
            frameBorder="0" 
            style={{ width: '100%', height: '435px', border: 'none', borderRadius: '4px', overflow: 'hidden', background: 'transparent' }}
            title="Test 5: Invalid API Key"
            allow="fullscreen"
            loading="lazy"
          />
        </div>
      </div>
    </>
  );
};

export default WidgetTestPage;

