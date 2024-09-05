<script>

    import '../app.postcss';
    import { page } from '$app/stores';
    import { Avatar } from '@skeletonlabs/skeleton';
    import { AppShell, AppBar } from '@skeletonlabs/skeleton';
    import { initializeStores } from '@skeletonlabs/skeleton';

    initializeStores();

    let isMenuOpen = false;

</script>
<meta property="og:title" content="Review Doc"/>

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
                        <ul class="font-medium flex flex-col md:p-0 mt-2 border bg-surface-700 rounded-lg md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 z-50">
                            <li>
                                <a href="/media" class="block mt-1 mb-1 mr-1 ml-1 rounded dark:hover:variant-filled md:hover:variant-filled md:border-0 md:p-0">Media</a>
                            </li>
                            <li>
                                <a href="/award" class="block mt-1 mb-1 mr-1 ml-1 rounded dark:hover:variant-filled md:hover:variant-filled md:border-0 md:p-0">Awards</a>
                            </li>
                            <li>
                                <a href="/scale" class="block mt-1 mb-1 mr-1 ml-1 rounded dark:hover:variant-filled md:hover:variant-filled md:border-0 md:p-0">Scale</a>
                            </li>
                            <li>
                                {#if $page.data.user}
                                <button class="block mt-1 mb-1 mr-1 ml-1 rounded dark:hover:variant-filled md:hover:variant-filled md:border-0 md:p-0" on:click={() => window.location.href = `/dashboard`}>
                                    Dashboard
                                </button>
                                {/if}
                            </li>
                        </ul>
                    </div>
                </div>
                {#if $page.data.user}
                    <button type="button" on:click={() => window.location.href = `/user/${$page.data.user.id}`}>
                        <Avatar width="w-8" initials={$page.data.user.name} background="bg-primary-500" />
                    </button>
                {/if}
            </svelte:fragment>
        </AppBar>
    </svelte:fragment>

    <!-- Page Route Content -->
    <slot />
</AppShell>


