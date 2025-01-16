import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import security from '$lib/server/security';
import db from '$lib/server/db.js';

/**
 * Provides a post endpoint to the instance owner to backup the database. The database will be backed up in a
 * JSON formate and stored in the backup directory.
 */
export async function POST ({ request }) {
    
    // validate the user
    const valid = await security.validate_master_api_key(request.headers.get('Authorization'));

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }

    // attempt backup
    try {

        let backup = new Object({user: [], medias: []})
        const date = new Date();
        const file_name = date.toISOString().split('T')[0] + ".json";
        
        // process users
        const users = await db.query(`SELECT * FROM user`);
        backup.user = users;


        // process media
        const medias = await db.query(`SELECT * FROM media`);
        
        for (const media of medias) {

            let block = new Object({media_id : 1, directors: [], distributors: [], studios: [], tags: [], media : {}, reviews: [], awards: []});
            const media_id = media.media_id;
            
            // deal with media table

            block.media_id = media_id;
            block.media.media_name = media.media_name;
            block.media.media_type = media.media_type;
            block.media.media_cover = media.media_cover;
            block.media.media_banner = media.media_banner;
            block.media.media_release_date_range_end = null;
            block.media.media_release_date_range_start = null;

            if (media.media_release_date_range_start != null) {
                block.media.media_release_date_range_start = media.media_release_date_range_start.toISOString().split('T')[0];
            }
            
            if (media.media_release_date_range_end != null) {
                block.media.media_release_date_range_end = media.media_release_date_range_end.toISOString().split('T')[0];
            }
            
            block.media.user_id = media.user_id;    

            // deal with review table

            let reviews = await db.query(`SELECT * FROM review WHERE media_id = ${media_id}`);

            reviews.forEach(review => {
                
                delete review.media_id;

                if (review.review_date != null) {
                    review.review_date = review.review_date.toISOString().split('T')[0];
                }
            });

            block.reviews = reviews;


            // deal with award table

            let awards = await db.query(`SELECT * FROM award WHERE media_id = ${media_id}`);

            awards.forEach(award => {
                delete award.media_id;
            });

            block.awards = awards;

            // deal with descriptor tables

            const descriptors = ['director', 'distributor', 'studio', 'tag'];

            for (const descriptor of descriptors) {
                let descriptor_values = await db.query(`SELECT ${descriptor}_name from ${descriptor} INNER JOIN ${descriptor}_of 
                                                        WHERE ${descriptor}.${descriptor}_id = ${descriptor}_of.${descriptor}_id 
                                                        AND ${descriptor}_of.media_id = ${media_id}`);
                
                for (let value of descriptor_values) {
                    block[descriptor + 's'].push(value[descriptor + '_name']);
                }
            }
            
            backup.medias.push(block);
        }


        // write backup file
        fs.writeFileSync(process.env.REVIEWER_PLUS_BACKUP_DIR + "/" + file_name, JSON.stringify(backup), {encoding: 'utf8', flag: 'w'});
    
    } catch (err) {
        console.error(err);
        return json({message : err});
    }

    return json({ message: "OK" }, {status: 200});
}