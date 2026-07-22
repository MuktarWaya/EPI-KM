import { handleRequest } from './router.js';
import { applyCorsHeaders } from './middleware/cors.js';

export default {
  async fetch(request, env, ctx) {
    try {
      // 1. Try handling API routes
      const routeResponse = await handleRequest(request, env);
      if (routeResponse !== null) {
        return applyCorsHeaders(routeResponse, env);
      }

      // 2. Serve static assets or fallback to index.html (SPA)
      if (env.ASSETS) {
        let response = await env.ASSETS.fetch(request);
        if (response.status === 404) {
          const url = new URL(request.url);
          url.pathname = '/index.html';
          response = await env.ASSETS.fetch(new Request(url.toString(), request));
        }
        return response;
      }

      return new Response('Not Found', { status: 404 });
    } catch (err) {
      const errRes = new Response(JSON.stringify({
        success: false,
        message: 'Internal Worker Error',
        error: err.toString()
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });

      return applyCorsHeaders(errRes, env);
    }
  }
};
