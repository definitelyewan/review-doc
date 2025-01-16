
import db from '$lib/server/db.js';

export const load = async ({ locals }) => {

    if (locals.user == undefined) {
      return {
        user: locals.user, 
        user_reviews: null,
        media: null
      }
    }

    // unused can be removed
    const user_reviews = await db.query(`SELECT media.media_id, review.review_id, review.review_date, media.media_name, review.review_score, review.review_bullets, review.review_sub_name, review.review_platform  
                                        FROM review INNER JOIN media WHERE review.user_id = ${locals.user.id} AND media.media_id = review.media_id`);
    
    const media = await db.query(`SELECT media_id, media_name, media_type FROM media`);

    return {
        user: locals.user, 
        user_reviews: null,
        media: null
    }

}