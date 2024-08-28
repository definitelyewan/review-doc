import { json } from '@sveltejs/kit';
import security from '$lib/server/security';
import db from '$lib/server/db';

//just gets everything

export async function GET({ request, params }) {

    const auth = request.headers.get('Authorization');
    const valid = await security.validate_api_key(auth);

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }

    try {
        const media = await db.query("SELECT * FROM media");

        return json(media);

    } catch (err) {
        console.error(err);
        return json({ message: err.message});
    }
}