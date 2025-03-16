import { redirect } from "@sveltejs/kit";

export const actions = {
  default: async ({ cookies }) => {
    // Clear session cookie
    cookies.set("session", "", {
      path: "/",
      expires: new Date(0),
    });

    // Redirect to home after successful logout
    throw redirect(303, "/");
  },
};
