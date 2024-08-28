
import db from '$lib/server/db.js';


export const load = async(loadEvent) => {

    const { fetch, params } = loadEvent;
    
    let media_data = new Object({media: {}, reviews: [], awards: [], studios: [], distributors: [], directors: [], tags: [], users : []});

    let unique_seasons = [];
    let reviews_by_seasons = new Object();
    const media = await db.query(`SELECT * FROM media WHERE media_id = ${params.id}`);
    const reviews = await db.query(`SELECT * FROM review WHERE media_id = ${params.id}`);
    const awards = await db.query(`SELECT * FROM award WHERE media_id = ${params.id} AND award_status = 'winner'`)

    media[0].media_release_date_range_start = media[0].media_release_date_range_start.toISOString().split('T')[0];

    if (media[0].media_release_date_range_end != null) {
        media[0].media_release_date_range_end = media[0].media_release_date_range_end.toISOString().split('T')[0];
    }

    for (const review of reviews) {
        review.review_date = review.review_date.toISOString().split('T')[0];

        if (media[0].media_type == 'tv') {
            unique_seasons.push(review.review_sub_name);
        } else if (media[0].media_type == 'web') {
            unique_seasons.push(review.review_sub_name);
        }
    }

    media_data.reviews = reviews;

    // if unique seasons isnt empty sort by it
    if (unique_seasons.length > 0) {
        unique_seasons.sort();

        for (let unique_season of unique_seasons) {
            reviews_by_seasons[unique_season] = [];
            for (let review of reviews) {
                if (review.review_sub_name == unique_season) {
                    reviews_by_seasons[unique_season].push(review);
                }
            }
        }

        //idk replace the array that already exists
        media_data.reviews = reviews_by_seasons;
    }

    const studios = await db.query(`SELECT studio_name from studio INNER JOIN studio_of WHERE studio.studio_id = studio_of.studio_id AND studio_of.media_id = ${params.id}`);
    const distributors = await db.query(`SELECT distributor_name from distributor INNER JOIN distributor_of WHERE distributor.distributor_id = distributor_of.distributor_id AND distributor_of.media_id = ${params.id}`);
    const directors = await db.query(`SELECT director_name from director INNER JOIN director_of WHERE director.director_id = director_of.director_id AND director_of.media_id = ${params.id}`);
    const tags = await db.query(`SELECT tag_name from tag INNER JOIN tag_of WHERE tag.tag_id = tag_of.tag_id AND tag_of.media_id = ${params.id}`);

    media_data.media = media[0];
    media_data.awards = awards;

    for (const tag of tags) {
        media_data.tags.push(tag.tag_name);
    }

    for (const studio of studios) {
        media_data.studios.push(studio.studio_name);
    }

    for (const distributor of distributors) {
        media_data.distributors.push(distributor.distributor_name);
    }

    for (const director of directors) {
        media_data.directors.push(director.director_name);
    }

    for (const review of reviews) {
        const user = await db.query(`SELECT user_id, user_name FROM user WHERE user_id = ${review.user_id} LIMIT 1`);

        media_data.users.push(user[0]);
    }

    return {media_data};

}