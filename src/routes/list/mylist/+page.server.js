import { fail } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import db from "$lib/server/db.js";

export const load = async ({ locals }) => {

  let user_lists = [];

  try {
    const lists_info = await db.query(
      `SELECT * FROM lists WHERE user_id = ${locals.user.id}`
    );
    user_lists = lists_info;
  } catch (error) {
    console.error(error);
  }

  return { lists: user_lists };
};

export const actions = {
  createList: async ({ request, locals }) => {
    const formData = await request.formData();
    const listName = formData.get("newListName");
    const listDescription = formData.get("newListDescription");

    if (!listName || !listDescription) {
      return fail(400, { missing_fields: true });
    }

    // Get the current user's ID from locals
    const userId = locals.user.id;

    try {
      const result = await db.query(
         `INSERT INTO list (user_id, list_name, list_description) VALUES ('${userId}', '${listName}', '${listDescription}')`
      );

      return { success: true, newListId: result.insertId };
    } catch (error) {
      console.error("Error creating list:", error);
      return fail(500, { server_error: true });
    }
  },

  addToList: async ({ request, locals }) => {
    const formData = await request.formData();
    const listName = formData.get("selectedList");
    const mediaId = formData.get("media_id");
    const userId = locals.user.id; // current user ID

    if (!userId || !listName || !mediaId) {
        return fail(400, { missing_fields: true });
    }

    try {
      // check if list exists and belongs to current user
      const listQuery = await db.query(
          `SELECT list_id FROM list WHERE user_id = '${userId}' AND list_name = '${listName}' LIMIT 1`
      );

      const listQueryCollab = await db.query(`
        SELECT list.list_id FROM list_of_collaborators INNER JOIN list 
        WHERE list_of_collaborators.list_id = list.list_id 
        AND list_of_collaborators.user_id = ${userId} 
        AND list.list_name = '${listName}' 
        LIMIT 1
      `);

      if (listQuery.length === 0 && listQueryCollab.length === 0) {
          return fail(400, { list_not_found: true });
      }

      let listId = 0;

      if (listQuery.length > 0) {
        listId = listQuery[0].list_id;
      } else if (listQueryCollab.length > 0) {
        listId = listQueryCollab[0].list_id;
      } else {
        return fail(400, { list_not_found: true });
      }


      // check if media is already in list
      const existingRecord = await db.query(
          `SELECT * FROM list_of WHERE list_id = '${listId}' AND media_id = '${mediaId}'`
      );

      if (existingRecord.length > 0) {
          return fail(400, { media_already_in_list: true });
      }

      // add media to list
      await db.query(
          `INSERT INTO list_of (list_id, media_id) VALUES ('${listId}', '${mediaId}')`
      );

      return { success: true };
    } catch (error) {
        console.error("Error adding media to list:", error);
        return fail(500, { server_error: true });
    }
  },

  removeFromList: async ({ request, locals }) => {
    const formData = await request.formData();
    const listName = formData.get("selectedRemoveList");
    const mediaId = formData.get("media_id");
    const userId = locals.user.id; // current user ID

    if (!listName|| !mediaId) {
      return fail(400, { missing_fields: true });
    }

    try {
      // check if list exists and belongs to current user
      const listQuery = await db.query(
          `SELECT list_id FROM list WHERE user_id = '${userId}' AND list_name = '${listName}' LIMIT 1`
      );

      const listQueryCollab = await db.query(`
        SELECT list.list_id FROM list_of_collaborators INNER JOIN list 
        WHERE list_of_collaborators.list_id = list.list_id 
        AND list_of_collaborators.user_id = ${userId} 
        AND list.list_name = '${listName}' 
        LIMIT 1
      `);

      if (listQuery.length === 0 && listQueryCollab.length === 0) {
        return fail(400, { list_not_found: true });
      }

      let listId = 0;

      if (listQuery.length > 0) {
        listId = listQuery[0].list_id;
      } else if (listQueryCollab.length > 0) {
        listId = listQueryCollab[0].list_id;
      } else {
        return fail(400, { list_not_found: true });
      }

      // remove media from list
      await db.query(
        `DELETE FROM list_of WHERE list_id = '${listId}' AND media_id = '${mediaId}'`,
      );

      return { success: true };
    } catch (error) {
        console.error("Error removing media from list:", error);
        return fail(500, { server_error: true });
    }
  }
}
