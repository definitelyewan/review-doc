import db from "$lib/server/db.js";

export async function handle({ event, resolve }) {
  const session = event.cookies.get("session");

  // normal page cuz no cookie
  if (!session) {
    return await resolve(event);
  }

  // if a cookie exists give envery page this info
  const users = await db.query(
    `SELECT user_id, user_name, user_type, user_profile_path, user_icon_text, user_icon_colour FROM user WHERE user_token = '${session}' LIMIT 1`
  );

  if (users.length > 0) {
    event.locals.user = {
      id: users[0].user_id,
      name: users[0].user_name,
      type: users[0].user_type,
      profile_path: users[0].user_profile_path,
      icon_text: users[0].user_icon_text,
      icon_colour: users[0].user_icon_colour,
    };
  }

  return await resolve(event);
}
