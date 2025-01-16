import { json } from '@sveltejs/kit';
import security from '$lib/server/security';

/**
 * Test the server to see if its running
 */
export async function GET ({ request }) {
    
    const valid = await security.validate_api_key(request.headers.get('Authorization'));

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }

    return json({ message: "OK" });

}