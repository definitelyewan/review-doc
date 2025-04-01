import { redirect } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import stats from '$lib/server/stats.js'

export const load = async ({ params, locals }) => {
    
    const list_name = params.list_name;                                 // used for actual table values and testing tables
    let present_descriptor_names = [];                                  // used to hunt down the right tables later
    let average_score = 0;                                              // used to return the average score
    let media = [];                                                     // used to return the media array
    let key_words = [];                                                 // array of key words with 3 or more occurances
    const descriptors = ["tag", "studio", "director", "distributor"];   // descriptor table names
    let reviewer_average_score = 0;                                     // used to return the average score of the reviewer
    let r_divisor = 0;                                                  // used to calculate the average score of the reviewer
    let r_denominator = 0;                                              // used to calculate the average score of the reviewer
    let review_dates = [];                                              // used to make a review object like {review_score, review_date}
    let years = [];                                                     // used to make a year object like {year, avg score}


    // test to see if a list with the given name exists if it does not send them home
    // done so people cant mess with the url :)
    try {
        let i = 0;
        for (i = 0; i < descriptors.length; i++) {
            let test = await db.query(`SELECT UNIQUE ${descriptors[i]}.* FROM ${descriptors[i]} INNER JOIN ${descriptors[i]}_of 
                                    WHERE ${descriptors[i]}.${descriptors[i]}_id = ${descriptors[i]}_of.${descriptors[i]}_id 
                                    AND ${descriptors[i]}.${descriptors[i]}_name = '${db.sanitize_input(list_name)}'`);
            if (test.length > 0) {
                present_descriptor_names.push(descriptors[i]);
                break;
            }
        }

        if (i == descriptors.length && present_descriptor_names.length == 0) {
            throw new Error('descriptor name not in database');
        }


    } catch(e) {
        console.error(e);
        throw redirect(303, '/');
    }

    // get the current average score and media 
    try {
        for (let descriptor_name of present_descriptor_names) {
            average_score += await stats.descriptor_average_score(descriptor_name, list_name);
            let descriptor_media = await stats.filter_by_descriptor(descriptor_name, list_name);
    
            // filter out duplicate media objects based on media_name
            const unique_media = new Map();
            descriptor_media.forEach(item => {
                if (!unique_media.has(item.media_name)) {
                    unique_media.set(item.media_name, item);
                }
            });
    
            media = Array.from(unique_media.values());
        }
        
        
        for (let item of media) {
            item.seen = false;
            
            // if the user is logged
            if (locals.user) {

                // make as seen
                const user_reviews = await db.query(`SELECT * FROM review 
                    WHERE media_id = ${item.media_id} 
                    AND user_id = ${locals.user.id}`);
        
                if (user_reviews.length > 0) {
                    item.seen = true;

                    // calculate reviewers average score fraction
                    for (let review of user_reviews) {
                        r_divisor += parseInt(review.review_score);
                    }

                    r_denominator += user_reviews.length;
                }

            
            // if the user is not logged in they have no reviews
            } else {
                reviewer_average_score = NaN;
            }
            
            // get key words
            for (let i = 0; i < descriptors.length; i++) {
                let words = await db.query(`SELECT ${descriptors[i]}.${descriptors[i]}_name FROM ${descriptors[i]} INNER JOIN ${descriptors[i]}_of 
                                            WHERE ${descriptors[i]}.${descriptors[i]}_id = ${descriptors[i]}_of.${descriptors[i]}_id 
                                            AND ${descriptors[i]}_of.media_id = ${item.media_id}`);
                for (let word of words) {
                    key_words.push(word[`${descriptors[i]}_name`]);
                }
            }

            // get reviews and years
            const reviews = await db.query(`SELECT review_score, review_date FROM review WHERE media_id = ${item.media_id}`);
            for (let review of reviews) {
                review_dates.push({review_score: parseInt(review.review_score), review_date: review.review_date.toISOString().split('-')[0]});
            }
            
        }

        const current_year = new Date().getFullYear();
        const lowest_possible_year_q = await db.query(`SELECT MIN(media_release_date_range_start) FROM media`);
        const lowest_year = lowest_possible_year_q[0][`MIN(media_release_date_range_start)`].toISOString().split('-')[0];

        for (let i = current_year; lowest_year <= i; i--) {

            const result = review_dates.filter(review => review.review_date == i.toString());

            if (result.length == 0) {
                continue;
            }

            let tmp_score = 0;
            for (let review of result) {
                tmp_score += review.review_score;
            }
            years.push({year: i, avg_score: tmp_score / result.length});


        }

        // remove any word that isnt shared at least twice
        key_words = key_words.filter((word, _, arr) => arr.filter(w => w === word).length > 2);

        // axe any duplicates and the words that generated this page
        key_words = [...new Set(key_words)];
        key_words = key_words.filter(word => word.toLowerCase() !== list_name.toLowerCase());

        // calculate user average score if they have seen anything
        if (r_denominator > 0 && locals.user) {
            reviewer_average_score = r_divisor / r_denominator;
        }

    } catch(e) {
        console.error(e);
        return {average_score, media, key_words, reviewer_average_score, years};
    }

    return {average_score, media, key_words, reviewer_average_score, years};

};