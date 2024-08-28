import { json } from '@sveltejs/kit';
import security from '$lib/server/security';
import db from '$lib/server/db';

export async function GET({ request, params }) {

    const valid = await security.validate_api_key(request.headers.get('Authorization'));

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }


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
