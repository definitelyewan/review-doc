import bcrypt from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import security from '$lib/server/security.js';


export const actions = {
    register: async ({ request }) => {
        const formData = await request.formData();
        let username = formData.get('username');
        let password = formData.get('password');
        
        username = db.sanitize_input(username);
        password = db.sanitize_input(password);

        if ( typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
            return fail(400, { invalid: true })
          }


        // Check if the username is already taken
        const user_exists = await db.query(`SELECT * FROM user WHERE user_name = '${username}' LIMIT 1`);
    
        if (user_exists.length > 0) {

            return fail(400, { user_exists: true });
        }

        // Hash the password and api_key
        const hashed_password = await bcrypt.hash(password, 10);
        const api_key = await bcrypt.hash(`${hashed_password} + ${username}`, 10);
        const user_token = crypto.randomUUID();
        const characters = '0123456789abcdef';
        const user_initials = username.substring(0, 2).toUpperCase();
        let user_colour = '';

        for (let i = 0; i < 6; i++) {
            const random_index = Math.floor(Math.random() * characters.length);
            user_colour += characters[random_index];
        }

        // Save the user to the mock database
        try {

            if (!security.registrable()) {
                throw new Error("Disabled");
            } 


            await db.query(`INSERT INTO user(user_name, user_pass, user_api_key, user_type, user_token, user_icon_colour, user_icon_text) 
                            VALUES('${username}', '${hashed_password}', '${api_key}', 'user', '${user_token}', '${user_colour}', '${user_initials}')`);

            await db.query(`INSERT INTO list(list_name, list_description, user_id) VALUES('Favourites', '${username}''s favourite media', (SELECT user_id FROM user WHERE user_name = '${username}' LIMIT 1))`);
        } catch (err) {
            console.error(err);
            return fail(500, {user_fail_reg_closed: true})
        }

        // Redirect to a success page or home page
        throw redirect(303, '/login');
    }
};