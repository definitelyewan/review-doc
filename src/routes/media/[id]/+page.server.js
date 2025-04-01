/**
 * Backend for the media page of a specific piece media
 */

import db from "$lib/server/db.js";
import security from "$lib/server/security";
import tmdb from "$lib/server/tmdb";

/**
 * On page load fetch any and all media information along with reviews and awards
 */
export const load = async ({ params, locals }) => {
  // big boy variable to hold all the data
  let media_data = new Object({
    media: {},
    reviews: [],
    awards: [],
    studios: [],
    distributors: [],
    directors: [],
    tags: [],
    users: [],
    media_id: params.id,
  });

  let userLists = [];
  let mediaInLists = [];
  let userMediaAdded = [];

  // Ensure user is logged in
  if (locals.user) {
    
    // get available lists
    userLists = await db.query(
      `SELECT list_id, list_name FROM list WHERE user_id = ${locals.user.id}`
    );

    const userListCollaborations = await db.query(`
      SELECT list.list_id, list.list_name FROM list 
      INNER JOIN list_of_collaborators ON list.list_id = list_of_collaborators.list_id 
      WHERE list_of_collaborators.user_id = ${locals.user.id}
    `);

    if (userListCollaborations.length > 0) {
      userLists = userLists.concat(userListCollaborations);

    }

    userMediaAdded = await db.query(`
      SELECT list.list_id, list.list_name, list_of.media_id 
      FROM list 
      LEFT JOIN list_of ON list.list_id = list_of.list_id
      WHERE list.user_id = ${locals.user.id}
    `);
  }

  if (locals.user) {

    // has a user added this media to a list in the past?
    mediaInLists = await db.query(`SELECT l.list_id, l.list_name
        FROM list_of lo
        JOIN list l ON lo.list_id = l.list_id
        WHERE lo.media_id = '${params.id}' 
        AND l.user_id = '${locals.user.id}'`
    );

    const mediaInListCollab = await db.query(`
      SELECT list.list_id, list.list_name FROM list INNER JOIN list_of INNER JOIN list_of_collaborators 
      WHERE list.list_id = list_of.list_id 
      AND list.list_id = list_of_collaborators.list_id 
      AND list_of.media_id = ${params.id} 
      AND list_of_collaborators.user_id = ${locals.user.id}`
    );

    if (mediaInListCollab.length > 0) {
      mediaInLists = mediaInLists.concat(mediaInListCollab);
    }

  }
  
  let unique_seasons = [];
  let reviews_by_seasons = new Object();
  const media = await db.query(
    `SELECT * FROM media WHERE media_id = ${params.id}`
  );
  const reviews = await db.query(
    `SELECT * FROM review WHERE media_id = ${params.id}`
  );
  const reviewInfo = await db.query(`
    SELECT r.*, 
           i.interaction_id, 
           i.interaction_value, 
           i.interaction_comment, 
           i.user_id AS interaction_user_id,
           u.user_name,  -- Fetch user_name from the user table
           u.user_icon_text,
           u.user_icon_colour,
           u.user_profile_path
    FROM review r
    LEFT JOIN interaction_of_review ir ON r.review_id = ir.review_id
    LEFT JOIN interaction i ON ir.interaction_id = i.interaction_id
    LEFT JOIN user u ON i.user_id = u.user_id  -- Join user table to get user_name
    WHERE r.media_id = ${params.id}
`);


  const awards = await db.query(
    `SELECT * FROM award WHERE media_id = ${params.id} AND award_status = 'winner'`
  );

  //store review details
  const reviewMap = {};

  reviewInfo.forEach(row => {
      const reviewId = row.review_id;

      if (!reviewMap[reviewId]) {
          reviewMap[reviewId] = {
              review_id: row.review_id,
              media_id: row.media_id,
              review_sub_name: row.review_sub_name,
              review_bullets: row.review_bullets,
              review_date: row.review_date,
              review_score: row.review_score,
              review_limit: row.review_limit,
              review_platform: row.review_platform,
              user_id: row.user_id,
              interactions: [],
              likeCount: 0,
              isLiked: 0
          };
      }

      // If there is an interaction, add it to the array
      if (row.interaction_id) {
          let isLiked = false;

          if (row.interaction_value == 'like'){
            reviewMap[reviewId].likeCount = reviewMap[reviewId].likeCount + 1;
            //console.log("Like: "+ reviewMap[reviewId].likeCount);
          }
          if (row.interaction_value == 'like' && locals.user.id == row.interaction_user_id){
            reviewMap[reviewId].isLiked = 2;
            //console.log("TRUE");
          }
          reviewMap[reviewId].interactions.push({
              interaction_id: row.interaction_id,
              interaction_value: row.interaction_value,
              interaction_comment: row.interaction_comment,
              interaction_user_id: row.interaction_user_id,
              user_name: row.user_name,
              user_icon_text: row.user_icon_text,
              user_icon_colour: row.user_icon_colour,
              user_profile_path: row.user_profile_path,
              interaction_like: isLiked
          });
      }
  });

  // Convert object to array
  const reviewInfoList = Object.values(reviewMap);

  media_data.reviewInfo = reviewInfoList;

  // sanitize the data
  media[0].media_release_date_range_start =
    media[0].media_release_date_range_start.toISOString().split("T")[0];

  if (media[0].media_release_date_range_end != null) {
    media[0].media_release_date_range_end =
      media[0].media_release_date_range_end.toISOString().split("T")[0];
  }

  for (const review of reviews) {
    review.review_date = review.review_date.toISOString().split("T")[0];

    if (media[0].media_type == "tv") {
      unique_seasons.push(review.review_sub_name);
    } else if (media[0].media_type == "web") {
      unique_seasons.push(review.review_sub_name);
    }
  }

  media_data.reviews = reviews;

  // if unique seasons isnt empty sort by it
  if (unique_seasons.length > 0) {
    unique_seasons.sort();

    for (let unique_season of unique_seasons) {
      reviews_by_seasons[unique_season] = [];
      for (let review of reviews) {
        if (review.review_sub_name == unique_season) {
          reviews_by_seasons[unique_season].push(review);
        }
      }
    }

    //idk replace the array that already exists
    media_data.reviews = reviews_by_seasons;
  }

  // get and sanitize all the other data

  const studios = await db.query(
    `SELECT studio_name from studio INNER JOIN studio_of WHERE studio.studio_id = studio_of.studio_id AND studio_of.media_id = ${params.id}`
  );
  const distributors = await db.query(
    `SELECT distributor_name from distributor INNER JOIN distributor_of WHERE distributor.distributor_id = distributor_of.distributor_id AND distributor_of.media_id = ${params.id}`
  );
  const directors = await db.query(
    `SELECT director_name from director INNER JOIN director_of WHERE director.director_id = director_of.director_id AND director_of.media_id = ${params.id}`
  );
  const tags = await db.query(
    `SELECT tag_name from tag INNER JOIN tag_of WHERE tag.tag_id = tag_of.tag_id AND tag_of.media_id = ${params.id}`
  );

  media_data.media = media[0];
  media_data.awards = awards;

  for (const tag of tags) {
    media_data.tags.push(tag.tag_name);
  }

  for (const studio of studios) {
    media_data.studios.push(studio.studio_name);
  }

  for (const distributor of distributors) {
    media_data.distributors.push(distributor.distributor_name);
  }

  for (const director of directors) {
    media_data.directors.push(director.director_name);
  }

  for (const review of reviews) {
    const user = await db.query(
      `SELECT * FROM user WHERE user_id = ${review.user_id} LIMIT 1`
    );

    media_data.users.push(user[0]);
  }

  const possible_tags = await db.query(`SELECT tag_name FROM tag`);

  /**
   * user panel load
   */

  let user_reviews = [];
  let user_awards = [];

  // just return if nobody is logged in
  if (locals.user === undefined) {
    return {
      media_data: media_data,
      user_reviews: [],
      user_awards: [],
      possible_tags: possible_tags,
      userLists,
      userMediaAdded,
      mediaInLists,
    };
  }

  // attempt to get the users reviews and awards
  try {
    const current_year = new Date().getFullYear();
    const user_reviews_unflitered = await db.query(
      `SELECT * FROM review WHERE media_id = ${params.id} AND user_id = ${locals.user.id}`
    );
    const user_awards_unfiltered = await db.query(
      `SELECT * FROM award WHERE media_id = ${params.id} AND user_id = ${locals.user.id} AND award_issue_year = ${current_year}`
    );

    // filter reviews
    user_reviews_unflitered.forEach((review) => {
      review.review_date = review.review_date.toISOString().split("T")[0];

      user_reviews.push({
        label: `${review.review_score}/10 from ${review.review_date}`,
        value: {
          review_id: review.review_id,
          media_id: review.media_id,
          review_score: review.review_score,
          review_bullets: review.review_bullets,
          review_platform: review.review_platform,
          review_sub_name: review.review_sub_name,
        },
      });
    });

    // filter awards
    user_awards_unfiltered.forEach((award) => {
      user_awards.push({
        label: award.award_name,
        value: {
          award_id: award.award_id,
          award_issue_year: award.award_issue_year,
          award_status: award.award_status,
        },
      });
    });
  } catch {
    return {
      media_data: media_data,
      user_reviews: [],
      user_awards: [],
      possible_tags: possible_tags,
      userLists,
      userMediaAdded,
      mediaInLists,
    };
  }

  return {
    media_data: media_data,
    user_reviews: user_reviews,
    user_awards: user_awards,
    possible_tags: possible_tags,
    userLists,
    userMediaAdded,
    mediaInLists,

  };
};

/**
 * Form actions
 */
export const actions = {
  /**
   * Adds a review to the database
   */
  add_review: async ({ request, locals }) => {
    //load front end data and filter it
    const form_data = await request.formData();
    const review_score = form_data.get("review_score");
    const review_bullets = form_data.get("review_bullets");
    const media_id = form_data.get("media_id");
    let review_sub_name = form_data.get("review_sub_name");
    let review_platform = form_data.get("review_platform");

    if (review_bullets.length === 0) {
      return { success: false, message: "Review is empty" };
    }

    review_sub_name = review_sub_name.length === 0 ? null : review_sub_name;
    review_platform = review_platform.length === 0 ? null : review_platform;
    let review_json = new Object([]);

    for (let bullet of review_bullets.split("\n")) {
      review_json.push(bullet);
    }

    const media = await db.query(
      `SELECT media_name, media_type, media_release_date_range_end FROM media WHERE media_id = ${media_id}`
    );
    const media_name = media[0].media_name;
    const old_last_air_date = media[0].media_release_date_range_end;
    const media_type = media[0].media_type;

    if (media_type === "tv" && review_sub_name === null) {
      return {
        success: false,
        message: "TV Shows require a a version or season",
      };
    }

    // update tv show cover and dates just in case new seasons come out
    if (media_type === "tv") {
      try {
        const tmdb_init = await tmdb.query(
          "GET",
          `search/multi?query=${media_name}&include_adult=true&language=en-US&page=1`
        );

        for (let tmdb_result of tmdb_init.results) {
          if (
            tmdb_result.media_type !== "tv" &&
            media_name !== tmdb_result.nam
          ) {
            continue;
          }

          const details = await tmdb.query(
            "GET",
            `${tmdb_result.media_type}/${tmdb_result.id}`
          );

          // continue checking until the date is different
          if (details.last_air_date === old_last_air_date) {
            continue;
          }

          const cover_url = `https://image.tmdb.org/t/p/original${tmdb_result.poster_path}`;
          const new_last_air_date = details.last_air_date;
          await security.download_image(cover_url, media_id, "cover");
          await db.query(
            `UPDATE media SET media_release_date_range_end = '${new_last_air_date}' WHERE media_id = ${media_id}`
          );
        }
      } catch (error) {
        return {
          success: false,
          message:
            "Failed to download a new cover image or update the end date. Try again later tmdb may be down :(",
        };
      }
    }

    await db.query(`INSERT INTO review(media_id, review_sub_name, review_bullets, review_score, review_platform, user_id) 
          VALUES(${media_id}, ${review_sub_name ? `'${db.sanitize_input(review_sub_name)}'` : "NULL"}, '${db.sanitize_input(JSON.stringify(review_json))}', '${review_score}',  ${review_platform ? `'${db.sanitize_input(review_platform)}'` : "NULL"}, ${locals.user.id})`);

    return { success: true };
  },

  /**
   * Removes a review from the database at a users request
   */
  delete_review: async ({ request }) => {
    const form_data = await request.formData();
    const review_id = form_data.get("review_id");

    if (review_id === null) {
      return {
        success: false,
        message: "Permission denied! please refresh the page and try again.",
      };
    }

    await db.query(`DELETE FROM review WHERE review_id = ${review_id}`);
    return { success: true };
  },

  /**
   * Updates a review in the database with new information
   */
  update_review: async ({ request }) => {
    // get front end data and filter it

    const form_data = await request.formData();
    const review_score = form_data.get("review_score");
    const review_bullets = form_data.get("review_bullets");
    const review_id = form_data.get("review_id");
    let review_sub_name = form_data.get("review_sub_name");
    let review_platform = form_data.get("review_platform");

    if (review_bullets.length === 0) {
      return { success: false, message: "Review is empty" };
    }

    if (review_id === null) {
      return {
        success: false,
        message: "Permission denied! please refresh the page and try again.",
      };
    }

    review_sub_name = review_sub_name.length === 0 ? null : review_sub_name;
    review_platform = review_platform.length === 0 ? null : review_platform;

    let review_json = [];

    for (let bullet of review_bullets.split("\n")) {
      review_json.push(bullet);
    }

    // update the review table
    await db.query(`UPDATE review SET review_score = ${review_score}, review_bullets = '${db.sanitize_input(JSON.stringify(review_json))}', review_sub_name = ${review_sub_name ? `'${db.sanitize_input(review_sub_name)}'` : "NULL"}, review_platform = ${review_platform ? `'${db.sanitize_input(review_platform)}'` : "NULL"} 
                        WHERE review_id = ${review_id}`);
    return { success: true };
  },

  /**
   * Nominate a media for an award
   */
  nominate_media: async ({ request, locals }) => {
    const form_data = await request.formData();
    const award_name = form_data.get("award_name");
    const media_id = form_data.get("media_id");
    const year = new Date().getFullYear();

    if (award_name === undefined) {
      return { success: false, message: "No award picked" };
    }

    if (media_id === undefined) {
      return { success: false, message: "No media selected" };
    }

    // block user from nominating a media they did not review this year
    try {
      const did_user_review = await db.query(
        `SELECT * FROM review WHERE user_id = ${locals.user.id} AND media_id = ${media_id} AND review_date BETWEEN '${year}-01-01' AND '${year}-12-31'`
      );

      if (did_user_review.length === 0) {
        throw new Error("User did not review this media this year");
      }
    } catch (error) {
      return { success: false, message: error.message };
    }

    // check if user already nominated this and if so un nominate it

    try {
      const already_nominated = await db.query(
        `SELECT * FROM award WHERE media_id = ${media_id} AND user_id = ${locals.user.id} AND award_issue_year = ${year} AND award_name = '${award_name}'`
      );
      if (already_nominated.length > 0) {
        const drop = await db.query(
          `DELETE FROM award WHERE media_id = ${media_id} AND user_id = ${locals.user.id} AND award_issue_year = ${year} AND award_name = '${award_name}'`
        );
        return { success: true, message: "Removed nomination" };
      }

      const res = await db.query(
        `INSERT INTO award(award_name, award_issue_year, media_id, user_id) VALUES('${award_name}', '${year}', ${media_id}, ${locals.user.id})`
      );
    } catch (error) {
      console.error("Database query failed:", error);
      return { success: false, message: "Try again later" };
    }

    return { success: true };
  },

  /**
   * Grants an awafrd to media that a user has nominated
   */
  grant_award: async ({ request, locals }) => {
    // filter and get front end data
    const form_data = await request.formData();
    const media_id = form_data.get("award_id");
    const current_month = new Date().getMonth() + 1;

    if (media_id === undefined) {
      return { success: false, message: "No award picked" };
    }

    // check if its december if not return
    if (current_month < 12) {
      return {
        success: false,
        message: "You can only grant awards in December",
      };
    }

    //attempt to grant the award
    try {
      let nom = "";
      const award = await db.query(
        `SELECT * FROM award WHERE award_id = ${media_id}`
      );
      if (award.length === 0) {
        throw new Error("Award not found");
      }

      if (award[0].award_status === "winner") {
        nom = "nominee";
      } else {
        nom = "winner";
      }

      const update = await db.query(
        `UPDATE award SET award_status = '${nom}' WHERE award_id = ${media_id}`
      );
    } catch (error) {
      return { success: false, message: error.message };
    }

    return { success: true };
  },
  /**
   * Adds a tag to a media
   */
  update_tags: async ({ request }) => {
    const form_data = await request.formData();
    const media_id = form_data.get("media_id");
    let tags = form_data.get("tags");

    if (media_id === undefined) {
      return { success: false, message: "No media selected" };
    }

    if (tags === undefined) {
      return { success: false, message: "No tags selected" };
    }

    tags = tags.split(",");

    try {
      let current_applied_tags = await db.query(
        `SELECT tag_name from tag INNER JOIN tag_of WHERE tag.tag_id = tag_of.tag_id AND tag_of.media_id = ${media_id}`
      );
      let removable_tags = [];

      // remove the tag if it is not in the new list
      current_applied_tags.forEach(async (applied_tag) => {
        if (!tags.includes(applied_tag.tag_name)) {
          const delete_msg = await db.query(
            `DELETE FROM tag_of WHERE media_id = ${media_id} AND tag_id = (SELECT tag_id FROM tag WHERE tag_name = '${applied_tag.tag_name}')`
          );

          if (delete_msg.affectedRows === 0) {
            throw new Error("Failed to delete a tag. Try again later!");
          }
          removable_tags.push(applied_tag.tag_name);
        }
      });

      // filter out removed and mataching tags
      tags = tags.filter((tag) => !removable_tags.includes(tag));
      current_applied_tags = current_applied_tags.map((tag) => tag.tag_name);
      tags = tags.filter((tag) => !current_applied_tags.includes(tag));

      tags.forEach(async (unapplied_tag) => {
        unapplied_tag = db.sanitize_input(unapplied_tag);
        let tag_id = await db.query(
          `SELECT tag_id from tag WHERE tag_name = '${unapplied_tag}'`
        );

        //failed because this tag does not exist so gotta add it
        if (tag_id.length === 0) {
          const insert_msg = await db.query(
            `INSERT INTO tag(tag_name) VALUES('${unapplied_tag}')`
          );

          if (insert_msg.affectedRows === 0) {
            throw new Error("Failed to add a tag. Try again later!");
          }

          tag_id = await db.query(
            `SELECT tag_id from tag WHERE tag_name = '${unapplied_tag}'`
          );
        }

        const insert_msg = await db.query(
          `INSERT INTO tag_of(tag_id, media_id) VALUES(${tag_id[0].tag_id}, ${media_id})`
        );

        if (insert_msg.affectedRows === 0) {
          throw new Error("Failed to add a tag. Try again later!");
        }
      });
    } catch (error) {
      console.error(error.message);
      return {
        success: false,
        message: "failed to update tags. Try again later!",
      };
    }

    return { success: true };
  },

  addComment: async ({ request, locals }) => {
          const formData = await request.formData();
          const commentText = formData.get("commentText");
          const reviewId = formData.get("review_id");
          const userId = locals.user?.id; // Ensure user is authenticated
          const interactionValue = "none"; // Default interaction type
  
          if (!userId || !reviewId || !commentText) {
              return fail(400, { missing_fields: true });
          }
  
          try {
              // Insert into interaction table
              const insertInteraction = await db.query(`
                  INSERT INTO interaction (user_id, interaction_comment, interaction_value) 
                  VALUES (${userId}, '${db.sanitize_input(commentText)}', '${interactionValue}')
              `);
  
              // Get last inserted interaction_id
              const interactionId = insertInteraction.insertId;
              if (!interactionId) {
                  throw new Error("Failed to retrieve interaction ID.");
              }
  
              // Insert into interaction_of_review to associate comment with the review
              const linkReviewInteraction = await db.query(`
                  INSERT INTO interaction_of_review (interaction_id, review_id) 
                  VALUES (${interactionId}, ${reviewId})
              `);
  
              return { success: true, newComment: { id: interactionId, user_id: userId, text: commentText } };
          } catch (error) {
              console.error("Error adding comment:", error);
              return fail(500, { server_error: true, error: error.message });
          }
      },
      deleteComment: async ({ request, locals }) => {
        const formData = await request.formData();
        const interactionId = formData.get("interaction_id");
        const userId = locals.user?.id;
        
        //make sure were getting a proper interactionID and userID
        if (!interactionId || !userId) {
          return { success: false, message: "Invalid request parameters." };
        }
      
        try {
          // verify the interaction belongs to the user
          const interaction = await db.query(`
            SELECT * FROM interaction WHERE interaction_id = ${interactionId} AND user_id = ${userId}
          `);
      
          if (interaction.length === 0) {
            return { success: false, message: "Interaction not found or unauthorized" };
          }
      
          // delete interaction reference
          await db.query(`
            DELETE FROM interaction_of_review WHERE interaction_id = ${interactionId}
          `);
      
          // delete interaction
          await db.query(`
            DELETE FROM interaction WHERE interaction_id = ${interactionId}
          `);
      
          return { success: true };
      
        } catch (error) {
          console.error("Error deleting comment:", error);
          return { success: false, message: "Server error during deletion" };
        }
      },

      toggleLike: async ({ request, locals }) => {
        const formData = await request.formData();
        const reviewId = formData.get("review_id");
        const userId = locals.user?.id; // Ensure user is authenticated
        //console.log(reviewId);
    
        if (!userId || !reviewId) {
            return fail(400, { missing_fields: true });
        }
    
        try {
            // Check if user already has an interaction for this review
            const existingInteraction = await db.query(`
              SELECT interaction.interaction_id, interaction.interaction_value 
              FROM interaction
              JOIN interaction_of_review ON interaction.interaction_id = interaction_of_review.interaction_id
              WHERE interaction.user_id = ${userId} 
              AND interaction_of_review.review_id = ${reviewId}
              AND interaction.interaction_value = 'like'
          `);
          
            console.log(existingInteraction);
    
            if (existingInteraction.length > 0) {
              const { interaction_id } = existingInteraction[0];

              console.log("Removing existing like...");
          
              // First, delete from interaction_of_review to maintain referential integrity
              await db.query(`
                  DELETE FROM interaction_of_review 
                  WHERE interaction_id = ${interaction_id}
              `);
          
              // Then, delete from interaction table
              await db.query(`
                  DELETE FROM interaction 
                  WHERE interaction_id = ${interaction_id}
              `);

              return { success: true, toggledLike: "removed" };

            } else {
                // Insert new interaction
                const insertInteraction = await db.query(`
                    INSERT INTO interaction (user_id, interaction_value) 
                    VALUES (${userId}, 'like')
                `);
    
                const interactionId = insertInteraction.insertId;
                if (!interactionId) {
                    throw new Error("Failed to retrieve interaction ID.");
                }
    
                // Associate with review
                await db.query(`
                    INSERT INTO interaction_of_review (interaction_id, review_id) 
                    VALUES (${interactionId}, ${reviewId})
                `);

                const likeCountResult = await db.query(`
                    SELECT COUNT(*) AS count FROM interaction_of_review ir
                    INNER JOIN interaction i ON ir.interaction_id = i.interaction_id
                    WHERE ir.review_id = ${reviewId} AND i.interaction_value = 'like'
                `);
      
                console.log("ℹ️ Like Count Query Result:", likeCountResult);

                return { success: true, likeCount: likeCountResult[0].count};
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            return fail(500, { server_error: true, error: error.message });
        }
    },    
};
