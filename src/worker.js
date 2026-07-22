import { handleRequest } from './router.js';
import { applyCorsHeaders } from './middleware/cors.js';

export default {
  async fetch(request, env, ctx) {
    try {
      const routeResponse = await handleRequest(request, env);
      if (routeResponse !== null) {
        return applyCorsHeaders(routeResponse, env);
      }

      // If no API route matched, serve static assets or HTML index
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not Found', { status: 404 });
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
