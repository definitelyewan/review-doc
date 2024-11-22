
import db from '$lib/server/db.js';
import igdb from '$lib/server/igdb.js';
import { redirect } from '@sveltejs/kit';
import security from '../../lib/server/security';
import tmdb from '../../lib/server/tmdb';


export const load = async ({ locals }) => {

    if (locals.user == undefined) {
      redirect('/login');
    }

    return {
        user: locals.user, 
    }

}

export const actions = {

  user_reviews: async ({locals}) => {

    const user_reviews = await db.query(`SELECT media.media_id, review.review_id, review.review_date, media.media_name, review.review_score, review.review_bullets, review.review_sub_name, review.review_platform  
                                        FROM review INNER JOIN media WHERE review.user_id = ${locals.user.id} AND media.media_id = review.media_id`);
  
    let searchable_reviews = [];

    user_reviews.forEach(review => {
      searchable_reviews.push({
        label: `${review.media_name} (${review.review_score}/10, ${new Date(review.review_date).toLocaleDateString('en-CA')})`,
        value: {
          media_id: `${review.media_id}`,
          review_id: `${review.review_id}`,
          score: review.review_score,
          bullets: review.review_bullets,
          review_platform: review.review_platform,
          review_sub_name: review.review_sub_name
        }
      });
    });
    
    return { search: searchable_reviews };
  },
  all_media: async () => {
    const medias = await db.query(`SELECT media_id, media_name, media_release_date_range_start, media_type FROM media`);
    let searchable_media = [];

    medias.forEach(media => {
      let release_year = new Date(media.media_release_date_range_start).getFullYear();;

      searchable_media.push({
        label: `${media.media_name} (${release_year})`,
        value: {
          media_id: `${media.media_id}`
        }
      });
    });

    return { search: searchable_media };
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
  delete_review: async ({request}) => {
    const form_data = await request.formData();
    const review_id = form_data.get('review_id');
    await db.query(`DELETE FROM review WHERE review_id = ${review_id}`);
    return { success: true };
  },
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
  all_types: async () => {
    //  enum('movie','tv','game','book','web','music','other') 
    const types = ['movie','tv','game','book','web','music','other'];
    let searchable_types = [];

    types.forEach(type => {
      searchable_types.push({
        label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
        value: {
          media_type: `${type}`
        }
      });
    });

    return { search: searchable_types };
  },
  igdb_search: async ({request}) => {
    const form_data = await request.formData();
    const media_search_word = form_data.get('media_search_word');
    const igdb_init = await igdb.query('games',`fields *; search "${media_search_word}"; where (version_parent = null & (category = 0 | category = 10 | category = 8 | category = 4 | category = 9));limit 10;`);
    
    let igdb_json = [];
    let usable_db = [];

    for (let game of igdb_init) {
      let multiquery = new String();

      // add cover data
      multiquery += (`query covers "cover" { fields id, game, url; where game = ${game.id};limit 1;};`);
      // add artwork data
      multiquery += (`query artworks "artwork" { fields id, game, url; where game = ${game.id};limit 1;};`);
      
      // add franchise data
      if (game.franchises != undefined) {
        
        multiquery += (`query franchises "franchise" { fields name; where id = (`);

        for (let franchise of game.franchises) {
          multiquery += franchise + ',';
        }
        multiquery = multiquery.slice(0, -1);
        multiquery += (`);};`);
      }

      // // add themes data
      if (game.themes != undefined) {
        multiquery += (`query themes "themes" { fields name; where id = (`);
        for (let theme of game.themes) {
          multiquery += theme + ',';
        }
        multiquery = multiquery.slice(0, -1);
        multiquery += (`);};`);
      }

      // add genre data
      if (game.genres != undefined) {
        multiquery += (`query genres "genres" { fields name; where id = (`);
        for (let genre of game.genres) {
          multiquery += genre + ',';
        }
        multiquery = multiquery.slice(0, -1);
        multiquery += (`);};`);
      }

      // companies
      multiquery += (`query companies "distributor" { fields name; where published = (${game.id});};`);
      multiquery += (`query companies "studios" { fields name; where developed = (${game.id});};`);

      // get game data again
      multiquery += (`query games "game" { fields id, first_release_date, name; where id = ${game.id};limit 1;};`);
      console.log(multiquery);
      const block = await igdb.query('multiquery', multiquery);
      igdb_json.push(block);
    }


    for (let block of igdb_json) {

      let cover_url = '';
      let banner_url = '';
      let tags = [];
      let distributor = [];
      let studios = [];
      let name = '';
      let release_date = '';

      for (let inner_block of block) {
        
        if (inner_block.name === 'cover') {
          if (inner_block.result[0] != undefined) {
            cover_url = inner_block.result[0].url.replace('t_thumb', 't_cover_big');
            cover_url = cover_url.replace('//', 'https://');
          }

        } else if (inner_block.name === 'artwork') {
          if (inner_block.result[0] != undefined) {
            banner_url = inner_block.result[0].url.replace('t_thumb', 't_720p');
            banner_url = banner_url.replace('//', 'https://');

          }
        } else if (inner_block.name === 'franchise') {
          for (let franchise of inner_block.result) {
            tags.push(franchise.name);
          }
        } else if (inner_block.name === 'themes') {
          for (let theme of inner_block.result) {
            tags.push(theme.name);
          }
        } else if (inner_block.name === 'genres') {
          for (let genre of inner_block.result) {
            let name_before_bracket = genre.name.split('(')[0].trim();
            tags.push(name_before_bracket);
          }
        } else if (inner_block.name === 'distributor') {
          for (let company of inner_block.result) {
            distributor.push(company.name);
          }
        } else if (inner_block.name === 'studios') {
          for (let company of inner_block.result) {
            studios.push(company.name);
          }
        } else if (inner_block.name === 'game') {
          name = inner_block.result[0].name;

          const date = new Date(inner_block.result[0].first_release_date * 1000);

          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');

          release_date = `${year}-${month}-${day}`;
        }
      }

      usable_db.push({
        cover_url: cover_url,
        banner_url: banner_url,
        tags: tags,
        distributors : distributor,
        studios: studios,
        name: name,
        release_date: release_date

      });
    }

    return {lookup: usable_db};
  },
  add_media: async ({request, locals}) => {
    const form_data = await request.formData();
    const media_name = form_data.get('media_name');
    const media_type = form_data.get('media_type');
    const media_cover_path = form_data.get('media_cover_path');
    const media_banner_path = form_data.get('media_banner_path');
    const media_tags = form_data.get('media_tags');
    const media_distributor = form_data.get('media_distributor');
    const media_studios = form_data.get('media_studios');
    const media_release_date_range_start = form_data.get('media_release_date_range_start');
    const media_release_date_range_end = form_data.get('media_release_date_range_end');
    const media_directors = form_data.get('media_directors');

    console.log(await db.query(`INSERT INTO media(media_name, media_type, media_release_date_range_start, media_release_date_range_end, user_id)
            VALUES('${db.sanitize_input(media_name)}', '${media_type}', '${media_release_date_range_start}', ${media_release_date_range_end ? `'${media_release_date_range_end}'` : 'NULL'}, ${locals.user.id})`));
    
    const result = await db.query(`SELECT media_id FROM media WHERE media_id = (SELECT MAX(media_id) FROM media)`);
    const media_id = result[0].media_id;

    if (media_tags !== null) {
      for (let tag of media_tags.split(',')) {
        const good_tag = db.sanitize_input(tag);
        await db.query(`INSERT INTO tag(tag_name) VALUES('${good_tag}')`);
        await db.query(`INSERT INTO tag_of (media_id, tag_id) 
                        VALUES(${media_id}, (SELECT tag_id FROM tag WHERE tag_name = '${good_tag}' LIMIT 1))`);
      }
    }


    if (media_studios !== null) {
      for (let studio of media_studios.split(',')) {
        const good_studio = db.sanitize_input(studio);
        await db.query(`INSERT INTO studio(studio_name) VALUES('${good_studio}')`);
        await db.query(`INSERT INTO studio_of (media_id, studio_id) 
                        VALUES(${media_id}, (SELECT studio_id FROM studio WHERE studio_name = '${good_studio}' LIMIT 1))`);
      }
    }

    if (media_distributor !== null) {
      for (let distributor of media_distributor.split(',')) {
        const good_distributor = db.sanitize_input(distributor);
        await db.query(`INSERT INTO distributor(distributor_name) VALUES('${good_distributor}')`);
        await db.query(`INSERT INTO distributor_of (media_id, distributor_id) 
                        VALUES(${media_id}, (SELECT distributor_id FROM distributor WHERE distributor_name = '${good_distributor}' LIMIT 1))`);
      }
    }

    if (media_directors !== null) {
      for (let director of media_directors.split(',')) {
        const good_director = db.sanitize_input(director);
        await db.query(`INSERT INTO director(director_name) VALUES('${good_director}')`);
        await db.query(`INSERT INTO director_of (media_id, director_id) 
                        VALUES(${media_id}, (SELECT director_id FROM director WHERE director_name = '${good_director}' LIMIT 1))`);
      }
    }

    await security.download_image(media_cover_path, media_id, 'cover');
    await security.download_image(media_banner_path, media_id, 'banner');

  },
  tmdb_search: async ({request}) => {
    const form_data = await request.formData();
    const media_search_word = form_data.get('media_search_word');
    const media_type = form_data.get('media_type');
    console.log(media_search_word);
    const tmdb_init = await tmdb.query('GET', `search/multi?query=${media_search_word}&include_adult=true&language=en-US&page=1`);
    let tmdb_json = [];



    for (let tmdb_result of tmdb_init.results) {

      if (tmdb_result.media_type !== media_type) {
        continue;
      }

      let cover_url = '';
      let banner_url = '';
      let release_date_start = '';
      let release_date_end = null;
      let name = '';
      let tags = [];
      let directors = [];
      let studios = [];
      let distributors = [];

      // media name
      if (tmdb_result.media_type === 'movie') {
        name = tmdb_result.title;
      } else if (tmdb_result.media_type === 'tv') {
        name = tmdb_result.name;
      }
      

      // media images
      if (tmdb_result.poster_path !== null) {
        cover_url = `https://image.tmdb.org/t/p/original${tmdb_result.poster_path}`;
      }
      if (tmdb_result.backdrop_path !== null) {
        banner_url = `https://image.tmdb.org/t/p/original${tmdb_result.backdrop_path}`;
      }

      const details = await tmdb.query('GET', `${tmdb_result.media_type}/${tmdb_result.id}`);

      if (tmdb_result.media_type === 'movie') {
        
        const credits = await tmdb.query('GET', `/movie/${tmdb_result.id}/credits`);
        
        for (let crew of credits.crew) {
          if (crew.job === 'Director') {
            directors.push(crew.name);
          }
        }

        
        release_date_start = details.release_date;

        /**
         * No way to seperate distributors and studios so they will just all be added as studios
         */

      } else if (tmdb_result.media_type === 'tv') {
        release_date_start = details.first_air_date;
        release_date_end = details.last_air_date;

        for (let creator of details.created_by) {
          directors.push(creator.name);
        }

        for (let network of details.networks) {
          distributors.push(network.name);
        }

      }

      for (let studio of details.production_companies) {
        studios.push(studio.name);
      }

      for (let genre of details.genres) {
        for (let split_genre of genre.name.split('&')) {
          tags.push(split_genre);

        }
      }

      tmdb_json.push({
        cover_url: cover_url,
        banner_url: banner_url,
        tags: tags,
        distributors : distributors,
        studios: studios,
        directors: directors,
        name: name,
        release_date_start: release_date_start,
        release_date_end: release_date_end

      });
    }

    return ({lookup: tmdb_json});
  },
  reviewed_this_year: async ({locals}) => {

    const media = await db.query(`SELECT media.* FROM media INNER JOIN review WHERE media.media_id = review.media_id AND review.user_id = ${locals.user.id} AND YEAR(review.review_date) = YEAR(CURDATE())`);
  
    let searchable_media = [];
    media.forEach(info => {
      searchable_media.push({
        label: `${info.media_name}`,
        value: {
          media_name: info.media_name,
          media_type: info.media_type,
          media_id: info.media_id
        }
      });
    });


    return {search: searchable_media};
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
        const already_nominated = await db.query(`SELECT * FROM award WHERE media_id = ${media_id} AND user_id = ${locals.user.id} AND award_issue_year = ${year} AND award_name = '${award_name}'`);
        
        if (already_nominated.length > 0) {
            return {success: false, message: 'Already nominated'};
        }

        const res = await db.query(`INSERT INTO award(award_name, award_issue_year, media_id, user_id) VALUES('${award_name}', '${year}', ${media_id}, ${locals.user.id})`);
    } catch (error) {
        console.error('Database query failed:', error);
        return {success: false, message: 'Try again later'};
    }

    return {success: true};
  }
};