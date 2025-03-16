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

        await db.drop_table("interaction_of_media");
        await db.drop_table("interaction_of_review");

        await db.drop_table("tag_of");
        await db.drop_table("director_of");
        await db.drop_table("distributor_of");
        await db.drop_table("studio_of");

        await db.drop_table("list_of_collaborators");
        await db.drop_table("list_of");

        await db.drop_table("tag");
        await db.drop_table("director");
        await db.drop_table("distributor");
        await db.drop_table("studio");

        await db.drop_table("review");
        await db.drop_table("award");
        await db.drop_table("media");
        await db.drop_table("user");
        await db.drop_table("list");
        await db.drop_table("interaction");

    } catch (err) {
        console.error(err);
        return json({ message: "Cannot Drop Tables" }, { status: 500 });
    }

    // make tables

    try {
        await db.create_db_tables();
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
        const lists = data.lists;

        // insert users

        for (let user of users) {
            user.user_name = user.user_name == null ? "NULL" : `'${db.sanitize_input(String(user.user_name))}'`;
            user.user_pass = user.user_pass == null ? "NULL" : `'${db.sanitize_input(String(user.user_pass))}'`;
            user.user_api_key = user.user_api_key == null ? "NULL" : `'${db.sanitize_input(String(user.user_api_key))}'`;
            user.user_profile_path = user.user_profile_path == null ? "NULL" : `'${db.sanitize_input(String(user.user_profile_path))}'`;
            user.user_type = user.user_type == null ? "'viewer'" : `'${db.sanitize_input(String(user.user_type))}'`;
            user.user_token = user.user_token == null ? "NULL" : `'${db.sanitize_input(String(user.user_token))}'`;
            user.user_icon_colour = user.user_icon_colour == null ? "'000000'" : `'${db.sanitize_input(String(user.user_icon_colour))}'`;
            user.user_icon_text = user.user_icon_text == null ? "NULL" : `'${db.sanitize_input(String(user.user_icon_text))}'`;

            // check if settings are stored right in the backup

            if (user.user_icon_colour.length != 8) {
                console.error("Invalid icon colour for user " + user.user_name + " setting it to default #000000");
                user.user_icon_colour = user.user_icon_colour = "'000000'"
            }

            if (user.user_icon_text !== "NULL" && user.user_icon_text.length > 2) {
                console.error("Invalid icon text for user " + user.user_name + " setting it to NULL");
                user.user_icon_text = "NULL";
            }

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
            

                    let interactions = review.interactions;
                    delete review.interactions;

                    const sql = `INSERT INTO review(media_id,${Object.keys(review).join(",")}) VALUES (${media_id},${Object.values(review).join(",")})`;
                    await db.query(sql);

                    if (interactions != undefined) {
                        for (let interaction of interactions) {
                            interaction.interaction_value = interaction.interaction_value == null ? `'none'` : `'${db.sanitize_input(String(interaction.interaction_value))}'`; 
                            interaction.interaction_comment = interaction.interaction_comment == null ? "NULL" : `'${db.sanitize_input(String(interaction.interaction_type))}'`;
                            interaction.user_id = interaction.user_id == null ? "1" : `'${db.sanitize_input(String(interaction.user_id))}'`;
                            
                            const inter_insert = await db.query(`INSERT INTO interaction(interaction_id, interaction_value, interaction_comment, user_id) VALUES (${interaction.interaction_id}, ${interaction.interaction_value}, ${interaction.interaction_comment}, ${interaction.user_id})`);
                            const inter_link = await db.query(`INSERT INTO interaction_of_review(review_id, interaction_id) VALUES (${review.review_id}, ${interaction.interaction_id})`);
                            
                        
                        }

                    }



                }

            }

            if ("interactions" in media_info) {
                for (let interaction of media_info.interactions) {
                    interaction.interaction_value = interaction.interaction_value == null ? `'none'` : `'${db.sanitize_input(String(interaction.interaction_value))}'`; 
                    interaction.interaction_comment = interaction.interaction_comment == null ? "NULL" : `'${db.sanitize_input(String(interaction.interaction_type))}'`;
                    interaction.user_id = interaction.user_id == null ? "1" : `'${db.sanitize_input(String(interaction.user_id))}'`;
                    
                    await db.query(`INSERT INTO interaction(interaction_id, interaction_value, interaction_comment, user_id) VALUES (${interaction.interaction_id}, ${interaction.interaction_value}, ${interaction.interaction_comment}, ${interaction.user_id})`);
                    await db.query(`INSERT INTO interaction_of_media(media_id, interaction_id) VALUES (${media_info.media_id}, ${interaction.interaction_id})`);
                    
                
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

        // insert lists

        for (let list of lists) {
            list.list_id = list.list_id == null ? "NULL" : `'${db.sanitize_input(String(list.list_id))}'`;
            list.list_description = list.list_description == null ? "NULL" : `'${db.sanitize_input(String(list.list_description))}'`;
            list.list_name = list.list_name == null ? "NULL" : `'${db.sanitize_input(String(list.list_name))}'`;
            list.user_id = list.user_id == null ? "NULL" : `'${db.sanitize_input(String(list.user_id))}'`;

            const sql = `INSERT INTO list(list_id,list_description,list_name,user_id) VALUES (${list.list_id}, ${list.list_description}, ${list.list_name}, ${list.user_id})`;
            await db.query(sql);

            for (let media of list.media) {
                media.media_id = media.media_id == null ? "NULL" : `'${db.sanitize_input(String(media.media_id))}'`;
                const sql = `INSERT INTO list_of(list_id, media_id) VALUES (${list.list_id}, ${media.media_id})`;
                await db.query(sql);
            }

            if (list.collaborators != undefined) {
                for (let collaborator of list.collaborators) {
                    collaborator.user_id = collaborator.user_id == null ? "NULL" : `'${db.sanitize_input(String(collaborator.user_id))}'`;
                    const sql = `INSERT INTO list_of_collaborators(list_id, user_id) VALUES (${list.list_id}, ${collaborator.user_id})`;
                    await db.query(sql);
                }
            }

        }

    } catch (err) {
        console.error(err);
        return json({message : err});
    }


    return json({ message: "OK" });

}
