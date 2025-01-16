/**
 * A module for interacting with the TMDB api
 */

import dotenv from 'dotenv';

// connects to a instance of mariadb using a .env file in the project directory
dotenv.config();

const access_token = process.env.REVIEWER_PLUS_TMDB_READ_ACCESS_TOKEN;

/**
 * Querys a given TMDB endpoint with a given query
 * @param {String} method 
 * @param {String} query 
 * @returns JSON
 */
async function query(method, query) {


    query = query.replace(/ /g, '%20');

    try {
        const response = await fetch(`https://api.themoviedb.org/3/${query}`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${access_token}`,
            }
        });

        if (!response.ok) {
            console.error(response);
            throw new Error('Network response was not ok');
        }

        return await response.json();

    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }

}

export default {
    query
}