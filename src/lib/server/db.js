import mariadb from 'mariadb';
import dotenv from 'dotenv';

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

export default {
    sanitize_input,
    query,
    create_descriptor_table,
    create_junction_table,
    user_api_key_to_id
};