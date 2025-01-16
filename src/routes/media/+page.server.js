/**
 * Backend code for the media page to function
 */

import db from '$lib/server/db.js';
import igdb from '$lib/server/igdb.js';
import tmdb from '$lib/server/tmdb.js';
import security from '$lib/server/security';

/**
 * On page load get all media from the database
 */
export const load = async(loadEvent) => {

    const media = await db.query('SELECT * FROM media ORDER BY media_name ASC');
    
    let media_data = new Object({media: []});
    let media_options = [];

    media.forEach(info => {
        let start = info.media_release_date_range_start.toISOString().split('T')[0];
        let end = null;

        if (info.media_release_date_range_end != null) {
            end = info.media_release_date_range_end.toISOString().split('T')[0];
        }

        media_options.push({
            label: info.media_name,
            value: {
                id: info.media_id,
                release_start: start,
                release_end: end,
                sub_name: info.media_sub_name,
                type : info.media_type
            }
        });
    });


    media_data.media = media_options;
    return {media_data};

}

/**
 * Gets all related games that match a search term from igdb
 * @param {String} media_search_word 
 * @returns 
 */
async function igdb_search(media_search_word) {

    //query igdb for games
    const igdb_init = await igdb.query('games',`fields *; search "${media_search_word}"; where (version_parent = null & (category = 0 | category = 10 | category = 8 | category = 4 | category = 9));limit 10;`);
    
    let igdb_json = [];
    let usable_db = [];

    // secndary query to get more information about the games
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

    // sort through the data and get the relevant information
    for (let block of igdb_json) {

      let cover_url = '';
      let banner_url = '';
      let tags = [];
      let distributor = [];
      let studios = [];
      let name = '';
      let release_date = '';

      for (let inner_block of block) {
        
        // get the cover and banner images
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
        
        // get the tags
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
        // get the companies
        } else if (inner_block.name === 'distributor') {
          for (let company of inner_block.result) {
            distributor.push(company.name);
          }
        } else if (inner_block.name === 'studios') {
          for (let company of inner_block.result) {
            studios.push(company.name);
          }
        // game name
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
        release_date_start: release_date,
        release_date_end: null,
        media_type: 'game'

      });
    }

    return {usable_db};
}

/**
 * Gets all related media that match a search term from tmdb
 * @param {String} media_search_word 
 * @returns 
 */
async function tmdb_search(media_search_word) {
    
    // query tmdb for media
    const tmdb_init = await tmdb.query('GET', `search/multi?query=${media_search_word}&include_adult=true&language=en-US&page=1`);
    let tmdb_json = [];



    for (let tmdb_result of tmdb_init.results) {

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

      // can be empty so confirm its an array
      if (Array.isArray(details.production_companies)) {
        for (let studio of details.production_companies) {
            studios.push(studio.name);
        }
      }

      // can be empty so confirm its an array
      if (Array.isArray(details.genres)) {
        for (let genre of details.genres) {
          for (let split_genre of genre.name.split('&')) {
            tags.push(split_genre);

          }
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
        release_date_end: release_date_end,
        media_type: tmdb_result.media_type

      });
    }

    return (tmdb_json);
 
}

/**
 * Form actions
 */
export const actions = {

    /**
     * Search for media from igdb and tmdb
     */
    search_sites: async ({request}) => {
        const form_data = await request.formData();
        const media_search_word = form_data.get('media_search_word');


        let lookup = {};

        try {
            const igdb_s = await igdb_search(media_search_word);
            const tmdb_s = await tmdb_search(media_search_word);
            lookup = igdb_s.usable_db;
            lookup = lookup.concat(tmdb_s);
            
        } catch (error) {
            return {success: false, message: error.message, lookup: lookup};
        }

        return {lookup: lookup};
    },

    /**
     * Adds a new peice of media to the database
     */
    add_media: async ({request, locals}) => {

        // get frontend data and filter it
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
    

        if (media_name == null) {
            return {success: false, message: 'Media name is required'};
        }

        if (media_cover_path == null) {
            return {success: false, message: 'Media cover is required'};
        }

        if (media_release_date_range_start == null) {
            return {success: false, message: 'Media release date is required'};
        }

        console.log(await db.query(`INSERT INTO media(media_name, media_type, media_release_date_range_start, media_release_date_range_end, user_id)
                VALUES('${db.sanitize_input(media_name)}', '${media_type}', '${media_release_date_range_start}', ${media_release_date_range_end ? `'${media_release_date_range_end}'` : 'NULL'}, ${locals.user.id})`));
        
        const result = await db.query(`SELECT media_id FROM media WHERE media_id = (SELECT MAX(media_id) FROM media)`);
        const media_id = result[0].media_id;
        
        // sp,it manual info
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
        
        // download images
        await security.download_image(media_cover_path, media_id, 'cover');

        if (media_banner_path !== null) {
          await security.download_image(media_banner_path, media_id, 'banner');
        }


        return {success: true};
    }

};