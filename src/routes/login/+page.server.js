import bcrypt from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';
import db from "$lib/server/db.js";

export const actions = {
    login: async ({ cookies, request}) => {

        const data = await request.formData()
        const username = data.get('username')
        const password = data.get('password')

        if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
            return fail(400, { invalid: true })
        }

        let users = await db.query(`SELECT * FROM user WHERE user_name = '${db.sanitize_input(username)}' LIMIT 1`);

        if (users.length == 0) {
            return fail(400, { credentials: true })
        }


        const valid_password = await bcrypt.compare(db.sanitize_input(password), users[0].user_pass);


        if (!valid_password) {
            return fail(400, { credentials: true }) 
        }

        await db.query(`INSERT INTO user(user_token) VALUES(${crypto.randomUUID()}) WHERE user_name = '${db.sanitize_input(username)}'`);
        
        // will exist every time
        users = await db.query(`SELECT * FROM user WHERE user_name = '${db.sanitize_input(username)}'`);

        cookies.set('session', users[0].user_token, {
            path : '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30,
        });
    
        redirect(302, '/');
    } 
}