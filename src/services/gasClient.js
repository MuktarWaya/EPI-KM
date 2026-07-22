/**
 * GAS Client Proxy - Forwards requests securely from Worker to Google Apps Script
 */
export async function callGasApi(env, action, payload = {}) {
  const gasUrl = env.GAS_API_URL || 'https://script.google.com/macros/s/AKfycbw8exAcjMe9eevrJh3gweM3PUcsTqYm_kjDBQT2P3VK-fnYnCUw3KOqYAnwE1iPDtF-EQ/exec';
  
  const body = {
    action,
    ...payload
  };

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`GAS HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูล Google Apps Script ได้',
      error: err.toString()
    };
  }
}
