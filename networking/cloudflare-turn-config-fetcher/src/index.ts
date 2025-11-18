export interface Env {
	CLOUDFLARE_TURN_TOKEN_ID: string;
	CLOUDFLARE_TURN_API_TOKEN: string;
}

export default {
	async fetch(request: Request, env: Env) {
		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		}

		try {
			const turnTokenId = env.CLOUDFLARE_TURN_TOKEN_ID;
			const apiKey = env.CLOUDFLARE_TURN_API_TOKEN;

			const response = await fetch(
				`https://rtc.live.cloudflare.com/v1/turn/keys/${turnTokenId}/credentials/generate-ice-servers`,
				{
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ ttl: 3600 }),
				}
			);

			const data = await response.json();
			return new Response(JSON.stringify(data), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*', // Enable CORS
				},
			});

		} catch (error) {
			return new Response('Internal Server Error', {
				status: 500,
				headers: {
					'Access-Control-Allow-Origin': '*', // Ensure CORS even on errors
				},
			});
		}
	}
};
