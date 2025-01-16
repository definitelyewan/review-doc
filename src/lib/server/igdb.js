/**
 * A module for interacting with Twitch's IGDB API
 */

import dotenv from 'dotenv';

// connects to a instance of mariadb using a .env file in the project directory
dotenv.config();

const credentials = {
    base_url: 'https://id.twitch.tv/oauth2/token',
    client_id: process.env.REVIEWER_PLUS_IGDB_CLIENT_ID,
    client_secret: process.env.REVIEWER_PLUS_IGDB_SECRET_ID,
    grant_type: 'client_credentials',
    auth: null
}

/**
 * Uses the client_id and client_secret to authenticate with the Twitch api
 */
async function twitch_auth() {
    try {
        const response = await fetch(`${credentials.base_url}?client_id=${credentials.client_id}&client_secret=${credentials.client_secret}&grant_type=${credentials.grant_type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) {
            console.error(response);
            throw new Error('Network response was not ok');
        }

        credentials.auth = await response.json();

    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

twitch_auth();


/**
 * Querys a given IGDB base_url with a given endpoint query 
 * @param {String} base_url 
 * @param {String} query 
 * @returns 
 */
async function query(base_url, query) {
    try {
        const response = await fetch(`https://api.igdb.com/v4/${base_url}`, {
            method: 'POST',
            headers: {
                'Client-ID': credentials.client_id,
                'Authorization': `${credentials.auth.token_type} ${credentials.auth.access_token}`,
            },
            body: query
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