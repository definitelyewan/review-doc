import { json } from '@sveltejs/kit';
import security from '$lib/server/security';
import db from '$lib/server/db';


export async function GET({ request, params }) {

    const valid = await security.validate_api_key(request.headers.get('Authorization'));

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }


    try {

        const media_id = parseInt(params.id);
        const type = db.sanitize_input(params.type);

        if (isNaN(media_id)) {
            throw new Error("Invalid Parameter");
        }

        if (type !== 'tag' && type !== 'studio' && type !== 'director' && type !== 'distributor') {
            console.log(type);
            throw new Error("Invalid Parameter");
        }


        const descriptors = await db.query(`SELECT ${type}_name from ${type} INNER JOIN ${type}_of WHERE ${type}.${type}_id = ${type}_of.${type}_id AND ${type}_of.media_id = ${media_id}`);

        return json(descriptors, {status: 200});

    } catch (err) {
        console.error(err);
        return json({ message: "Internal Server Error" }, { status: 500 });
    }

}