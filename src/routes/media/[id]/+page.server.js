
import db from '$lib/server/db.js';
import igdb from '$lib/server/igdb.js';
import { redirect } from '@sveltejs/kit';
import security from '$lib/server/security';
import tmdb from '$lib/server/tmdb';


export const load = async({params, locals}) => {
    
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



    /**
     * user panel load
     */

    let user_reviews = [];
    let user_awards = [];

    // just return if nobody is logged in
    if (locals.user === undefined) {
        return {
            media_data: media_data,
            user_reviews: [],
            user_awards: []
        };  
    }

    try {
        
        const current_year = new Date().getFullYear();
        const user_reviews_unflitered = await db.query(`SELECT * FROM review WHERE media_id = ${params.id} AND user_id = ${locals.user.id}`);
        const user_awards_unfiltered = await db.query(`SELECT * FROM award WHERE media_id = ${params.id} AND user_id = ${locals.user.id} AND award_issue_year = ${current_year}`);
        
        user_reviews_unflitered.forEach(review => {
            review.review_date = review.review_date.toISOString().split('T')[0];
            
            user_reviews.push({
                label: `${review.review_score}/10 from ${review.review_date}`,
                value: {
                    review_id: review.review_id,
                    media_id: review.media_id,
                    review_score: review.review_score,
                    review_bullets: review.review_bullets,
                    review_platform: review.review_platform,
                    review_sub_name: review.review_sub_name
                }
            });
        });

        user_awards_unfiltered.forEach(award => {
            
            user_awards.push({
                label: award.award_name,
                value: {
                    award_id: award.award_id,
                    award_issue_year: award.award_issue_year,
                    award_status: award.award_status
                }
            });

        });
        

    } catch {
        return {
            media_data: media_data,
            user_reviews: [],
            user_awards: []
        };
    }

    return {
        media_data: media_data,
        user_reviews: user_reviews,
        user_awards: user_awards
    };

}

export const actions = {
    add_review: async ({request, locals}) => {

        const form_data = await request.formData();
        const review_score = form_data.get('review_score');
        const review_bullets = form_data.get('review_bullets');
        const media_id = form_data.get('media_id');
        let review_sub_name = form_data.get('review_sub_name');
        let review_platform = form_data.get('review_platform');
    
        if (review_bullets.length === 0) {
          return { success: false, message: 'Review is empty' };
    
        }


        review_sub_name = review_sub_name.length === 0 ? null : review_sub_name;
        review_platform = review_platform.length === 0 ? null : review_platform;
        let review_json = new Object([]);
    
        for (let bullet of review_bullets.split('\n')) {
            review_json.push(bullet);
        }
    
        const media = await db.query(`SELECT media_name, media_type, media_release_date_range_end FROM media WHERE media_id = ${media_id}`);
        const media_name = media[0].media_name;
        const old_last_air_date = media[0].media_release_date_range_end;
        const media_type = media[0].media_type;
        

        if (media_type === 'tv' && review_sub_name === null) {
          return { success: false, message: 'TV Shows require a a version or season' };
        }

        // update tv show cover and dates just in case new seasons come out
        if (media_type === 'tv') {
          try {
          
            const tmdb_init = await tmdb.query('GET', `search/multi?query=${media_name}&include_adult=true&language=en-US&page=1`);
      
      
            for (let tmdb_result of tmdb_init.results) {
      
              if (tmdb_result.media_type !== 'tv' && media_name !== tmdb_result.nam) {
                continue;
              }
      
              const details = await tmdb.query('GET', `${tmdb_result.media_type}/${tmdb_result.id}`);
      
              // continue checking until the date is different
              if (details.last_air_date === old_last_air_date) {
                continue;
              }
      
              const cover_url = `https://image.tmdb.org/t/p/original${tmdb_result.poster_path}`;
              const new_last_air_date = details.last_air_date;
              await security.download_image(cover_url, media_id, 'cover');
              await db.query(`UPDATE media SET media_release_date_range_end = '${new_last_air_date}' WHERE media_id = ${media_id}`);
              
            }
          } catch (error) {
            return { success: false, message: 'Failed to download a new cover image or update the end date. Try again later tmdb may be down :(' };
          }
        }
    
        await db.query(`INSERT INTO review(media_id, review_sub_name, review_bullets, review_score, review_platform, user_id) 
          VALUES(${media_id}, ${review_sub_name ? `'${db.sanitize_input(review_sub_name)}'` : 'NULL'}, '${db.sanitize_input(JSON.stringify(review_json))}', '${review_score}',  ${review_platform ? `'${db.sanitize_input(review_platform)}'` : 'NULL'}, ${locals.user.id})`);
    
        return { success: true };
    },
    delete_review: async ({request}) => {
        const form_data = await request.formData();
        const review_id = form_data.get('review_id');

        if (review_id === null) {
            return { success: false, message: 'Permission denied! please refresh the page and try again.' };
        }


        await db.query(`DELETE FROM review WHERE review_id = ${review_id}`);
        return { success: true };
    },
    update_review: async ({request}) => {
      
      const form_data = await request.formData();
      const review_score = form_data.get('review_score');
      const review_bullets = form_data.get('review_bullets');
      const review_id = form_data.get('review_id');
      let review_sub_name = form_data.get('review_sub_name');
      let review_platform = form_data.get('review_platform');
      
  
      if (review_bullets.length === 0) {
        return { success: false, message: 'Review is empty' };
  
      }
    
      if (review_id === null) {
        return { success: false, message: 'Permission denied! please refresh the page and try again.' };
     }
  
      review_sub_name = review_sub_name.length === 0 ? null : review_sub_name;
      review_platform = review_platform.length === 0 ? null : review_platform;
      
      let review_json = [];
      
      for (let bullet of review_bullets.split('\n')) {
        review_json.push(bullet);
      }
      
      await db.query(`UPDATE review SET review_score = ${review_score}, review_bullets = '${db.sanitize_input(JSON.stringify(review_json))}', review_sub_name = ${review_sub_name ? `'${db.sanitize_input(review_sub_name)}'` : 'NULL'}, review_platform = ${review_platform ? `'${db.sanitize_input(review_platform)}'` : 'NULL'} 
                      WHERE review_id = ${review_id}`);
      return { success: true };
    },
    nominate_media: async ({request, locals}) => {
        const form_data = await request.formData();
        const award_name = form_data.get('award_name');
        const media_id = form_data.get('media_id');
        const year = new Date().getFullYear();

        if (award_name === undefined) {
            return {success: false, message: 'No award picked'};
        }

        if (media_id === undefined) {
            return {success: false, message: 'No media selected'};
        }

        try {

            const did_user_review = await db.query(`SELECT * FROM review WHERE user_id = ${locals.user.id} AND media_id = ${media_id} AND review_date BETWEEN '${year}-01-01' AND '${year}-12-31'`);
        
            if (did_user_review.length === 0) {
              throw new Error('User did not review this media this year');
            }
      
          } catch (error) {
            return {success: false, message: error.message};
        }
      
        // check if user already nominated this

        try {
            const already_nominated = await db.query(`SELECT * FROM award WHERE media_id = ${media_id} AND user_id = ${locals.user.id} AND award_issue_year = ${year} AND award_name = '${award_name}'`);
            if (already_nominated.length > 0) {
                const drop = await db.query(`DELETE FROM award WHERE media_id = ${media_id} AND user_id = ${locals.user.id} AND award_issue_year = ${year} AND award_name = '${award_name}'`);
                return {success: true, message: 'Removed nomination'};
            }

            const res = await db.query(`INSERT INTO award(award_name, award_issue_year, media_id, user_id) VALUES('${award_name}', '${year}', ${media_id}, ${locals.user.id})`);
        } catch (error) {
            console.error('Database query failed:', error);
            return {success: false, message: 'Try again later'};
        }

        return {success: true};
    },
    grant_award: async ({request, locals}) => {
        
        const form_data = await request.formData();
        const media_id = form_data.get('award_id');
        const current_month = new Date().getMonth() + 1;

        if (media_id === undefined) {
            return {success: false, message: 'No award picked'};
        }

        if (current_month < 12) {
            return {success: false, message: 'You can only grant awards in December'};
        }

        try {
            let nom = '';
            const award = await db.query(`SELECT * FROM award WHERE award_id = ${media_id}`);
            if (award.length === 0) {
                throw new Error('Award not found');
            }


            if (award[0].award_status === 'winner') {
                nom = 'nominee';
            } else {
                nom = 'winner';
            }

            const update = await db.query(`UPDATE award SET award_status = '${nom}' WHERE award_id = ${media_id}`);

        } catch (error) {
            return {success: false, message: error.message};
        }

        return {success: true};
    }
}