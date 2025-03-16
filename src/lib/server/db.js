/**
 * A module for interacting with a mariadb database
 */

import mariadb from 'mariadb';
import dotenv from 'dotenv';




// connects to a instance of mariadb using a .env file in the project directory
dotenv.config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: process.env.DB_CHARSET,
    port: process.env.DB_PORT,
    connectionLimit: 5
});

/**
 * Sanitizes a string input for use in an SQL query
 * @param {string} input
 * @returns {string}
 */
function sanitize_input(input) {
    if (typeof input !== 'string') {
        throw new Error('Input must be a string');
    }

    return input
        .replace(/\\/g, '\\\\')  // Escape backslashes
        .replace(/'/g, "\\'")    // Escape single quotes
        .replace(/"/g, '\\"')    // Escape double quotes
        .replace(/\x00/g, '\\0') // Escape null bytes
        .replace(/\x1a/g, '\\Z'); // Escape ASCII 26 (Ctrl+Z)
}


/**
 * Query the database and returns the result
 * @param {string} sql 
 * @returns 
 */
async function query(sql) {
    let conn;
    try {
        conn = await pool.getConnection();
        const res = await conn.query(sql);
        return res;
    } catch (err) {
        return err;
    } finally {
        if (conn) conn.end();
    }
}

/**
 * Creates a descriptor table for tags, studios, directors, and distributors
 * @param {string} table_name 
 */
async function create_descriptor_table(table_name) {
    return await query(`CREATE TABLE IF NOT EXISTS ${table_name} (
        ${table_name}_id INT AUTO_INCREMENT,
        PRIMARY KEY(${table_name}_id),
        ${table_name}_name VARCHAR(512) UNIQUE NOT NULL 
        )`);
}

/**
 * Creates a junction table for many to many relationships
 * @param {string} table_name 
 * @param {string} table1_id 
 * @param {string} table2_id 
 * @param {string} ref_table1_name 
 * @param {string} ref_table2_name 
 */
async function create_junction_table(table_name, table1_id, table2_id, ref_table1_name, ref_table2_name) {
    return await query(`CREATE TABLE IF NOT EXISTS ${table_name} (
        ${table1_id} INT,
        ${table2_id} INT,
        PRIMARY KEY(${table1_id}, ${table2_id}),
        FOREIGN KEY (${table1_id}) REFERENCES ${ref_table1_name}(${table1_id}),
        FOREIGN KEY (${table2_id}) REFERENCES ${ref_table2_name}(${table2_id})
    )`);
}

async function create_db_tables() {
// icon colours can be stored as a hex value for a large range of colours

    await query(`CREATE TABLE IF NOT EXISTS user (
                    user_id INT AUTO_INCREMENT UNIQUE,
                    PRIMARY KEY(user_id),
                    user_name VARCHAR(25) NOT NULL,
                    user_pass TEXT NOT NULL,
                    user_api_key VARCHAR(256) NOT NULL,
                    user_token VARCHAR(256),
                    user_profile_path TEXT,
                    user_icon_colour VARCHAR(6) DEFAULT '000000',
                    user_icon_text VARCHAR(2) DEFAULT NULL,
                    user_type ENUM('viewer', 'user', 'admin') DEFAULT 'viewer')`);

    await query(`CREATE TABLE IF NOT EXISTS media (
                    media_id INT AUTO_INCREMENT UNIQUE,
                    PRIMARY KEY(media_id),
                    media_name VARCHAR(512) NOT NULL,
                    media_type ENUM('movie','tv','game','book','web','music','other') DEFAULT 'other',
                    media_cover TEXT,
                    media_banner TEXT,
                    media_release_date_range_start DATE NOT NULL,
                    media_release_date_range_end DATE,
                    user_id INT DEFAULT 1,
                    FOREIGN KEY(user_id) REFERENCES user(user_id) ON DELETE SET DEFAULT)`);

    await query(`CREATE TABLE IF NOT EXISTS review (
                    review_id INT AUTO_INCREMENT,
                    PRIMARY KEY(review_id),
                    media_id INT,
                    FOREIGN KEY(media_id) REFERENCES media(media_id) ON DELETE CASCADE,
                    review_sub_name VARCHAR(255),
                    review_bullets JSON NOT NULL,
                    review_date DATE DEFAULT CURRENT_DATE,
                    review_score VARCHAR(10) DEFAULT '0',
                    review_limit VARCHAR(10) DEFAULT '10',
                    review_platform VARCHAR(255),
                    user_id INT DEFAULT 1,
                    FOREIGN KEY(user_id) REFERENCES user(user_id) ON DELETE CASCADE)`);
    
    await query(`CREATE TABLE IF NOT EXISTS award (
                    award_id INT AUTO_INCREMENT,
                    PRIMARY KEY(award_id),
                    media_id INT,
                    FOREIGN KEY(media_id) REFERENCES media(media_id) ON DELETE CASCADE,
                    award_name VARCHAR(512) NOT NULL,
                    award_status ENUM('nominee','winner') DEFAULT 'nominee',
                    award_issue_year INT NOT NULL,
                    user_id INT DEFAULT 1,
                    FOREIGN KEY(user_id) REFERENCES user(user_id) ON DELETE CASCADE)`);

    await query(`CREATE TABLE IF NOT EXISTS list (
                    list_id INT AUTO_INCREMENT,
                    PRIMARY KEY(list_id),
                    list_description TEXT,
                    list_name VARCHAR (512) NOT NULL,
                    user_id INT,
                    FOREIGN KEY(user_id) REFERENCES user(user_id) ON DELETE CASCADE)`);

    await query(`CREATE TABLE IF NOT EXISTS interaction (
                interaction_id INT AUTO_INCREMENT,
                PRIMARY KEY(interaction_id),
                interaction_value ENUM('like', 'dislike', 'none') DEFAULT 'none',
                interaction_comment TEXT,
                user_id INT,
                FOREIGN KEY(user_id) REFERENCES user(user_id) ON DELETE CASCADE)`);
    
    await create_descriptor_table("tag");
    await create_descriptor_table("studio");
    await create_descriptor_table("director");
    await create_descriptor_table("distributor");

    await create_junction_table("tag_of", "media_id", "tag_id", "media", "tag");
    await create_junction_table("director_of", "media_id", "director_id", "media", "director");
    await create_junction_table("distributor_of", "media_id", "distributor_id", "media", "distributor");
    await create_junction_table("studio_of", "media_id", "studio_id", "media", "studio");
    await create_junction_table("list_of", "list_id", "media_id", "list", "media");

    await create_junction_table("interaction_of_review", "interaction_id", "review_id", "interaction", "review");
    await create_junction_table("interaction_of_media", "interaction_id", "media_id", "interaction", "media");

    await create_junction_table("list_of_collaborators", "list_id", "user_id", "list", "user");
}

/**
 * converts a user api key to a user id
 * @param {string} api_key 
 * @returns 
 */
async function user_api_key_to_id(api_key) {

    try {

        const user = await query(`SELECT user_id FROM user WHERE user_api_key = '${sanitize_input(api_key)}' LIMIT 1`);
        
        if (!("user_id" in user[0])) {
            throw new Error('Unkown User');
        }

        return user[0].user_id;
    } catch (err) {
        console.error(err);
        return -1;
    }

}

/**
 * drops a table from the database by its name
 * @param {string} table_name 
 */
async function drop_table(table_name) {
    return await query(`DROP TABLE IF EXISTS ${table_name}`);
}

export default {
    sanitize_input,
    query,
    create_descriptor_table,
    create_junction_table,
    create_db_tables,
    user_api_key_to_id,
    drop_table
};