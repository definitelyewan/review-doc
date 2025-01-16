import { redirect } from '@sveltejs/kit';

/**
 * Redirect to home
 */
export const load = async () => {
    redirect(302, '/');
}

/**
 * Logout the user and redirect to home
 */
export const actions = {
    default({ cookies }) {
        // eat the cookie
        cookies.set('session', '', {
            path: '/',
            expires: new Date(0),
        })

        // redirect the user
        redirect(302, '/')
    },
}
