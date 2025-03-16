<script>

    export let data;
    export let form;
    import { page } from '$app/stores';
    import { TreeView, TreeViewItem} from '@skeletonlabs/skeleton';
    import { Avatar } from '@skeletonlabs/skeleton';
    import { Autocomplete } from '@skeletonlabs/skeleton';
    import { initializeStores } from '@skeletonlabs/skeleton';
    import { enhance } from '$app/forms';
    import DynamicAvatar from '$lib/client/dynamic_avatar.svelte';

    initializeStores();

    // Auto-generated media grouped by tag name
    let groupedAutoMedia = data.mediaResults.reduce((acc, item) => {
        
        //i hate coding man
        const key = `${item.descriptor_name}_${item.descriptor_type}`;
        if (!acc[key]) {
            acc[key] = [];
        }

        acc[key].push(item);
        return acc;
    }, {});


    let tags = [...new Set(data.mediaResults.map(item => JSON.stringify({ name: item.descriptor_name, type: item.descriptor_type })))].map(item => JSON.parse(item));
    
    // User lists grouped by list name
    let groupedUserMedia = data.userLists.reduce((acc, list) => {
        acc[list.list_id] = {
            name: list.list_name || "Unnamed List",
            user_id: list.user_id,
            description: list.list_description || "No description provided",
            media: data.mediaByList?.[list.list_id] || [],
            possible_collaborators: list.possible_collaborators || [],
            collaborators: list.collaborators || []
        };

        return acc;
    }, {});

    let listIds = Object.keys(groupedUserMedia).filter(id => groupedUserMedia[id].media.length > 0);

    /**
     * Collab menu code
     */
    const users = data.formatedUsers;

    let search_val = '';
    let collaborator_request = { user_id: 0, user_name: 'a user' };
    let curr_list_id = 0;

    function init_selections(list_id) {
        search_val = '';
        collaborator_request = { user_id: 0, user_name: 'a user' };
        curr_list_id = list_id;

        if (form.message != null) {
            form.message = '';
        }
    }

    function on_popup_select(event) {
        search_val = event.detail.label;
        collaborator_request = {
            user_id: event.detail.user_id,
            user_name: event.detail.user_name
        }
    }

    function refresh_page() {

        if (typeof window !== 'undefined') {
            window.location.href = `/list#${curr_list_id}`;
            window.location.reload();
        }
    }

    // filter and limit options based on search input
    $: filtered_options = users
    .filter(option => search_val && option.label.toLowerCase().startsWith(search_val.toLowerCase()))
    .slice(0, 5);

</script>

<div class="container mx-auto px-4 py-8">

    <!-- User-Created Lists -->

    {#if $page.data.user}
        
        <h1 class="text-3xl font-bold mb-2 text-center">My Lists</h1>

        <TreeView padding="" open="true">

            {#each listIds as listId}
                <div id="{listId}"></div>
                <TreeViewItem>
                    <h2 class="text-2xl font-semibold">{groupedUserMedia[listId].name} 
                        
                    </h2>
                    <p class="text-sm text-gray-400">{groupedUserMedia[listId].description}</p>
                    <svelte:fragment slot="children">
                        <div class="mt-1 mb-8">
            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
                                {#each groupedUserMedia[listId].media as media}
                                        <a href="/media/{media.media_id}" class="block">
                                            <div class="relative card p-4 rounded-lg flex items-center overflow-hidden" style="min-height: 160px;">
                                                <!-- Banner -->
                                                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40">
                                                    <div class="absolute inset-0 bg-cover bg-center" 
                                                        style="background-image: url('/api/media/image/{media.media_id}/banner');">
                                                    </div>
                                                </div>
                                                
                                                <!-- Content -->
                                                <div class="relative z-10 flex items-start space-x-4">
                                                    <!-- Cover Image -->
                                                    <div class="flex-shrink-0">
                                                        <img
                                                            src="/api/media/image/{media.media_id}/cover"
                                                            alt={media.media_name}
                                                            class="w-24 h-36 object-cover rounded-md shadow-lg"
                                                        />
                                                    </div>
                                                    
                                                    <!-- Text Content -->
                                                    <div class="flex-1">
                                                        <h3 class="font-medium text-lg text-white mb-2">{media.media_name}</h3>
                                                        <p class="text-sm text-gray-200 capitalize">
                                                            {media.media_type}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    {/each}
                                </div>
                            </div>

                        {#if groupedUserMedia[listId].name !== 'Favourites'}
                            {#if groupedUserMedia[listId].collaborators.length > 0}
                                <div class="flex flex-wrap mb-1">
                                    <p class="text-xl mr-2">👥 Collaborators: </p>
                                    {#each groupedUserMedia[listId].collaborators as collaborator}
                                        <div class="mr-1">
                                            {#if collaborator.user_id != $page.data.user.id}
                                                <DynamicAvatar
                                                    user_id={collaborator.user_id}
                                                    width="w-8"
                                                    user_initals={collaborator.user_icon_text}
                                                    user_colour={collaborator.user_icon_colour}
                                                    user_image={collaborator.user_profile_path}
                                                />    
                                            {/if}
                                        </div>

                                        
                                    {/each}
                                </div>
                            {/if}

                            {#if groupedUserMedia[listId].user_id === $page.data.user.id}
                                <TreeView width="w-full" padding="">
                                    <TreeViewItem width="w-full" on:click={() => {init_selections(listId)}}>
                                            <p>Collaboration settings</p>
                                            <p class="text-sm text-gray-400">Control who can contribute to your list.</p>
                                        <svelte:fragment slot="children">
                                            <div class="mr-2 ml-2">
                                                <input
                                                    class="input autocomplete mt-2 z-1"
                                                    type="search"
                                                    name="autocomplete-search"
                                                    bind:value={search_val}
                                                    placeholder="Search..."
                                                />
                                                <div class="w-full text-left items-start z-50 rounded-lg p-4 mt-1 shadow-lg bg-surface-700">
                                                    <Autocomplete
                                                        bind:input={search_val}
                                                        options={filtered_options}
                                                        on:selection={on_popup_select}
                                                    />
                                                </div>


                                                
                                                <p class="text-sm text-gray-400">Search for potential users to collaborate with</p>
                                                


                                                <div class="w-full justify-center flex flex-wrap">

                                                    <form class="p-2" action="?/addCollaborator" method="POST" use:enhance>
                                                        <input type="hidden" name="user_id" value={$page.data.user.id} />
                                                        <input type="hidden" name="list_id" value={listId} />
                                                        <input type="hidden" name="collaborator_user_id" value={collaborator_request.user_id} />
                                                        <button type="submit" class="btn mt-2 bg-white text-black rounded-lg hover:bg-gray-200">Add {collaborator_request.user_name} to list</button>
                                                    </form>
                                                    <form class="p-2" action="?/removeCollaborator" method="POST" use:enhance>
                                                        <input type="hidden" name="user_id" value={$page.data.user.id} />
                                                        <input type="hidden" name="list_id" value={listId} />
                                                        <input type="hidden" name="collaborator_user_id" value={collaborator_request.user_id} />
                                                        <button type="submit" class="btn mt-2 bg-white text-black rounded-lg hover:bg-gray-200">Remove {collaborator_request.user_name} from a list</button>
                                                    </form>
                                                </div>
                                                {#if form?.success === false}
                                                    <p class="text-center text-error-500">{form.message}</p>
                                                {:else if form?.success === true}
                                                    {@html refresh_page()}
                                
                                                {/if}



                                            </div>
                                        </svelte:fragment>
                                    </TreeViewItem>
                                </TreeView>

                            {/if}
                        {/if}

                            

                    </svelte:fragment>
                </TreeViewItem>
            {/each}
        </TreeView>

    {/if}



    <h1 class="text-3xl font-bold mb-1 text-center">Discover Media</h1>
    <p class="text-xl mb-8 text-center">Categorized by tags, directors, studios, and other metrics.</p>
    
    <!-- Auto-generated Media by Popular Tags -->

    <TreeView padding="">
        {#each tags as tag}
            <TreeViewItem>
                <h2 class="text-2xl font-semibold">{tag.name}</h2>
                {#if tag.type === 'tag'}
                    <p class="text-sm text-gray-400">Media in the {tag.name} category</p>
                {:else if tag.type === 'director'}
                    <p class="text-sm text-gray-400">Media directed by {tag.name}</p>
                {:else if tag.type === 'studio'}
                    <p class="text-sm text-gray-400">Media produced by {tag.name}</p>
                {:else if tag.type === 'distributor'}
                    <p class="text-sm text-gray-400">Media distributed by {tag.name}</p>
                {/if}
                <svelte:fragment slot="children">
                    <div class="mt-1 mb-8">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {#each groupedAutoMedia[`${tag.name}_${tag.type}`] as media (media.media_id)}
                                <a href="/media/{media.media_id}" class="block">
                                    <div class="relative card p-4 rounded-lg flex items-center overflow-hidden" style="min-height: 160px;">

                                        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40">
                                            <div class="absolute inset-0 bg-cover bg-center" 
                                                style="background-image: url('/api/media/image/{media.media_id}/banner');">
                                            </div>
                                        </div>
                                        

                                        <div class="relative z-10 flex items-start space-x-4">

                                            <div class="flex-shrink-0">
                                                <img
                                                    src="/api/media/image/{media.media_id}/cover"
                                                    alt={media.media_name}
                                                    class="w-24 h-36 object-cover rounded-md shadow-lg"
                                                />
                                            </div>

                                            <div class="flex-1">
                                                <h3 class="font-medium text-lg text-white mb-2">{media.media_name}</h3>
                                                <p class="text-sm text-gray-200 capitalize">
                                                    {media.media_type}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            {/each}
                        </div>
                    </div>
                </svelte:fragment>
            </TreeViewItem>
        {/each}
    </TreeView>

</div>

<style>
    .card {
        background-color: rgb(var(--color-surface-700) / 0.8);
        transition: transform 0.2s;
    }
    
    .card:hover {
        transform: translateY(-2px);
    }
</style>