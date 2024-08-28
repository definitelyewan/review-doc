import { json } from '@sveltejs/kit';
import security from '$lib/server/security';
import db from '$lib/server/db';



export async function GET({ request, params }) {

    const auth = request.headers.get('Authorization');
    const valid = await security.validate_api_key(auth);

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }

    try {

        const media_id = parseInt(params.id);

        if (isNaN(media_id)) {
            throw new Error("Invalid Paramers");
        }

        const media = await db.query(`SELECT * FROM media WHERE media_id = ${media_id} LIMIT 1`);

        if (media.length == 0) {
            throw new Error("Media not found");
        }

        return json(media[0]);

    } catch (err) {
        console.error(err);
        return json({ message: err.message});
    }
}