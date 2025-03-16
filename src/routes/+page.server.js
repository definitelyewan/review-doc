import db from "$lib/server/db.js";
import igdb from "$lib/server/igdb.js";

export const load = async (loadEvent) => {
  // get newest reviews
  let newest_reviews = await db.query(
    `SELECT review_id, media_id, user_id, review_score, review_sub_name FROM review ORDER BY review_date DESC LIMIT 20`
  );

  newest_reviews = await Promise.all(
    newest_reviews.map(async (review) => {
      let user = await db.query(
        `SELECT * FROM user WHERE user_id = ${review.user_id} LIMIT 1`
      );
      let media = await db.query(
        `SELECT media_id, media_name, media_type FROM media WHERE media_id = ${review.media_id} LIMIT 1`
      );

      review.user = user[0];
      review.media = media[0];
      delete review.user_id;
      delete review.media_id;
      return review;
    })
  );

  // get the most acclaimed stuff
  const most_acclaimed = await db.query(`
        SELECT media.media_id, media.media_name, COUNT(review.review_score) AS total_reviews, SUM(CASE WHEN review.review_score IN (9, 10) THEN 1 ELSE 0 END) AS high_score_reviews 
        FROM media INNER JOIN review ON media.media_id = review.media_id 
        GROUP BY media.media_name 
        ORDER BY high_score_reviews 
        DESC 
        LIMIT 20`);

  const score_counts = await db.query(
    `SELECT CAST(review_score AS INT) as review_score, COUNT(review_score) as count FROM review GROUP BY CAST(review_score AS INT) ORDER BY review_score ASC`
  );

  // get all users
  const users = await db.query(`SELECT * FROM user WHERE user_id > 1`);

  //get 5 random reviews
  const random_reviews = await db.query(`
        SELECT review.media_id, review.review_score, review.review_sub_name, review.review_bullets, review.review_platform, review.user_id, review.review_date, review.review_id, media.media_name, media.media_type, user.user_name, user.user_icon_text, user.user_icon_colour, user.user_profile_path  
        FROM review INNER JOIN media 
        ON review.media_id = media.media_id INNER JOIN user ON review.user_id = user.user_id 
        ORDER BY RAND() LIMIT 4`);
  return {
    newest_reviews,
    most_acclaimed,
    score_counts,
    users,
    random_reviews,
  };
};

export const actions = {
  default: async ({ request }) => {
    if (request.method === "POST") {
      const form_data = await request.formData();
      const type = form_data.get("type");

      if (type === "update") {
        const review_score = form_data.get("review_score");
        const review_bullets = form_data.get("review_bullets");
        const review_id = form_data.get("review_id");
        const review_sub_name = form_data.get("review_id");
        const review_platform = form_data.get("review_platform");
        let review_json = new Object([]);

        for (let bullet of review_bullets.split("\n")) {
          review_json.push(bullet);
        }

        await db.query(`UPDATE review SET review_score = ${review_score}, review_bullets = '${JSON.stringify(review_json)}', review_sub_name = '${review_sub_name}', review_platform = '${review_platform}' 
                                WHERE review_id = ${review_id}`);
      } else if (type === "delete") {
        const review_id = form_data.get("review_id");
        await db.query(`DELETE FROM review WHERE review_id = ${review_id}`);
      } else if (type === "review") {
        const review_score = form_data.get("review_score");
        const review_bullets = form_data.get("review_bullets");
        const media_id = form_data.get("media_id");
        const user_id = form_data.get("user_id");
        const review_sub_name = form_data.get("review_sub_name");
        const review_platform = form_data.get("review_platform");

        let review_json = new Object([]);

        for (let bullet of review_bullets.split("\n")) {
          review_json.push(bullet);
        }

        await db.query(`INSERT INTO review(media_id, review_sub_name, review_bullets, review_score, review_platform, user_id) 
                                VALUES(${media_id}, '${review_sub_name}', '${JSON.stringify(review_json)}', '${review_score}', '${review_platform}', ${user_id})`);
      } else if (type === "search_igdb") {
        const media_search_word = form_data.get("media_search_word");
        const igdb_json = await igdb.query(
          `fields *; search "${media_search_word}"; where (version_parent = null & (category = 0 | category = 10 | category = 8));`
        );
        return { lookup: igdb_json };
        //console.log(igdb_json);
      }
    }
  },
};
