import { fail } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import db from "$lib/server/db.js";

/**
 * Returns a list sorted descriptors where each descriptor has at least constraint media
 * @param {string} dscriptor 
 * @param {number} constartint 
 */
async function get_media_with_popular_descriptor(descriptor, constartint) {

  // validate table names
  const valid_descriptors = ["tag", "director", "studio", "distributor"];

  if (!valid_descriptors.includes(descriptor)) {
    throw new Error(`Invalid descriptor: ${descriptor}`);
  }

  // search for descriptors
  const sql_search = `SELECT ${descriptor}.${descriptor}_name FROM ${descriptor} JOIN ${descriptor}_of 
    ON ${descriptor}.${descriptor}_id = ${descriptor}_of.${descriptor}_id 
    GROUP BY ${descriptor}.${descriptor}_name 
    HAVING COUNT(*) >= ${constartint} 
    ORDER BY COUNT(*) DESC
  `;

  const search_result = await db.query(sql_search);
  const descriptor_names = search_result.map((row) => row[`${descriptor}_name`]);



  if (descriptor_names.length == 0) {
    return [];
  }


  const name_string = descriptor_names.map((tag) => `'${tag.replace(/'/g, "''")}'`).join(", ");
  const sql_media_search = `
    SELECT DISTINCT media.media_name, media.media_type, ${descriptor}.${descriptor}_name, media.media_id
    FROM media
    JOIN ${descriptor}_of ON media.media_id = ${descriptor}_of.media_id
    JOIN ${descriptor} ON ${descriptor}_of.${descriptor}_id = ${descriptor}.${descriptor}_id
    WHERE ${descriptor}.${descriptor}_name IN (${name_string})`;

  const media_results = await db.query(sql_media_search);
  return media_results;
}

/**
 * Removes an old key and replaces it with a new one
 * @param {Object} obj 
 * @param {String} old_key 
 * @param {String} new_key 
 */
function redefine_key(obj, old_key, new_key) {
  obj[new_key] = obj[old_key];
  delete obj[old_key];
}

export const load = async ({ locals }) => {


  try {
    let mediaResults = [];
    let userLists = [];
    let collaborativeLists = [];
    let mediaByList = {};
    


    const tag_results = await get_media_with_popular_descriptor("tag", 2);
    const director_results = await get_media_with_popular_descriptor("director", 1);
    const studio_results = await get_media_with_popular_descriptor("studio", 1);
    const distributor_results = await get_media_with_popular_descriptor("distributor", 1);

    tag_results.forEach((media) => {
      redefine_key(media, "tag_name", "descriptor_name");
      media.descriptor_type = "tag";
    });
    director_results.forEach((media) => {
      redefine_key(media, "director_name", "descriptor_name");
      media.descriptor_type = "director";
    });
    studio_results.forEach((media) => {
      redefine_key(media, "studio_name", "descriptor_name");
      media.descriptor_type = "studio";
    });
    distributor_results.forEach((media) => {
      redefine_key(media, "distributor_name", "descriptor_name");
      media.descriptor_type = "distributor";
    });

    mediaResults = [...tag_results, ...director_results, ...studio_results, ...distributor_results];

    if (locals.user != undefined) {

      const userId = locals.user.id;

      // Fetch User-Created Lists
      userLists = await db.query(
        `SELECT * FROM list WHERE user_id = ${userId}`
      );

      collaborativeLists = await db.query(`
        select list.* from list INNER JOIN list_of_collaborators 
        WHERE list.list_id = list_of_collaborators.list_id AND list_of_collaborators.user_id = ${userId};
      `);

      if (collaborativeLists.length > 0) {
        userLists = userLists.concat(collaborativeLists);
      }

      

      // Fetch Media for Each User List
      
      if (userLists.length > 0) {
        const listIds = userLists.map((l) => l.list_id);
        const mediaQuery = `
                  SELECT list_of.list_id, media.*
                  FROM list_of 
                  INNER JOIN media ON list_of.media_id = media.media_id
                  WHERE list_of.list_id IN (${listIds.join(",")})
              `;
        const userMediaResults = await db.query(mediaQuery);

        // Group media by list ID
        userLists.forEach((list) => {
          mediaByList[list.list_id] = userMediaResults.filter(
            (m) => m.list_id === list.list_id
          );
        });

        // get current collaborators
        for (const list of userLists) {
          let user_search = await db.query(`
            SELECT user.user_name, user.user_id, user.user_icon_text, user.user_icon_colour, user.user_profile_path
            FROM user 
            WHERE user.user_id != ${locals.user.id} 
              AND user.user_id IN (
                SELECT list_of_collaborators.user_id 
                FROM list_of_collaborators 
                WHERE list_of_collaborators.list_id = ${list.list_id}
              )
          `);

            const original_creator = await db.query(`
              SELECT user.user_name, user.user_id, user.user_icon_text, user.user_icon_colour, user.user_profile_path
              FROM user INNER JOIN list ON user.user_id = list.user_id
              WHERE list.list_id = ${list.list_id}`);
            
            user_search = user_search.concat(original_creator);

          list.collaborators = user_search;
        }
      }
    }
    
    // get all users

    const allUsers = await db.query(`SELECT user_name, user_id, user_icon_text, user_profile_path, user_icon_colour 
                                    FROM user 
                                    WHERE user_id != ${locals.user.id}`);
    let formatedUsers = [];

    allUsers.forEach((user) => {
      user.label = user.user_name;
      user.value = {
        user_id: user.user_id,
        user_name: user.user_name,
        user_icon_text: user.user_icon_text,
        user_profile_path: user.user_profile_path,
        user_icon_colour: user.user_icon_colour
      };
      formatedUsers.push(user);
    });

    return {
      formatedUsers,
      mediaResults,
      userLists,
      mediaByList,
    };
  } catch (error) {
    console.error("Database error:", error);
    return { formatedUsers: [], mediaResults: [], userLists: [], mediaByList: {} };
  }
};

export const actions = {
  addCollaborator: async ({ request, locals }) => {

    const formData = await request.formData();

    const user_id = formData.get("user_id");
    const list_id = formData.get("list_id");
    const collaborator_user_id = formData.get("collaborator_user_id");

    if (collaborator_user_id == 0) {
      return {success: false, message: "Please select a user to add as a collaborator."};
    }

    if (parseInt(user_id) != parseInt(locals.user.id)) {

      return {success: false, message: "You are not who you say you are."};
    }

    try {
      // check if list exists and belongs to current user
      const list_search = await db.query(`SELECT * FROM list WHERE list_id = ${list_id} AND user_id = ${user_id}`);
    
      if (list_search.length === 0) {
        return {success: false, message: "List does not exist."};
      }

      // check if the user i want to add actually exists (it should but idk)
      const user_search = await db.query(`SELECT * FROM user WHERE user_id = ${collaborator_user_id}`);
      
      if (user_search.length === 0) {
        return {success: false, message: "Cannot find user"};
      }

      // check if the collaborator already has an entry for this list
      const collaborator_search = await db.query(`SELECT * FROM list_of_collaborators WHERE list_id = ${list_id} AND user_id = ${collaborator_user_id}`);

      if (collaborator_search.length > 0) {
        return {success: false, message: "This user is already a collaborator on this list."};

      }

      //add the collaborator
      const result = await db.query(`INSERT INTO list_of_collaborators (list_id, user_id) VALUES (${list_id}, ${collaborator_user_id})`);

      if (result.affectedRows !== 1) {
        throw new Error("database failed to insert collaborator");
      }

    } catch (e) {
      console.error("Error adding collaborator:", e);
      return fail(500, { server_error: true });
    }

    return {success: true, message: "Collaborator added successfully."};

  },
  removeCollaborator: async ({ request, locals }) => {

    const formData = await request.formData();

    const user_id = formData.get("user_id");
    const list_id = formData.get("list_id");
    const collaborator_user_id = formData.get("collaborator_user_id");

    if (collaborator_user_id == 0) {
      return {success: false, message: "Please select a user to add as a collaborator."};
    }

    if (parseInt(user_id) != parseInt(locals.user.id)) {

      return {success: false, message: "You are not who you say you are."};
    }



    try {

      // check if list exists and belongs to current user
      const list_search = await db.query(`SELECT * FROM list WHERE list_id = ${list_id} AND user_id = ${user_id}`);
    
      if (list_search.length === 0) {
        return {success: false, message: "List does not exist."};
      }

      // check to see if the user is a collaborator
      const collaborator_search = await db.query(`SELECT * FROM list_of_collaborators WHERE list_id = ${list_id} AND user_id = ${collaborator_user_id}`);

      if (collaborator_search.length === 0) {
        return {success: false, message: "This user is not a collaborator on this list."};
      }

      // remove the collaborator
      const result = await db.query(`DELETE FROM list_of_collaborators WHERE list_id = ${list_id} AND user_id = ${collaborator_user_id}`);

      if (result.affectedRows !== 1) {
        throw new Error("database failed to remove collaborator");
      }

    } catch (e) {
      console.error("Error removing collaborator:", e);
      return fail(500, { server_error: true });
    }

    return {success: true, message: "Collaborator removed successfully."};
  },
}