import dotenv from 'dotenv';

dotenv.config();

const access_token = process.env.REVIEWER_PLUS_TMDB_READ_ACCESS_TOKEN;


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