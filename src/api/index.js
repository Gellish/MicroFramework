/**
 * API Strategy Switcher
 * Exports implementations based on granular configuration.
 */

const AUTH_PROVIDER = import.meta.env.API_AUTH_PROVIDER || 'firebase';
const POSTS_PROVIDER = import.meta.env.API_POSTS_PROVIDER || 'rest';
const USERS_PROVIDER = import.meta.env.API_USERS_PROVIDER || 'rest';

let authService, postsService, usersService;

// Load Auth Service
if (AUTH_PROVIDER === 'firebase') {
    ({ authService } = await import('./firebase/auth.js'));
} else if (AUTH_PROVIDER === 'supabase') {
    ({ authService } = await import('./supabase/auth.js'));
} else {
    ({ authService } = await import('./rest/auth.js'));
}

// Load Posts Service
if (POSTS_PROVIDER === 'firebase') {
    ({ postsService } = await import('./firebase/posts.js'));
} else if (POSTS_PROVIDER === 'supabase') {
    ({ postsService } = await import('./supabase/posts.js'));
} else {
    ({ postsService } = await import('./rest/posts.js'));
}

// Load Users Service
if (USERS_PROVIDER === 'firebase') {
    ({ usersService } = await import('./firebase/users.js'));
} else if (USERS_PROVIDER === 'supabase') {
    ({ usersService } = await import('./supabase/users.js'));
} else {
    ({ usersService } = await import('./rest/users.js'));
}

export { authService, postsService, usersService };
