import db from '$lib/server/db.js'

export const load = async (loadEvent) => {
    
    const { params } = loadEvent;

    const user_id = params.id;


    const info = await db.query(`
        SELECT media.media_type, media.media_id, media.media_name, media.media_cover, media.media_banner, review.review_id, review.review_sub_name, review.review_bullets, review.review_score, review.review_date 
        FROM media 
        INNER JOIN review 
        ON media.media_id = review.media_id 
        WHERE review.user_id = ${user_id} 
        ORDER BY review.review_date DESC
    `);
    let review_data = [];

    info.forEach(review => {

        let usable_sub_name = null;

        if (review.review_sub_name != null) {
            if (review.media_type == 'tv') {
                let seasons = review.review_sub_name.split(' ');
                usable_sub_name = `Season ${seasons[0]}`;

                if (seasons.length > 1) {
                    usable_sub_name += ` - ${seasons[seasons.length - 1]}`;
                }

            } else {
                usable_sub_name = review.review_sub_name;
            } 
        }


        review_data.push({
            label: review.media_name,
            value: {
                // media values
                media_id: review.media_id,
                media_name: review.media_name,
                media_cover: review.media_cover,
                media_banner: review.media_banner,

                // review values
                review_id: review.review_id,
                review_sub_name: usable_sub_name,
                review_bullets: review.review_bullets,
                review_score: review.review_score
            }
        });


        
    });

    return {lookup: review_data};
}