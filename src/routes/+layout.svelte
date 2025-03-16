<script>
    import '../app.postcss';
    import { page } from '$app/stores';
    import { Avatar } from '@skeletonlabs/skeleton';
    import { AppShell, AppBar } from '@skeletonlabs/skeleton';
    import { initializeStores } from '@skeletonlabs/skeleton';
    import { onMount } from 'svelte';
	import DynamicAvatar from '$lib/client/dynamic_avatar.svelte';

    initializeStores();

    let isMenuOpen = false;
    let isDropdownOpen = false;

    let initials = $page.data.user?.icon_text;
    let color = $page.data.user?.icon_colour;

    const toggleDropdown = () => {
        isDropdownOpen = !isDropdownOpen;
    };

    const handleProfile = (userId) => {
        window.location.href = `/user/${userId}`;
    };

    //goes to settings
    const handleSettingsChange = () => {
        window.location.href = `/settings`;
    };

    const handleSignOut = async () => {
        try {
            await fetch('/logout', {
                method: 'POST',
                headers: {
                    // Required for SvelteKit form actions
                    'Content-Type': 'application/x-www-form-urlencoded' 
                },
                body: new URLSearchParams(), // Required empty body
                credentials: 'include' // Essential for cookies
            });
            // Force full page reload to clear state
            window.location.href = '/'; 
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const closeDropdown = (event) => {
        if (!event.target.closest('.dropdown-container')) {
            isDropdownOpen = false;
        }
    };

    onMount(() => {
        document.addEventListener('click', closeDropdown);
        return () => {
            document.removeEventListener('click', closeDropdown);
        };
    });
</script>

<!-- App Shell -->
<AppShell>
    <svelte:fragment slot="header">
        <!-- App Bar -->
        <AppBar class="app-bar-shadow">
            <svelte:fragment slot="lead">
                <a href="/"><strong class="text-xl uppercase">REVIEW DOC</strong></a>
            </svelte:fragment>
            <svelte:fragment slot="trail">
                <div class="relative">
                    <button
                        class="md:hidden btn btn-sm variant-ghost-surface"
                        on:click={() => isMenuOpen = !isMenuOpen}>
                        Menu ☰
                    </button>
                    
                    <div class={`absolute top-full left-0 w-full md:static ${isMenuOpen ? 'block' : 'hidden'} md:flex z-50`}>
                        <ul class="font-medium flex flex-col md:p-0 mt-2 border bg-surface-700 rounded-lg md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0">
                            <li>
                                <a href="/list" class="block mt-1 mb-1 mr-1 ml-1 rounded dark:hover:variant-filled md:hover:variant-filled md:border-0 md:p-0">List's</a>
                            </li>
                            <li>
                                <a href="/media" class="block mt-1 mb-1 mr-1 ml-1 rounded dark:hover:variant-filled md:hover:variant-filled md:border-0 md:p-0">Media</a>
                            </li>
                            <li>
                                <a href="/award" class="block mt-1 mb-1 mr-1 ml-1 rounded dark:hover:variant-filled md:hover:variant-filled md:border-0 md:p-0">Awards</a>
                            </li>
                            <li>
                                <a href="/scale" class="block mt-1 mb-1 mr-1 ml-1 rounded dark:hover:variant-filled md:hover:variant-filled md:border-0 md:p-0">Scale</a>
                            </li>
                        </ul>
                    </div>
                </div>
                {#if $page.data.user}
                    <div class="relative dropdown-container">
                        <button type="button" on:click={toggleDropdown}>
                            <DynamicAvatar
                                user_id={$page.data.user.id}
                                width="w-8"
                                user_initals={$page.data.user.icon_text}
                                user_colour={$page.data.user.icon_colour}
                                user_image={$page.data.user.profile_path}
                            />

                        </button>
                        {#if isDropdownOpen}
                            <div class="dropdown-menu absolute right-0 rounded shadow-md mt-2 z-50">
                                <button
                                    class="dropdown-item block w-full px-4 py-2 text-left"
                                    on:click={() => handleProfile($page.data.user.id)}>
                                    Profile
                                </button>
                                <button
                                    class="dropdown-item block w-full px-4 py-2 text-left"
                                    on:click={handleSignOut}>
                                    Sign Out
                                </button>
                                <button
                                    class="dropdown-item block w-full px-4 py-2 text-left"
                                    on:click={handleSettingsChange}>
                                    Settings
                                </button>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <button type="button" on:click={() => window.location.href = `/login`}>
                        <Avatar width="w-8" initials="?" background="bg-slate-600" />
                    </button>
                {/if}
            </svelte:fragment>
        </AppBar>
    </svelte:fragment>

    <!-- Page Route Content -->
    <slot />
</AppShell>

<style>
    .dropdown-menu {
        background-color: rgb(52, 52, 52);
        min-width: 150px;
        padding: 0.5rem 0;
        border-radius: 5px;
    }

    .dropdown-item {
        color: white;
        background-color: transparent;
        transition: background-color 0.2s ease;
    }

    .dropdown-item:hover {
        background-color: rgb(80, 80, 80);
    }
</style>
