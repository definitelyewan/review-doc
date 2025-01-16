import { json } from '@sveltejs/kit';
import security from '$lib/server/security';
import db from '$lib/server/db';

/**
 * Provides a get endpoint to get all reviews based off a media id
 */
export async function GET({ request, params }) {

    // validate user
    const valid = await security.validate_api_key(request.headers.get('Authorization'));

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }

    // attempt to get all reviews of media id
    try {

        const media_id = parseInt(params.id);

        if (isNaN(media_id)) {
            throw new Error("Invalid Parameter");
        }

        const reviews = await db.query(`SELECT * FROM review WHERE media_id = ${media_id}`);

        return json(reviews, {status: 200});

    } catch (err) {
        console.error(err);
        return json({ message: "Internal Server Error" }, { status: 500 });
    }

}