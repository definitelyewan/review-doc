import db from '$lib/server/db.js';

export const load = async ({ params }) => {
    const { score } = params;

    const media = await db.query(`
        SELECT 
            media.media_name, media.media_id, media_release_date_range_start, media_release_date_range_end, media.media_type, review.user_id,
            CASE
                WHEN (SUM(
                    CASE 
                        WHEN media.media_type = 'tv' THEN (
                            (LENGTH(review.review_sub_name) - LENGTH(REPLACE(review.review_sub_name, ' ', '')) + 1) * review.review_score
                        )
                        ELSE review.review_score 
                    END
                ) / SUM(
                    CASE 
                        WHEN media.media_type = 'tv' THEN (LENGTH(review.review_sub_name) - LENGTH(REPLACE(review.review_sub_name, ' ', '')) + 1)
                        ELSE 1
                    END
                )) - FLOOR(SUM(
                    CASE 
                        WHEN media.media_type = 'tv' THEN (
                            (LENGTH(review.review_sub_name) - LENGTH(REPLACE(review.review_sub_name, ' ', '')) + 1) * review.review_score
                        )
                        ELSE review.review_score 
                    END
                ) / SUM(
                    CASE 
                        WHEN media.media_type = 'tv' THEN (LENGTH(review.review_sub_name) - LENGTH(REPLACE(review.review_sub_name, ' ', '')) + 1)
                        ELSE 1
                    END
                )) < 0.5
                THEN FLOOR(SUM(
                    CASE 
                        WHEN media.media_type = 'tv' THEN (
                            (LENGTH(review.review_sub_name) - LENGTH(REPLACE(review.review_sub_name, ' ', '')) + 1) * review.review_score
                        )
                        ELSE review.review_score 
                    END
                ) / SUM(
                    CASE 
                        WHEN media.media_type = 'tv' THEN (LENGTH(review.review_sub_name) - LENGTH(REPLACE(review.review_sub_name, ' ', '')) + 1)
                        ELSE 1
                    END
                ))
                ELSE CEIL(SUM(
                    CASE 
                        WHEN media.media_type = 'tv' THEN (
                            (LENGTH(review.review_sub_name) - LENGTH(REPLACE(review.review_sub_name, ' ', '')) + 1) * review.review_score
                        )
                        ELSE review.review_score 
                    END
                ) / SUM(
                    CASE 
                        WHEN media.media_type = 'tv' THEN (LENGTH(review.review_sub_name) - LENGTH(REPLACE(review.review_sub_name, ' ', '')) + 1)
                        ELSE 1
                    END
                ))
            END as weighted_average_score
        FROM review
        INNER JOIN media ON review.media_id = media.media_id
        GROUP BY media.media_id, media.media_name
        HAVING weighted_average_score = ${score}
        ORDER BY media.media_name ASC
    `);

    console.log(media);

    return {
        score,
        media_data: media
    };
};