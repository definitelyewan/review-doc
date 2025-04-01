import db from '$lib/server/db.js';

/**
 * All functions in this file must return an array of media objects.
 */


/**
 * Filter by a descriptor such as studio, director, or distributor, and tag via some search string.
 * @param {String} descriptor 
 * @param {String} search 
 * @returns 
 */
async function filter_by_descriptor(descriptor, search) {
    try {
        const media = await db.query(`SELECT media.* FROM media INNER JOIN ${descriptor} INNER JOIN ${descriptor}_of 
                                    WHERE ${descriptor}.${descriptor}_name LIKE '%${db.sanitize_input(search)}%' 
                                    AND ${descriptor}.${descriptor}_id = ${descriptor}_of.${descriptor}_id 
                                    AND media.media_id = ${descriptor}_of.media_id`);
        return media;
    } catch (e){
        console.error(e);
        return [];
    }
}


async function descriptor_average_score(descriptor, search) {
    

    
    try {
        let divisor = 0;
        let denominator = 0;
        const medias = await filter_by_descriptor(descriptor, search);

        if (medias.length == 0) {
            return 0;
        }

        // math :(
        for (let media of medias) {
            const reviews_scores = await db.query(`SELECT review.review_score FROM review INNER JOIN media WHERE media.media_id = review.media_id AND review.media_id = ${media.media_id}`);

            // media can not have reviews sometimes
            if (reviews_scores.length == 0) {
                return;
            }
            for (let score of reviews_scores) {
                divisor += parseInt(score.review_score);
                denominator += 1;
            }

            
            
        }

        
        if (denominator == 0) {
            return 0;
        }

        return divisor / denominator;

    } catch(e) {
        console.error(e);
        return -1;
    }

    
}

/**
 * Filters media by genre. This genre is searched for via tags. So this is pretty much a tag search idk why we called it genre.
 * @param {String} genre 
 */
async function filter_by_genre(genre) {
    return await filter_by_descriptor("tag", genre);
}

/**
 * Filters media by a studios name
 * @param {String} studio 
 */
async function filter_by_studio(studio) {
    return await filter_by_descriptor("studio", studio);
}

/**
 * Filters media by a directors name.
 * @param {String} director 
 * @returns 
 */
async function filter_by_director(director) {
    return await filter_by_descriptor("director", director);
}

/**
 * Filters media by a distributors name.
 * @param {String} distributor 
 * @returns 
 */
async function filter_by_distributor(distributor) {
    return await filter_by_descriptor("distributor", distributor);
}


/**
 * Filters media by if a specific user has reviewed it.
 * @param {String} reviewer 
 * @returns 
 */
async function filter_by_reviewer(reviewer) {
    try {
        const media = await db.query(`SELECT media.* FROM media INNER JOIN review INNER JOIN user 
                                    WHERE media.media_id = review.media_id 
                                    AND user.user_id = review.user_id 
                                    AND user.user_name = '${db.sanitize_input(reviewer)}'`);
        return media;
    } catch (e){
        console.error(e);
        return [];
    }
}

/**
 * Get statistics on media types, including counts and average ratings
 * @param {String} userId Optional user ID to filter stats for a specific user
 * @returns {Promise<Array>} Array of media type statistics
 */
async function get_media_type_stats(userId = null) {
    try {
        let query = `
            SELECT 
                media.media_type,
                COUNT(review.review_id) as count,
                AVG(CAST(review.review_score AS DECIMAL) / CAST(review.review_limit AS DECIMAL) * 10) as avg_rating
            FROM 
                media
            INNER JOIN 
                review ON media.media_id = review.media_id
        `;
        
        // Add user filter if userId is provided
        if (userId) {
            query += ` WHERE review.user_id = ${userId} `;
        }
        
        query += `
            GROUP BY 
                media.media_type
            ORDER BY 
                count DESC
        `;
        
        const results = await db.query(query);
        
        // Format the results and ensure avg_rating is a number
        return results.map(item => ({
            mediaType: item.media_type,
            count: parseInt(item.count) || 0,
            avgRating: typeof item.avg_rating === 'number' 
                ? parseFloat(item.avg_rating.toFixed(1)) 
                : parseFloat(parseFloat(item.avg_rating).toFixed(1)) || 0
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
}

/**
 * Get statistics on media types for a specific time period
 * @param {String} startDate Start date in YYYY-MM-DD format
 * @param {String} endDate End date in YYYY-MM-DD format
 * @param {String} userId Optional user ID to filter stats for a specific user
 * @returns {Promise<Array>} Array of media type statistics
 */
async function get_media_type_stats_by_date_range(startDate, endDate, userId = null) {
    try {
        let query = `
            SELECT 
                media.media_type,
                COUNT(review.review_id) as count,
                AVG(CAST(review.review_score AS DECIMAL) / CAST(review.review_limit AS DECIMAL) * 10) as avg_rating
            FROM 
                media
            INNER JOIN 
                review ON media.media_id = review.media_id
            WHERE 
                review.review_date BETWEEN '${db.sanitize_input(startDate)}' AND '${db.sanitize_input(endDate)}'
        `;
        
        // Add user filter if userId is provided
        if (userId) {
            query += ` AND review.user_id = ${userId} `;
        }
        
        query += `
            GROUP BY 
                media.media_type
            ORDER BY 
                count DESC
        `;
        
        const results = await db.query(query);
        
        // Format the results and ensure avg_rating is a number
        return results.map(item => ({
            mediaType: item.media_type,
            count: parseInt(item.count) || 0,
            avgRating: typeof item.avg_rating === 'number' 
                ? parseFloat(item.avg_rating.toFixed(1)) 
                : parseFloat(parseFloat(item.avg_rating).toFixed(1)) || 0
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
}

/**
 * Get statistics on media types with optional filtering
 * @param {Object} filters Object containing filter options
 * @param {String} filters.releaseYear Filter by media release year
 * @param {String} filters.reviewYear Filter by review year
 * @param {String} filters.reviewer Filter by reviewer username
 * @returns {Promise<Array>} Array of media type statistics
 */
async function get_filtered_media_type_stats(filters = {}) {
    try {
        let whereConditions = [];
        let queryParams = [];
        
        let query = `
            SELECT 
                media.media_type,
                COUNT(review.review_id) as count,
                AVG(CAST(review.review_score AS DECIMAL) / CAST(review.review_limit AS DECIMAL) * 10) as avg_rating
            FROM 
                media
            INNER JOIN 
                review ON media.media_id = review.media_id
        `;
        
        // Add join for user if reviewer filter is provided
        if (filters.reviewer) {
            query += ` INNER JOIN user ON review.user_id = user.user_id `;
            whereConditions.push(` user.user_name = '${db.sanitize_input(filters.reviewer)}' `);
        }
        
        // Add release year filter
        if (filters.releaseYear) {
            whereConditions.push(` YEAR(media.media_release_date_range_start) = ${parseInt(filters.releaseYear)} `);
        }
        
        // Add review year filter
        if (filters.reviewYear) {
            whereConditions.push(` YEAR(review.review_date) = ${parseInt(filters.reviewYear)} `);
        }
        
        // Add user ID filter
        if (filters.userId) {
            whereConditions.push(` review.user_id = ${parseInt(filters.userId)} `);
        }
        
        // Add WHERE clause if there are any conditions
        if (whereConditions.length > 0) {
            query += ` WHERE ` + whereConditions.join(' AND ');
        }
        
        query += `
            GROUP BY 
                media.media_type
            ORDER BY 
                count DESC
        `;
        
        const results = await db.query(query);
        
        return results.map(item => {
            const rating = parseFloat(item.avg_rating);
            return {
                mediaType: item.media_type,
                count: parseInt(item.count) || 0,
                avgRating: !isNaN(rating) ? parseFloat(rating.toFixed(1)) : 0
            };
        });

    } catch (e) {
        console.error(e);
        return [];
    }
}

export default {
    filter_by_descriptor,
    descriptor_average_score,

    filter_by_genre,
    filter_by_studio,
    filter_by_director,
    filter_by_distributor,
    filter_by_reviewer,
    get_media_type_stats,
    get_media_type_stats_by_date_range,
    get_filtered_media_type_stats

}