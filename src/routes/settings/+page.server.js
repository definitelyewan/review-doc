import bcrypt from "bcryptjs";
import { fail, redirect } from "@sveltejs/kit";
import db from "$lib/server/db.js";
import security from "$lib/server/security.js";

export const load = async ({ params, locals }) => {
  if (locals.user === undefined) {
    redirect(303, "/login");
  }

  let user_settings = {};

  try {
    const user_info = await db.query(
      `SELECT * FROM user WHERE user_id = ${locals.user.id} LIMIT 1`
    );
    user_settings = user_info[0];
  } catch (error) {
    console.error(error);
    redirect(303, "/login");
  }

  return { settings: user_settings };
};

export const actions = {
  changePassword: async ({ request, locals }) => {
    const formData = await request.formData();
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (newPassword !== confirmPassword) {
      return fail(400, { password_mismatch: true });
    }

    // Get the current user's username from the session or locals
    const username = locals.user.name;

    if (!username) {
      return fail(401, { unauthorized: true });
    }

    // Check if the user exists
    const user = await db.query(
      `SELECT * FROM user WHERE user_name = '${username}' LIMIT 1`
    );

    if (user.length === 0) {
      return fail(400, { user_not_found: true });
    }

    const userData = user[0];

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user_token = crypto.randomUUID();

    // Update the password & user token in the database
    await db.query(
      `UPDATE user SET user_pass = '${hashedPassword}', user_token = '${user_token}' WHERE user_name = '${username}'`
    );

    // Redirect to the success page or login page after successful password change
    throw redirect(303, "/login");
  },
  delete_account: async ({ locals }) => {
    // additional security measure to make sure the correct user is deleted
    if (!locals.user) {
      return { deleted: false };
    }

    try {
      //delete reviews from user
      await db.query(
        `DELETE FROM review WHERE user_id = (SELECT user_id FROM user WHERE user_name = '${locals.user.name}' LIMIT 1)`
      );

      //set media to admin user
      await db.query(
        `UPDATE media SET user_id = 1 WHERE user_id = (SELECT user_id FROM user WHERE user_name = '${locals.user.name}' LIMIT 1)`
      );

      //delete user from database
      await db.query(
        `DELETE FROM user WHERE user_name = '${locals.user.name}'`
      );

      console.log("Account successfully deleted.");
    } catch (error) {
      //logs an error that may occur in the deletion process
      console.error("Account deletion failed:", error);
      return { deleted: false };
    }

    redirect(303, "/login");
  },

  changeIconInitials: async ({ request, locals }) => {
    const formData = await request.formData();
    const initials = formData.get("initials");

    // Validate initials
    if (!initials || initials.length !== 2) {
      return fail(400, { invalid_initials: true });
    }

    try {
      await db.query(
        `UPDATE user SET user_icon_text = '${initials.toUpperCase()}' WHERE user_id = (SELECT user_id FROM user WHERE user_name = '${locals.user.name}')`
      );

      locals.user.icon_initials = initials.toUpperCase();

      return { success: "initials" };
    } catch (error) {
      console.error("Error updating initials:", error);
      return fail(500, { server_error: true });
    }
  },

  changeIconColor: async ({ request, locals }) => {
    const formData = await request.formData();
    const color = formData.get("color");

    // Validate color
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      return fail(400, { invalid_color: true });
    }

    try {
      const result = await db.query(
        `UPDATE user SET user_icon_colour = '${color.substring(1)}' WHERE user_id = ${locals.user.id}`
      );

      console.log(result);

      locals.user.icon_colour = color;

      return { success: "color" };
    } catch (error) {
      console.error("Error updating color:", error);
      return fail(500, { server_error: true });
    }
  },
  changeUsername: async ({ request, locals }) => {
    const formData = await request.formData();
    const newUsername = formData.get('newUsername');
    const confirmUsername = formData.get('confirmUsername');
    
    if (newUsername !== confirmUsername) {
        return fail(400, { username_mismatch: true });
    }

    // Get the current user's username from the session or locals
    const username = locals.user.name;

    if (!username) {
        return fail(401, { unauthorized: true });
    }

    // Check if the user exists
    const user = await db.query(`SELECT * FROM user WHERE user_name = '${username}' LIMIT 1`);

    if (user.length === 0) {
        return fail(400, { user_not_found: true });
    }

    const other_users = await db.query(`SELECT * FROM user WHERE user_name = '${newUsername}' LIMIT 1`);

    if (other_users.length > 0) {
        return fail(400, { username_exists: true });
    }

    // get a new token to log people out
    const user_token = crypto.randomUUID();

    // Update the username & user token in the database
    try {
      const result = await db.query(
        `UPDATE user SET user_name = '${newUsername}', user_token = '${user_token}' WHERE user_id = '${locals.user.id}'`
      );

      if (result.affectedRows === 0) {
        return fail(500, { server_error: true });
      }
    } catch (e) {
        console.error(e);
        return fail(500, { server_error: true });
    }

    // Redirect to the success page or login page after successful username change
    throw redirect(303, '/login');
  },
  changeProfilePicture: async ({ request, locals }) => {
    const formData = await request.formData();
    const image = formData.get('profilePicture');

    try {
      const result = await security.add_profile_picture(image, locals.user.id);
      return { success: "image" };
    } catch (error) {
      console.error("Error updating profile picture:", error);
      return fail(500, { server_error: true });
    }
  }

};
