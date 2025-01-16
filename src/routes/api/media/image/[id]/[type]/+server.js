import { json } from '@sveltejs/kit';
import security from '$lib/server/security';
import db from '$lib/server/db';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import mime from 'mime';

/**
 * Provides a get endpoint to download an image based off a media id
 */
export async function GET({ request, params }) {
    /**
     * No API key needed
     */
    try {
        const media_id = parseInt(params.id);
        const media_img_type = db.sanitize_input(params.type);

        if (media_img_type != "cover" && media_img_type != "banner") {
            throw new Error('Invalid Parameters');
        }


        if (isNaN(media_id)) {
            throw new Error('Invalid Parameters');
        }

        const media = await db.query(`SELECT media_${media_img_type} FROM media WHERE media_id = ${media_id} LIMIT 1`);
        const img_file_name = String(media[0][`media_${media_img_type}`]);
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

/**
 * Provides a patch endpoint to upload an image based off a media id. useful for updating media ids that
 * dont have images and 100% should.
 */
export async function PATCH({ request, params }) {

    // validate user
    const auth = request.headers.get('Authorization');
    const valid = await security.validate_api_key(auth);

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }

    // attempt to update the image
    try {

        const media_id = parseInt(params.id);
        const media_img_type = db.sanitize_input(params.type);

        if (media_img_type != "cover" && media_img_type != "banner") {
            throw new Error('Invalid Parameters');
        }


        if (isNaN(media_id)) {
            throw new Error('Invalid Parameters');
        }

        // feature should only be available to admins or users who added the media
        const media = await db.query(`SELECT * FROM media WHERE media_id = ${media_id} LIMIT 1`);
        let user_privilege = "viewer";

        if (security.validate_master_api_key(auth)) {
            user_privilege = "admin";
        } else {

            const user_id = await db.user_api_key_to_id(auth);
            const user = await db.query(`SELECT user_type FROM user WHERE user_id = ${user_id} LIMIT 1`);
            user_privilege = user[0].user_type;

            if (user_privilege != "admin" || (user_privilege != "user" && user_id != media[0].user_id)) {
                throw new Error('Insufficient Privileges');
            }
        }


        const body_content = await request.json();
        const file_name = String(Date.now());
        const img_path = path.join(process.env.REVIEWER_PLUS_IMG_DIR, file_name);
        
        if(!await security.validate_url(body_content[0])) {
            throw new Error('Invalid URL');
        }

        const protocol = body_content[0].startsWith('https') ? https : http;
        
        // write image to disk
        protocol.get(body_content[0], (response) => {
            if (response.statusCode !== 200) {
                console.error(`Failed to get '${body_content[0]}' (${response.statusCode})`);
                return;
            }
        
            const fileStream = fs.createWriteStream(img_path);
            response.pipe(fileStream);
        
            fileStream.on('finish', () => {
                fileStream.close(() => {
                    console.log('Image downloaded successfully');
                });
            });
        
            fileStream.on('error', (err) => {
                fs.unlink(img_path, () => {
                    console.error('Error writing to file:', err);
                });
            });
        }).on('error', (err) => {
            console.error('Error downloading image:', err);
        });


        console.log(await db.query(`UPDATE media SET media_${media_img_type} = '${file_name}' WHERE media_id = ${media_id}`));

    } catch (err) {
        console.error(err);
        return json({ message: err.message });
    }

    return json({ message: "OK" }, { status: 200 });
}