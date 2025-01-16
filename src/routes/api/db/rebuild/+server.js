import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import security from '$lib/server/security';
import db from '$lib/server/db.js';

/**
 * Provides a post endpoint to the instance owner cabable of rebuilding the database. This will drop all tables and
 * recreate them. It will then insert the data from the latest backup.
 */
export async function POST ({ request }) {
    
    const valid = await security.validate_master_api_key(request.headers.get('Authorization'));

    if (!valid) {
        return json({ message: "Unauthorized" }, { status: 400 });
    }

    // drop tables

    try {
        await db.query(`DROP TABLE IF EXISTS tag_of`);
        await db.query(`DROP TABLE IF EXISTS director_of`);
        await db.query(`DROP TABLE IF EXISTS distributor_of`);
        await db.query(`DROP TABLE IF EXISTS studio_of`);

        await db.query(`DROP TABLE IF EXISTS tag`);
        await db.query(`DROP TABLE IF EXISTS director`);
        await db.query(`DROP TABLE IF EXISTS distributor`);
        await db.query(`DROP TABLE IF EXISTS studio`);

        await db.query(`DROP TABLE IF EXISTS review`);
        await db.query(`DROP TABLE IF EXISTS award`);
        await db.query(`DROP TABLE IF EXISTS media`);
        await db.query(`DROP TABLE IF EXISTS user`);

    } catch (err) {
        console.error(err);
        return json({ message: "Cannot Drop Tables" }, { status: 500 });
    }

    // make tables

    try {

        await db.query(`CREATE TABLE IF NOT EXISTS user (
                        user_id INT AUTO_INCREMENT UNIQUE,
                        PRIMARY KEY(user_id),
                        user_name VARCHAR(25) NOT NULL,
                        user_pass TEXT NOT NULL,
                        user_api_key VARCHAR(256) NOT NULL,
                        user_token VARCHAR(256),
                        user_profile_path TEXT,
                        user_type ENUM('viewer', 'user', 'admin') DEFAULT 'viewer')`);

        await db.query(`CREATE TABLE IF NOT EXISTS media (
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

        await db.query(`CREATE TABLE IF NOT EXISTS review (
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
        
        await db.query(`CREATE TABLE IF NOT EXISTS award (
                        award_id INT AUTO_INCREMENT,
                        PRIMARY KEY(award_id),
                        media_id INT,
                        FOREIGN KEY(media_id) REFERENCES media(media_id) ON DELETE CASCADE,
                        award_name VARCHAR(512) NOT NULL,
                        award_status ENUM('nominee','winner') DEFAULT 'nominee',
                        award_issue_year INT NOT NULL,
                        user_id INT DEFAULT 1,
                        FOREIGN KEY(user_id) REFERENCES user(user_id) ON DELETE CASCADE)`);
        
        await db.create_descriptor_table("tag");
        await db.create_descriptor_table("studio");
        await db.create_descriptor_table("director");
        await db.create_descriptor_table("distributor");

        await db.create_junction_table("tag_of", "media_id", "tag_id", "media", "tag");
        await db.create_junction_table("director_of", "media_id", "director_id", "media", "director");
        await db.create_junction_table("distributor_of", "media_id", "distributor_id", "media", "distributor");
        await db.create_junction_table("studio_of", "media_id", "studio_id", "media", "studio");
    } catch (err) {
        console.error(err);
        return json({ message: "Cannot Create Tables" }, { status: 500 });
    }

    // insert data

    try {

        let latest_snapshot;
        const backupDir = process.env.REVIEWER_PLUS_BACKUP_DIR;

        if (backupDir) {
            latest_snapshot = fs.readdirSync(backupDir).map(file => path.join(backupDir, file));
        } else {
            throw new Error("REVIEWER_PLUS_BACKUP_DIR is not defined");
        }

        latest_snapshot = latest_snapshot[latest_snapshot.length - 1]

        const data = JSON.parse(fs.readFileSync(latest_snapshot));
        const users = data.user;
        const medias = data.medias;

        // insert users

        for (let user of users) {
            user.user_name = user.user_name == null ? "NULL" : `'${db.sanitize_input(String(user.user_name))}'`;
            user.user_pass = user.user_pass == null ? "NULL" : `'${db.sanitize_input(String(user.user_pass))}'`;
            user.user_api_key = user.user_api_key == null ? "NULL" : `'${db.sanitize_input(String(user.user_api_key))}'`;
            user.user_profile_path = user.user_profile_path == null ? "NULL" : `'${db.sanitize_input(String(user.user_profile_path))}'`;
            user.user_type = user.user_type == null ? "'viewer'" : `'${db.sanitize_input(String(user.user_type))}'`;
            user.user_token = user.user_token == null ? "NULL" : `'${db.sanitize_input(String(user.user_token))}'`;
    
            const sql = "INSERT INTO user(" + Object.keys(user).join(",") + ") VALUES (" + Object.values(user).join(",") + ")";
            await db.query(sql);
        }
        // insert media info

        for (const media_info of medias) {

            let media_id = media_info.media_id;

            if (media_id == null || media_id == 0 || media_id == undefined) {
                throw new Error("Invalid Media ID");
            }

            
            if ("media" in media_info) {
                let media = media_info.media;
                media.media_name = media.media_name == null ? "NULL" : `'${db.sanitize_input(String(media.media_name))}'`;
                media.media_type = media.media_type == null ? "'other'" : `'${db.sanitize_input(String(media.media_type))}'`;
                media.media_cover = media.media_cover == null ? "NULL" : `'${db.sanitize_input(String(media.media_cover))}'`;
                media.media_banner = media.media_banner == null ? "NULL" : `'${db.sanitize_input(String(media.media_banner))}'`;
                media.media_release_date_range_start = media.media_release_date_range_start == null ? "NULL" : `'${security.validate_date(String(media.media_release_date_range_start))}'`;
                media.media_release_date_range_end = media.media_release_date_range_end == null ? "NULL" : `'${security.validate_date(String(media.media_release_date_range_end))}'`;
                media.user_id = media.user_id == null ? "1" : `'${db.sanitize_input(String(media.user_id))}'`;
        
                const sql = `INSERT INTO media(media_id,${Object.keys(media).join(",")}) VALUES (${media_id},${Object.values(media).join(",")})`;
                await db.query(sql);
            }

            if ("reviews" in media_info) {
                for (let review of media_info.reviews) {
                    review.review_sub_name = review.review_sub_name == null ? "NULL" : `'${db.sanitize_input(String(review.review_sub_name))}'`;
                    review.review_bullets = review.review_bullets == null ? "NULL" : `'${db.sanitize_input(JSON.stringify(review.review_bullets))}'`;
                    review.review_date = review.review_date == null ? "NULL" : `'${security.validate_date(String(review.review_date))}'`;
                    review.review_score = review.review_score == null ? "NULL" : `'${db.sanitize_input(String(review.review_score))}'`;
                    review.review_limit = review.review_limit == null ? "NULL" : `'${db.sanitize_input(String(review.review_limit))}'`;
                    review.review_platform = review.review_platform == null ? "NULL" : `'${db.sanitize_input(String(review.review_platform))}'`;
                    review.user_id = review.user_id == null ? "1" : `'${db.sanitize_input(String(review.user_id))}'`;
            
                    const sql = `INSERT INTO review(media_id,${Object.keys(review).join(",")}) VALUES (${media_id},${Object.values(review).join(",")})`;
                    await db.query(sql);
                }

            }

            if ("awards" in media_info) {
                for (let award of media_info.awards) {
                    award.award_name = award.award_name == null ? "NULL" : `'${db.sanitize_input(String(award.award_name))}'`;
                    award.award_status = award.award_status == null ? "'nominee'" : `'${db.sanitize_input(String(award.award_status))}'`;
                    award.award_issue_year = award.award_issue_year == null ? "NULL" : `'${db.sanitize_input(String(award.award_issue_year))}'`;
                    award.user_id = award.user_id == null ? "1" : `'${db.sanitize_input(String(award.user_id))}'`;

                    const sql = `INSERT INTO award(media_id,${Object.keys(award).join(",")}) VALUES (${media_id},${Object.values(award).join(",")})`;
                    await db.query(sql);
                }
            }

            if ("directors" in media_info) {

                for (let director_name of media_info.directors) {
                    director_name = director_name == null ? "NULL" : `'${db.sanitize_input(String(director_name))}'`;
                    await db.query(`INSERT INTO director(director_name) VALUES (${director_name})`);

                    // link
                    await db.query(`INSERT INTO director_of (media_id, director_id) 
                                    VALUES(${media_id}, (SELECT director_id FROM director WHERE director_name = ${director_name} LIMIT 1))`);
                }
            }

            if ("distributors" in media_info) {
                
                for (let distributor_name of media_info.distributors) {
                    distributor_name = distributor_name == null ? "NULL" : `'${db.sanitize_input(String(distributor_name))}'`;

                    await db.query(`INSERT INTO distributor(distributor_name) VALUES (${distributor_name})`);

                    // link
                    await db.query(`INSERT INTO distributor_of (media_id, distributor_id) 
                                    VALUES(${media_id}, (SELECT distributor_id FROM distributor WHERE distributor_name = ${distributor_name} LIMIT 1))`);
                }
            }

            if ("studios" in media_info) {
                
                for (let studio_name of media_info.studios) {
                    studio_name = studio_name == null ? "NULL" : `'${db.sanitize_input(String(studio_name))}'`;

                    await db.query(`INSERT INTO studio(studio_name) VALUES (${studio_name})`);

                    // link
                    await db.query(`INSERT INTO studio_of (media_id, studio_id) 
                                    VALUES(${media_id}, (SELECT studio_id FROM studio WHERE studio_name = ${studio_name} LIMIT 1))`);
                }
            }

            if ("tags" in media_info) {
                
                for (let tag_name of media_info.tags) {
                    tag_name = tag_name == null ? "NULL" : `'${db.sanitize_input(String(tag_name))}'`;

                    await db.query(`INSERT INTO tag(tag_name) VALUES (${tag_name})`);

                    // link
                    await db.query(`INSERT INTO tag_of (media_id, tag_id) 
                                    VALUES(${media_id}, (SELECT tag_id FROM tag WHERE tag_name = ${tag_name} LIMIT 1))`);
                }
            }

        }

    } catch (err) {
        console.error(err);
        return json({message : err});
    }


    return json({ message: "OK" });

}
