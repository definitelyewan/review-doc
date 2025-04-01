import db from "$lib/server/db.js";

export const load = async (loadEvent) => {
  const { fetch, params, locals } = loadEvent;

  let newest_reviews = await db.query(
    `SELECT review_id, media_id, review_score, review_sub_name FROM review WHERE user_id = ${params.id} ORDER BY review_date DESC LIMIT 20`
  );

  newest_reviews = await Promise.all(
    newest_reviews.map(async (review) => {
      let media = await db.query(
        `SELECT media_id, media_name, media_type FROM media WHERE media_id = ${review.media_id} LIMIT 1`
      );

      review.media = media[0];
      delete review.media_id;
      return review;
    })
  );

  const score_counts = await db.query(
    `SELECT CAST(review_score AS INT) as review_score, COUNT(review_score) as count FROM review WHERE user_id = ${params.id} GROUP BY CAST(review_score AS INT) ORDER BY review_score ASC;`
  );

  const users = await db.query(
    `SELECT * FROM user WHERE user_id = ${params.id} LIMIT 1`
  );
  const user = users[0];



  const favs = await db.query(`SELECT media.* FROM list INNER JOIN list_of INNER JOIN media WHERE list.list_id = list_of.list_id AND list.user_id = ${params.id} AND list_of.media_id = media.media_id AND list.list_name = 'Favourites'`);


  let suggested_media = await db.query(
    `SELECT user_id, review_id, media_id, review_score, review_sub_name FROM review ORDER BY review_score DESC LIMIT 10`
  );

  suggested_media = await Promise.all(
    suggested_media.map(async (review) => {
      let media = await db.query(
        `SELECT media_id, media_name, media_type FROM media WHERE media_id = ${review.media_id} LIMIT 1`
      );

      review.media = media[0];
      delete review.media_id;
      return review;
    })
  );

  return { newest_reviews, score_counts, user, favs, suggested_media };
};
