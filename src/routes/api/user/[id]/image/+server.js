import { json } from '@sveltejs/kit';
import security from '$lib/server/security';
import db from '$lib/server/db';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import mime from 'mime';

export async function GET({ request, params }) {
    /**
     * No API key needed
     */
    try {
        const user_id = parseInt(params.id);


        if (isNaN(user_id)) {
            throw new Error('Invalid Parameters');
        }

        const user = await db.query(`SELECT user_profile_path FROM user WHERE user_id = ${user_id} LIMIT 1`);
        const img_file_name = String(user[0]["user_profile_path"]);
        const img_path = path.join(process.env.REVIEWER_PLUS_IMG_DIR, img_file_name);
        const img_data = fs.readFileSync(img_path);
        const content_type = mime.getType(img_path) || 'application/octet-stream';

        return new Response(img_data, {
            status: 200,
            headers: {
                'Content-Type': content_type,
                'Content-Length': img_data.length
            }
        });


    } catch (err) {
        console.error(err);
        return json({ message: err });
    }
}