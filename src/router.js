import { callGasApi } from './services/gasClient.js';

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  // API Routes
  if (pathname === '/api/health') {
    return jsonResponse(true, 'Cloudflare Worker Service Healthy', { timestamp: new Date().toISOString() });
  }

  // Create or Get Sessions
  if (pathname === '/api/sessions' && method === 'GET') {
    const res = await callGasApi(env, 'GET_SESSIONS');
    return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
  }

  if (pathname === '/api/sessions' && method === 'POST') {
    const body = await request.json();
    const res = await callGasApi(env, 'CREATE_SESSION', body);
    return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
  }

  if (pathname.startsWith('/api/sessions/') && pathname.endsWith('/close') && method === 'POST') {
    const parts = pathname.split('/');
    const sessionId = parts[3];
    const res = await callGasApi(env, 'CLOSE_SESSION', { sessionId });
    return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
  }

  // Register Participant
  if (pathname === '/api/participants/register' && method === 'POST') {
    const body = await request.json();
    const res = await callGasApi(env, 'REGISTER_PARTICIPANT', body);
    return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
  }

  // Submit KS Model Likert Assessment
  if (pathname === '/api/assessments/ks' && method === 'POST') {
    const body = await request.json();
    const res = await callGasApi(env, 'SUBMIT_KS_MODEL', body);
    return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
  }

  // Presenter View State
  if (pathname.startsWith('/api/presenter/') && pathname.endsWith('/state')) {
    const parts = pathname.split('/');
    const sessionId = parts[3];
    const res = await callGasApi(env, 'GET_PRESENTER_STATE', { sessionId });
    return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
  }

  // Audience Display Slide State
  if (pathname.startsWith('/api/audience/') && pathname.endsWith('/slide')) {
    const parts = pathname.split('/');
    const sessionId = parts[3];
    const res = await callGasApi(env, 'GET_AUDIENCE_SLIDE', { sessionId });
    return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
  }

  // Handover Export APIs
  if (pathname.startsWith('/api/export/') && pathname.endsWith('/summary')) {
    const parts = pathname.split('/');
    const sessionId = parts[3];
    const res = await callGasApi(env, 'GENERATE_HANDOVER', { sessionId });
    return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
  }

  if (pathname.startsWith('/api/export/') && pathname.endsWith('/followup.csv')) {
    const parts = pathname.split('/');
    const sessionId = parts[3];
    const res = await callGasApi(env, 'EXPORT_FOLLOWUP_CSV', { sessionId });
    if (res.success && res.data && res.data.csvData) {
      return new Response(res.data.csvData, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="EPI_FollowUp_${sessionId}.csv"`
        }
      });
    }
    return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
  }

  // Fallback to Static Asset Asset Server or SPA HTML
  return null;
}

function jsonResponse(success, message, data = null, status = 200) {
  return new Response(JSON.stringify({ success, message, data }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
