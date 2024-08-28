
import db from '$lib/server/db.js';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import path from 'path';
import fs from 'fs';

dotenv.config();

/**
 * checks to see if the master api key was given
 * @param {string} key 
 * @returns 
 */
function validate_master_api_key(key) {
    return key === process.env.REVIEWER_PLUS_MASTER_API_KEY ? true : false;

}


/**
 * checks if the api key given matches a valid user
 * @param {string} key 
 * @returns 
 */
async function validate_api_key(key) {

    if (validate_master_api_key(key)) {
        return true;
    }

    try {
        const user = await db.query(`SELECT * FROM user WHERE user_api_key = '${db.sanitize_input(key)}' LIMIT 1`);

        if (!(user[0].user_api_key === key)){
            throw new Error('Invalid API Key');
        }

    } catch (err) {
        console.error(err);
        return false;
    }

    return true;
}

/**
 * checks if the date given is in the correct format
 * @param {string} date 
 * @returns 
 */
function validate_date(date) {
    date = db.sanitize_input(date);
    return date.match(/^\d{4}-\d{2}-\d{2}$/);
}


async function validate_user_privilege(user_id, privilege) {
    try {
        const user = await db.query(`SELECT * FROM user WHERE user_id = ${user_id} LIMIT 1`);

        if (!user[0].type === privilege) {
            throw new Error('Insufficient Privileges');
        }

    } catch (err) {
        console.error(err);
        return false;
    }

    return true;
}

/**
 * Checks to see if a URL exists
 * @param {string} url 
 * @returns {Promise<boolean>}
 */
function validate_url(url) {
    return new Promise((resolve, reject) => {
        try {
            const parsed_url = new URL(url);
            if (parsed_url.protocol !== 'http:' && parsed_url.protocol !== 'https:') {
                return reject(new Error('Invalid protocol. Only http and https are supported.'));
            }

            const protocol = parsed_url.protocol === 'https:' ? https : http;

            protocol.get(url, (response) => {
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).on('error', (error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

async function download_image(url, media_id, type) {
    let file_name = String(Date.now());
    let img_path = path.join(process.env.REVIEWER_PLUS_IMG_DIR, file_name);
    let protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
          console.error(`Failed to get '${url}' (${response.statusCode})`);
          return;
      }
  
      const fileStream = fs.createWriteStream(img_path);
      response.pipe(fileStream);
  
      fileStream.on('finish', () => {
          fileStream.close(() => {
              console.log('Image downloaded successfully');
          });
      });
  
      fileStream.on('error', (err) => {
          fs.unlink(img_path, () => {
              console.error('Error writing to file:', err);
          });
      });
    }).on('error', (err) => {
        console.error('Error downloading image:', err);
    });
    console.log(await db.query(`UPDATE media SET media_${type} = '${file_name}' WHERE media_id = ${media_id}`));
}

export default {
    validate_master_api_key,
    validate_api_key,
    validate_date,
    validate_user_privilege,
    validate_url,
    download_image
}

