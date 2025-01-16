import { json } from '@sveltejs/kit';
import security from '$lib/server/security';
import db from '$lib/server/db';

/**
 * Provides a get endpoint to search for awards by year based off a year parameter
 */
export async function GET({ request, params }) {

    // validate the user
    const valid = await security.validate_api_key(request.headers.get('Authorization'));

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }

    // attempt to get requested awards
    try {

        const year = parseInt(params.year);

        if (isNaN(year)) {
            throw new Error("Invalid Parameter");
        }


        const awards = await db.query(`SELECT * FROM award WHERE award_issue_year = ${year}`);

        return json(awards, {status: 200});

    } catch (err) {
        console.error(err);
        return json({ message: "Internal Server Error" }, { status: 500 });
    }

}
