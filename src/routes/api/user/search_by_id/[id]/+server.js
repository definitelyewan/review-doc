import { json } from '@sveltejs/kit';
import security from '$lib/server/security';
import db from '$lib/server/db';

/**
 * Provides a get endpoint to get a user by id
 */
export async function GET({ request, params }) {

    // validate user
    const auth = request.headers.get('Authorization');
    const valid = await security.validate_api_key(auth);

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }

    try {
        // deny any non admin or non-original user from accessing this endpoint
        const user_id = parseInt(params.id);

        if (isNaN(user_id)) {
            throw new Error('Invalid Parameters');
        }
        let user_privilege = "viewer";

        if (security.validate_master_api_key(auth)) {
            user_privilege = "admin";
        } else {

            const user_id = await db.user_api_key_to_id(auth);
            const user = await db.query(`SELECT * FROM user WHERE user_id = ${user_id} LIMIT 1`);
            user_privilege = user[0].user_type;

            if (user_privilege != "admin" || (user_privilege != "user" && user_id != user[0].user_id)) {
                throw new Error('Insufficient Privileges');
            }
        }


        const users = await db.query(`SELECT * FROM user WHERE user_id = ${user_id} LIMIT 1`);

        return json(users[0], {status: 200});


    } catch (err) {
        console.error(err);
        return json({ message: err.message });
    }
}