import { json } from '@sveltejs/kit';
import security from '$lib/server/security';
import db from '$lib/server/db';

/**
 * Provides a get endpoint that returns all awards to the caller based off a media_id
 */
export async function GET({ request, params }) {

    // validate the user
    const valid = await security.validate_api_key(request.headers.get('Authorization'));

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }

    // attempt to get requested awards
    try {

        const media_id = parseInt(params.id);

        if (isNaN(media_id)) {
            throw new Error("Invalid Parameter");
        }


        const awards = await db.query(`SELECT * FROM award WHERE media_id = ${media_id}`);

        return json(awards, {status: 200});

    } catch (err) {
        console.error(err);
        return json({ message: "Internal Server Error" }, { status: 500 });
    }

}