import { json } from '@sveltejs/kit';
import security from '$lib/server/security';
import db from '$lib/server/db';

/**
 * Provides a get endpoint to get the latest n reviews
 */
export async function GET({ request, params }) {

    // validate user
    const valid = await security.validate_api_key(request.headers.get('Authorization'));

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }

    // attempt to get n reviews
    try {

        const total = Math.abs(parseInt(params.number));

        if (isNaN(total)) {
            return json({ message: "Invalid Parameter" }, { status: 400 });
        }

        const reviews = await db.query(`SELECT * FROM review ORDER BY review_date DESC LIMIT ${total}`);

        return json(reviews, {status: 200});

    } catch (err) {
        console.error(err);
        return json({ message: "Internal Server Error" }, { status: 500 });
    }

}