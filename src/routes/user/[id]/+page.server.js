import db from '$lib/server/db.js';

export const load = async (loadEvent) => {

    const { fetch, params } = loadEvent;

    let newest_reviews = await db.query(`SELECT review_id, media_id, review_score, review_sub_name FROM review WHERE user_id = ${params.id} ORDER BY review_date DESC LIMIT 20`);

    newest_reviews = await Promise.all(newest_reviews.map(async review => {
        let media = await db.query(`SELECT media_id, media_name, media_type FROM media WHERE media_id = ${review.media_id} LIMIT 1`);
        
        review.media = media[0];
        delete review.media_id;
        return review;
    }));
    
    // get the most acclaimed stuff
    const most_acclaimed = await db.query(`
        SELECT media.media_id, media.media_name, COUNT(review.review_score) AS total_reviews, 
               SUM(CASE WHEN review.review_score IN (10) THEN 1 ELSE 0 END) AS high_score_reviews 
        FROM media 
        INNER JOIN review ON media.media_id = review.media_id 
        WHERE review.user_id = ${params.id} 
        GROUP BY media.media_id, media.media_name 
        HAVING high_score_reviews >= 1
        ORDER BY high_score_reviews DESC 
        LIMIT 20
    `);

    const score_counts = await db.query(`SELECT CAST(review_score AS INT) as review_score, COUNT(review_score) as count FROM review WHERE user_id = ${params.id} GROUP BY CAST(review_score AS INT) ORDER BY review_score ASC;`);


    const users = await db.query(`SELECT user_id, user_name FROM user WHERE user_id = ${params.id} LIMIT 1`);
    const user = users[0];

    return {newest_reviews, most_acclaimed, score_counts, user};
}