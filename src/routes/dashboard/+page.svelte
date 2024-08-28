<script>

    export let form;

    import { page } from '$app/stores';
    import { enhance } from '$app/forms';
    import { Avatar } from '@skeletonlabs/skeleton';
    import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
    import { TreeView, TreeViewItem, RecursiveTreeView } from '@skeletonlabs/skeleton';
    import corr from '$lib/client/corrections.js';

    import { Autocomplete } from '@skeletonlabs/skeleton';
    import { popup } from '@skeletonlabs/skeleton';
    import { storePopup } from '@skeletonlabs/skeleton';
    import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';




    let value = NaN;
    let selectable_options = [];
    let search_val = '';
    let edit_values = null;
    let lookup = null;
    let media_data = null;
    let review_bullets = '';
    let review_score = 0;
    let review_sub_name = '';
    let review_id = '';
    let review_platform = '';
    let media_id = '';
    let media_type = '';
    let media_search_word = '';
    let media_directors = '';
    let popup_settings = {
        event: 'focus-click',
        target: 'popupAutocomplete',
        placement: 'bottom',
    };


    let manual_media = {
        name: '',
        cover_url: '',
        banner_url: '',
        tags: '',
        studios: '',
        distributors: '',
        directors: '',
        media_date_range_start: '',
        media_date_range_end: ''
    }
    let award_name = '';

    storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

    function on_popup_select(event) {
        search_val = event.detail.label;
        edit_values = event.detail.value;

        // modify
        if (value === 0) {
            review_bullets = edit_values.bullets.join('\n');
            review_score = parseInt(edit_values.score);
            review_sub_name = edit_values.review_sub_name;
            review_id = edit_values.review_id;
            review_platform = edit_values.review_platform;
        // review
        } else if (value === 1) {
            review_bullets = '';
            review_score = 0;
            review_sub_name = '';
            review_id = '';
            review_platform = '';
            media_id = edit_values.media_id;
        // add
        } else if (value === 2) {
            media_type = edit_values.media_type;
        // award nominate
        } else if (value === 3) {
            media_id = edit_values.media_id;
            media_type = edit_values.media_type;
        }


        //update_review_fields(edit_values, value);
    }

    $: if (form?.search) {
        selectable_options = form.search;
            
    }
    $: if (form?.lookup) {
        lookup = form.lookup;
    }
    $: if (form?.media_data) {
        media_data = form.media_data;
    }


    $: filtered_options = selectable_options
        .filter(option => option.label.toLowerCase().includes(search_val.toLowerCase()))
        .slice(0, 10);



</script>

<div class="mt-2 mb-2 mr-2 ml-2">
    <RadioGroup display="flex" class="items-center justify-center">
        <RadioItem on bind:group={value} name="justify" value={0}>
            <form action="?/user_reviews" method="POST" use:enhance on:submit|preventDefault>
                <button class="flex-grow w-full" type="submit" on:click={() => { value = 0; edit_values = null; }}>Modify</button>
            </form>
        </RadioItem>
        <RadioItem bind:group={value} name="justify" value={1}>
            <form action="?/all_media" method="POST" use:enhance on:submit|preventDefault>
                <button class="flex-grow w-full" type="submit" on:click={() => { value = 1; edit_values = null; }}>Review</button>
            </form>
        </RadioItem>
        <RadioItem bind:group={value} name="justify" value={2}>
            <form action="?/all_types" method="POST" use:enhance on:submit|preventDefault>
                <button class="flex-grow w-full" type="submit" on:click={() => { value = 2; edit_values = null; }}>Add</button>
            </form>
        </RadioItem>
        <RadioItem bind:group={value} name="justify" value={3}>
            <form action="?/reviewed_this_year" method="POST" use:enhance on:submit|preventDefault>
                <button class="flex-grow w-full" type="submit" on:click={() => { value = 3; edit_values = null; }}>Award</button>
            </form>
        </RadioItem>
    </RadioGroup>
</div>

{#if value === 0}
    <div class="relative card mt-2 p-2 shadow-lg rounded-lg flex items-center justify-center mx-auto mr-2 ml-2">
        <div class="flex flex-col w-full">
            <div class="grid grid-cols-1 w-full p-2">
                <p class="text-center">Search for a review to modify</p>
                <div class="relative w-full">
                    <input
                        class="input autocomplete mt-2 z-1 w-full"
                        type="search"
                        name="autocomplete-search"
                        bind:value={search_val}
                        placeholder="Search..."
                        use:popup={popup_settings}
                    />
                    <div data-popup="popupAutocomplete" class="absolute top-0 left-0 right-0 z-50 rounded-lg p-4 shadow-lg bg-surface-700 w-full">
                        <Autocomplete
                            bind:input={search_val}
                            options={filtered_options}
                            on:selection={on_popup_select}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
    {#if edit_values != null}
        <p class="text-3xl p-2">Score</p>
        <div class="flex flex-wrap items-center justify-center mt-2 mb-2 mr-2 ml-2">
            {#each {length : 11} as _, i}
                <button type="button" on:click={() => review_score = i} class="p-1">
                    <Avatar
                        border="border-4 {review_score === i ? 'border-primary-500' : 'border-surface-300-600-token hover:!border-primary-500'}"
                        initials={i === 0 ? "💀" : i.toString()}
                        cursor="cursor-pointer"
                        width="w-12"/>
                </button>
            {/each}
        </div>
        <p class="text-3xl p-2">Review Bullets</p>
        <div class="items-center justify-center p-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="8"
                bind:value={review_bullets}
                on:input={(e) => review_bullets = e.target.value}
                placeholder="review content..."
            ></textarea>
            <p class="text-sm"><i>Each new line(use of the enter key) will be treated as a bullet point.</i></p>
        </div>
        <p class="text-3xl p-2">Version or Season</p>
        <div class="items-center justify-center p-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={review_sub_name}
                on:input={(e) => review_sub_name = e.target.value}
                placeholder="What version/season is this for?"
            ></textarea>
            <p class="text-sm"><i>Tv shows must match the following format to be cataloged correctly. If a review is for season 1 only enter the number 1 in this box, if it is for multiple seasons like season 1 through 3 please enter it like so "1 2 3" with a space between each number. Otherwise, anything can be put here like "Remastered" for a game or or "2005 DVD" for a movie.</i></p>
        </div>
        <p class="text-3xl p-2">Platform</p>
        <div class="items-center justify-center p-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={review_platform}
                on:input={(e) => review_platform = e.target.value}
                placeholder="Where did you watch/play this?"
            ></textarea>
            <p class="text-sm"><i>Where you watched or played this media. For example, "Steam" could be could be where you played Bioshock or Disney+ could be where you watched Andor</i></p>
        </div>
        <div class="flex flex-wrap items-center justify-center ">
            <form action="?/update_review" method="POST" use:enhance on:submit|preventDefault >
                <input type="hidden" name="review_score" value={review_score} />
                <input type="hidden" name="review_bullets" value={review_bullets} />
                <input type="hidden" name="review_id" value={review_id} />
                <input type="hidden" name="review_sub_name" value={review_sub_name} />
                <input type="hidden" name="review_platform" value={review_platform} />
                <button class="ml-2 mr-2 mt-2 mb-2 bg-surface-100 text-slate-900 rounded-xl">
                    <span class="text-md p-2">Update Review</span>
                </button>
            </form>
            <form class="delete_review" action="?/delete_review" method="POST" use:enhance on:submit|preventDefault>
                <input type="hidden" name="review_id" value={review_id} />
                <button class="ml-2 mr-2 mt-2 mb-2 bg-surface-100 text-slate-900 rounded-xl">
                    <span class="text-md p-2">Delete Review</span>
                </button>
            </form>
        </div>
        {#if form?.success === true}
            <p class="text-center text-success-500">Review has been updated!</p>
        {:else if form?.success === false}
            <p class="text-center text-error-500">Review failed to update! because {form.message}</p>

        {/if}
    {/if}
{:else if value === 1}
    <div class="relative card mt-2 p-2 shadow-lg rounded-lg flex items-center justify-center mx-auto mr-2 ml-2">
        <div class="flex flex-col w-full">
            <div class="grid grid-cols-1 w-full p-2">
                <p class="text-center">Search for media</p>
                <div class="relative w-full">
                    <input
                        class="input autocomplete mt-2 z-1 w-full"
                        type="search"
                        name="autocomplete-search"
                        bind:value={search_val}
                        placeholder="Search..."
                        use:popup={popup_settings}
                    />
                    <div data-popup="popupAutocomplete" class="absolute top-0 left-0 right-0 z-50 rounded-lg p-4 shadow-lg bg-surface-700 w-full">
                        <Autocomplete
                            bind:input={search_val}
                            options={filtered_options}
                            on:selection={on_popup_select}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
    {#if edit_values != null}
        <div class="flex flex-wrap items-center justify-center mt-2 mb-2">
            {#each {length : 11} as _, i}
                <button type="button" on:click={() => review_score = i} class="p-1">
                    <Avatar
                        border="border-4 {review_score === i ? 'border-primary-500' : 'border-surface-300-600-token hover:!border-primary-500'}"
                        initials={i === 0 ? "💀" : i.toString()}
                        cursor="cursor-pointer"
                        width="w-12"/>
                </button>
            {/each}
        </div>
        <p class="text-3xl p-2">Review Bullets</p>
        <div class="items-center justify-center p-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="8"
                bind:value={review_bullets}
                on:input={(e) => review_bullets = e.target.value}
                placeholder="review content..."
            ></textarea>
            <p class="text-sm"><i>Each new line(use of the enter key) will be treated as a bullet point.</i></p>
        </div>
        <p class="text-3xl p-2">Version or Season</p>
        <div class="items-center justify-center p-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={review_sub_name}
                on:input={(e) => review_sub_name = e.target.value}
                placeholder="What version/season is this for?"
            ></textarea>
            <p class="text-sm"><i>Tv shows must match the following format to be cataloged correctly. If a review is for season 1 only enter the number 1 in this box, if it is for multiple seasons like season 1 through 3 please enter it like so "1 2 3" with a space between each number. Otherwise, anything can be put here like "Remastered" for a game or or "2005 DVD" for a movie. If your reviewing a Tv show you <b>MUST</b> include a version or season.</i></p>
        </div>
        <p class="text-3xl p-2">Platform</p>
        <div class="items-center justify-center p-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={review_platform}
                on:input={(e) => review_platform = e.target.value}
                placeholder="Where did you watch/play this?"
            ></textarea>
            <p class="text-sm"><i>Where you watched or played this media. For example, "Steam" could be could be where you played Bioshock or Disney+ could be where you watched Andor</i></p>
        </div>
        <div class="flex flex-wrap items-center justify-center ">
            <form class="review" action="?/add_review" method="POST" use:enhance >
                <input type="hidden" name="review_score" value={review_score} />
                <input type="hidden" name="review_bullets" value={review_bullets} />
                <input type="hidden" name="media_id" value={media_id} />
                <input type="hidden" name="review_sub_name" value={review_sub_name} />
                <input type="hidden" name="review_platform" value={review_platform} />
                <input type="hidden" name="type" value={"review"} />
                <button class="ml-2 mr-2 mt-2 mb-2 bg-surface-100 text-slate-900 rounded-xl">
                    <span class="text-md p-2">Review</span>
                </button>
            </form>
        </div>
        {#if form?.success === true}
            <p class="text-center text-success-500">Review has been added!</p>
        {:else if form?.success === false}
            <p class="text-center text-error-500">Review failed! because {form.message}</p>

        {/if}
    {/if}
{:else if value === 2}
    <p class=" p-2text-md text-center text-warning-500"><i>YOU BETTER CHECK THAT THIS ISNT ALREADY POSTED. NO REMASTERS OR RERELEASES. REMAKES ARE OK!</i></p>
    <div class="relative card mt-2 p-2 shadow-lg rounded-lg flex items-center justify-center mx-auto mr-2 ml-2">
        <div class="flex flex-col w-full">
            <div class="grid grid-cols-1 w-full p-2">
                <p class="text-center">Search media type</p>
                <div class="relative w-full">
                    <input
                        class="input autocomplete mt-2 z-1 w-full"
                        type="search"
                        name="autocomplete-search"
                        bind:value={search_val}
                        placeholder="Search..."
                        use:popup={popup_settings}
                    />
                    <div data-popup="popupAutocomplete" class="absolute top-0 left-0 right-0 z-50 rounded-lg p-4 shadow-lg bg-surface-700 w-full">
                        <Autocomplete
                            bind:input={search_val}
                            options={filtered_options}
                            on:selection={on_popup_select}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>


    {#if media_type === 'game' || media_type === 'tv' || media_type === 'movie'}
        <p class="text-3xl p-2">Search other sites</p>
        <div class="flex mr-2 ml-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={media_search_word}
                on:input={(e) => media_search_word = e.target.value}
                placeholder="Search value..."
            ></textarea>
        </div>
    {/if}
    {#if media_type === 'game'}
        <div class="flex mr-2 ml-2">
            <div class="flex flex-wrap items-center justify-center w-full">
                <form class="find_media" action="?/igdb_search" method="POST" use:enhance on:submit|preventDefault>
                    <input type="hidden" name="media_search_word" value={media_search_word} />
                    <button class="ml-2 mr-2 mt-2 mb-2 bg-surface-100 text-slate-900 rounded-xl w-full">
                        <span class="text-md p-2">Search</span>
                    </button>
                </form>
            </div>
        </div>
        {#if form?.lookup}
            <TreeView class="mt-2 p-2">
                {#each form.lookup as game}
                    <TreeViewItem class="bg-surface-800 rounded-sm">
                        <div class="flex flex-col items-center justify-center p-2">
                            <p class="text-xl">{game.name}</p>
                        </div>
                        
                        <svelte:fragment slot="children">
                            <div class="flex flex-wrap justify-center bg-surface-700">
                                <div class="rounded-sm p-4 flex justify-center">
                                    <div class="relative card p-2 max-w-full mx-2 my-2 shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-64 h-auto lg:h-80 mb-2 mt-2">
                                        <div class="relative flex-shrink-0 w-full flex justify-center items-center z-20">
                                            <img
                                                class="rounded-md w-40 h-64 object-cover"
                                                src="{game.cover_url}"
                                                alt="{game.name}"
                                            />
                                        </div>
                                        <p class="text-md">Cover</p>
                                    </div>
                                </div>
                                <div class="rounded-sm p-4 flex justify-center">
                                    <div class="relative card p-2 max-w-full mx-2 my-2 shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-80 h-auto lg:h-80 mb-2 mt-2">
                                        <div class="relative flex-shrink-0 w-full flex justify-center items-center z-20">
                                            <img
                                                class="rounded-md w-80 h-64 object-cover"
                                                src="{game.banner_url}"
                                                alt="{game.name}"
                                            />
                                        </div>
                                        <p class="text-md">Banner</p>
                                    </div>
                                </div>
                                <div class="rounded-sm p-4 flex justify-center">
                                    <div class="relative card p-2 max-w-full mx-2 my-2 shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-80 h-auto lg:h-80 mb-2 mt-2">
                                        <div class="flex flex-wrap justify-center">
                                            {#each game.tags as tag}
                                                <span class="badge variant-filled mt-2 mb-2 mr-1">{tag}</span>
                                            {/each}
                                        </div>
                                        <p class="text-md">Tags</p>
                                    </div>
                                </div>
                                <div class="rounded-sm p-4 flex justify-center">
                                    <div class="relative card p-2 max-w-full mx-2 my-2 shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-80 h-auto lg:h-80 mb-2 mt-2">
                                        <div class="flex flex-wrap justify-center">
                                            {#each game.distributors as distributor}
                                                <span class="badge variant-filled mt-2 mb-2 mr-1">{distributor}</span>
                                            {/each}
                                        </div>
                                        <p class="text-md">Distributors</p>
                                        <div class="flex flex-wrap justify-center">
                                            {#each game.studios as studio}
                                                <span class="badge variant-filled mt-2 mb-2 mr-1">{studio}</span>
                                            {/each}
                                        </div>
                                        <p class="text-md">Studios</p>
                                        <div class="items-center justify-center p-2">
                                            <textarea
                                                class="input mt-2 w-full rounded-sm p-1"
                                                rows="2"
                                                bind:value={media_directors}
                                                on:input={(e) => media_directors = e.target.value}
                                                placeholder="directors..."
                                            ></textarea>
                                            <p class="text-sm"><i>Directors arnt included in igdb so enter them here (seperate by ",")</i></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <form action="?/add_media" method="POST" use:enhance on:submit|preventDefault class="flex justify-center items-center">
                                <input type="hidden" name="media_name" value={game.name} />
                                <input type="hidden" name="media_cover_path" value={game.cover_url} />
                                <input type="hidden" name="media_banner_path" value={game.banner_url} />
                                <input type="hidden" name="media_tags" value={game.tags} />
                                <input type="hidden" name="media_distributors" value={game.distributors} />
                                <input type="hidden" name="media_studios" value={game.studios} />
                                <input type="hidden" name="media_directors" value={media_directors} />
                                <input type="hidden" name="media_release_date_range_start" value={game.release_date} />
                                <input type="hidden" name="media_type" value={'game'} />
                                <button class="mt-2 mb-2 mr-2 ml-2 text-center badge variant-filled">Add Game</button>
                            </form>
                        </svelte:fragment>
                    </TreeViewItem>
                {/each}
            </TreeView>     
        {/if}
    {:else if media_type === 'movie' || media_type === 'tv'}
        <div class="flex flex-wrap items-center justify-center w-full">
            <form class="find_media" action="?/tmdb_search" method="POST" use:enhance on:submit|preventDefault>
                <input type="hidden" name="media_search_word" value={media_search_word} />
                <input type="hidden" name="media_type" value={media_type} />
                <button class="ml-2 mr-2 mt-2 mb-2 bg-surface-100 text-slate-900 rounded-xl w-full">
                    <span class="text-md p-2">Search</span>
                </button>
            </form>
        </div>
        {#if form?.lookup}
            <TreeView class="mt-2 p-2">
                {#each form.lookup as media}
                    <TreeViewItem class="bg-surface-800 rounded-sm">
                        <div class="flex flex-col items-center justify-center p-2">
                            <p class="text-xl">{media.name}</p>
                        </div>
                        <svelte:fragment slot="children">
                            <div class="flex flex-wrap justify-center bg-surface-700">
                                <div class="rounded-sm p-4 flex justify-center">
                                    <div class="relative card p-2 max-w-full mx-2 my-2 shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-64 h-auto lg:h-80 mb-2 mt-2">
                                        <div class="relative flex-shrink-0 w-full flex justify-center items-center z-20">
                                            <img
                                                class="rounded-md w-40 h-64 object-cover"
                                                src="{media.cover_url}"
                                                alt="{media.name}"
                                            />
                                        </div>
                                        <p class="text-md">Cover</p>
                                    </div>
                                </div>
                                <div class="rounded-sm p-4 flex justify-center">
                                    <div class="relative card p-2 max-w-full mx-2 my-2 shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-80 h-auto lg:h-80 mb-2 mt-2">
                                        <div class="relative flex-shrink-0 w-full flex justify-center items-center z-20">
                                            <img
                                                class="rounded-md w-80 h-64 object-cover"
                                                src="{media.banner_url}"
                                                alt="{media.name}"
                                            />
                                        </div>
                                        <p class="text-md">Banner</p>
                                    </div>
                                </div>
                                <div class="rounded-sm p-4 flex justify-center">
                                    <div class="relative card p-2 max-w-full mx-2 my-2 shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-80 h-auto lg:h-80 mb-2 mt-2">
                                        <div class="flex flex-wrap justify-center">
                                            {#each media.tags as tag}
                                                <span class="badge variant-filled mt-2 mb-2 mr-1">{tag}</span>
                                            {/each}
                                        </div>
                                        <p class="text-md">Tags</p>
                                    </div>
                                </div>
                                <div class="rounded-sm p-4 flex justify-center">
                                    <div class="relative card p-2 max-w-full mx-2 my-2 shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-80 h-auto lg:h-80 mb-2 mt-2">
                                        <div class="flex flex-wrap justify-center">
                                            {#each media.studios as studio}
                                                <span class="badge variant-filled mt-2 mb-2 mr-1">{studio}</span>
                                            {/each}
                                            {#each media.distributors as distributor}
                                                <span class="badge variant-filled mt-2 mb-2 mr-1">{distributor}</span>
                                            {/each}
                                        </div>
                                        <p class="text-md">Studios</p>
                                        <div class="flex flex-wrap justify-center">
                                            {#each media.directors as director}
                                                <span class="badge variant-filled mt-2 mb-2 mr-1">{director}</span>
                                            {/each}
                                        </div>
                                        <p class="text-md">directors</p>
                                    </div>
                                </div>
                            </div>
                            <form action="?/add_media" method="POST" use:enhance on:submit|preventDefault class="flex justify-center items-center">
                                <input type="hidden" name="media_name" value={media.name} />
                                <input type="hidden" name="media_cover_path" value={media.cover_url} />
                                <input type="hidden" name="media_banner_path" value={media.banner_url} />
                                <input type="hidden" name="media_tags" value={media.tags} />
                                <input type="hidden" name="media_distributors" value={media.distributors} />
                                <input type="hidden" name="media_studios" value={media.studios} />
                                <input type="hidden" name="media_directors" value={media.directors} />
                                <input type="hidden" name="media_release_date_range_start" value={media.release_date_start} />
                                <input type="hidden" name="media_release_date_range_end" value={media.release_date_end} />
                                <input type="hidden" name="media_type" value={media_type} />
                                <button class="mt-2 mb-2 mr-2 ml-2 text-center badge variant-filled">Add {media_type}</button>
                            </form>
                        </svelte:fragment>
                    </TreeViewItem>
                {/each}
            </TreeView>
        {/if}
    {:else if media_type === 'web' || media_type === 'book' || media_type === 'music' || media_type === 'other'}
        <p class="text-3xl p-2">Manual Entry</p>
        
        <p class="text-2xl p-2">Name</p>
        <div class="flex mr-2 ml-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={manual_media.name}
                on:input={(e) =>  manual_media.name = e.target.value}
                placeholder="media name..."
            ></textarea>
        </div>
        <p class="text-sm p-2"><i>The name of the media you want to add.</i></p>

        <p class="text-2xl p-2">Cover</p>
        <div class="flex mr-2 ml-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={manual_media.cover_url}
                on:input={(e) => manual_media.cover_url = e.target.value}
                placeholder="media cover url..."
            ></textarea>
        </div>
        <p class="text-sm p-2"><i>The url of an image for this medias cover.</i></p>

        <p class="text-2xl p-2">Banner</p>
        <div class="flex mr-2 ml-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={manual_media.banner_url}
                on:input={(e) => manual_media.banner_url = e.target.value}
                placeholder="media banner url..."
            ></textarea>
        </div>
        <p class="text-sm p-2"><i>The url of an image for this medias banner.</i></p>

        <p class="text-2xl p-2">Tags</p>
        <div class="flex mr-2 ml-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={manual_media.tags}
                on:input={(e) => manual_media.tags = e.target.value}
                placeholder="media tags..."
            ></textarea>
        </div>
        <p class="text-sm p-2"><i>The tags linked to this property seperated by ",".</i></p>

        <p class="text-2xl p-2">Studios</p>
        <div class="flex mr-2 ml-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={manual_media.studios}
                on:input={(e) => manual_media.studios = e.target.value}
                placeholder="media studios..."
            ></textarea>
        </div>
        <p class="text-sm p-2"><i>The studios linked to this property seperated by ",".</i></p>

        <p class="text-2xl p-2">Distributors</p>
        <div class="flex mr-2 ml-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={manual_media.distributors}
                on:input={(e) => manual_media.distributors = e.target.value}
                placeholder="media directors..."
            ></textarea>
        </div>
        <p class="text-sm p-2"><i>The distributors linked to this property seperated by ",".</i></p>

        <p class="text-2xl p-2">Directors</p>
        <div class="flex mr-2 ml-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={manual_media.directors}
                on:input={(e) => manual_media.directors = e.target.value}
                placeholder="media directors..."
            ></textarea>
        </div>
        <p class="text-sm p-2"><i>The directors linked to this property seperated by ",".</i></p>

        <p class="text-2xl p-2">First air date</p>
        <div class="flex mr-2 ml-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={manual_media.media_date_range_start}
                on:input={(e) => manual_media.media_date_range_start = e.target.value}
                placeholder="media directors..."
            ></textarea>
        </div>
        <p class="text-sm p-2"><i>The first air date of the media in yyyy-mm-dd format</i></p>

        <p class="text-2xl p-2">Last air date</p>
        <div class="flex mr-2 ml-2">
            <textarea
                class="input mt-2 w-full rounded-sm p-1"
                rows="1"
                bind:value={manual_media.media_date_range_end}
                on:input={(e) => manual_media.media_date_range_end = e.target.value}
                placeholder="media directors..."
            ></textarea>
        </div>
        <p class="text-sm p-2"><i>The last air date of the media in yyyy-mm-dd format</i></p>
        <div class="flex flex-wrap items-center justify-center w-full">
            <form action="?/add_media" method="POST" use:enhance on:submit|preventDefault>
                <input type="hidden" name="media_name" value={manual_media.name} />
                <input type="hidden" name="media_cover_path" value={manual_media.cover_url} />
                <input type="hidden" name="media_banner_path" value={manual_media.banner_url} />
                <input type="hidden" name="media_tags" value={manual_media.tags} />
                <input type="hidden" name="media_distributors" value={manual_media.distributors} />
                <input type="hidden" name="media_studios" value={manual_media.studios} />
                <input type="hidden" name="media_directors" value={manual_media.directors} />
                <input type="hidden" name="media_release_date_range_start" value={manual_media.media_date_range_start} />
                <input type="hidden" name="media_release_date_range_end" value={manual_media.media_date_range_end} />
                <input type="hidden" name="media_type" value={media_type} />
                <button class="ml-2 mr-2 mt-2 mb-2 bg-surface-100 text-slate-900 rounded-xl w-full">
                    <span class="text-md p-2">Add {media_type}</span>
                </button>
            </form>
        </div>
    {/if}
{:else if value === 3}
    <div class="relative card mt-2 p-2 shadow-lg rounded-lg flex items-center justify-center mx-auto mr-2 ml-2">
        <div class="flex flex-col w-full">
            <div class="grid grid-cols-1 w-full p-2">
                <p class="text-center">Search for media</p>
                <div class="relative w-full">
                    <input
                        class="input autocomplete mt-2 z-1 w-full"
                        type="search"
                        name="autocomplete-search"
                        bind:value={search_val}
                        placeholder="Search..."
                        use:popup={popup_settings}
                    />
                    <div data-popup="popupAutocomplete" class="absolute top-0 left-0 right-0 z-50 rounded-lg p-4 shadow-lg bg-surface-700 w-full">
                        <Autocomplete
                            bind:input={search_val}
                            options={filtered_options}
                            on:selection={on_popup_select}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
    {#if edit_values !== null}
        <p class="text-2xl p-2">Nominate {edit_values.media_name} For:</p>
        <div class="flex flex-wrap items-center justify-center mt-2 mb-2 mr-2 ml-2">
            {#if edit_values.media_type === 'game'}
                <button type="button" on:click={() => award_name = 'Game of the Year'} class="p-1">
                    <span class="badge variant-filled text-xl p-2">Game of the Year</span>
                </button>
            {/if}
            {#if edit_values.media_type === 'movie'}
                <button type="button" on:click={() => award_name = 'Movie of the Year'} class="p-1">
                    <span class="badge variant-filled text-xl p-2">Movie of the Year</span>
                </button>
            {/if}
            {#if edit_values.media_type === 'tv'}
                <button type="button" on:click={() => award_name = 'Show of the Year'} class="p-1">
                    <span class="badge variant-filled text-xl p-2">Show of the Year</span>
                </button>
            {/if}

            <button type="button" on:click={() => award_name = 'Story of the Year'} class="p-1">
                <span class="badge variant-filled text-xl p-2">Story of the Year</span>
            </button>
            <button type="button" on:click={() => award_name = 'Cinematography of the Year'} class="p-1">
                <span class="badge variant-filled text-xl p-2">Cinematography of the Year</span>
            </button>
            <button type="button" on:click={() => award_name = 'Best Animation of the Year'} class="p-1">
                <span class="badge variant-filled text-xl p-2">Best Animation of the Year</span>
            </button>
            <button type="button" on:click={() => award_name = 'Best of the Year'} class="p-1">
                <span class="badge variant-filled text-xl p-2">Best of the Year</span>
            </button>
        </div>
        <p class="text-sm p-2"><i>Select a single award to nominate then click the nominate button. The current nomination is for <b>{award_name}</b></i></p>
        
        <form action="?/nominate_media" method="POST" use:enhance on:submit|preventDefault class="flex justify-center items-center">
            <button class="mt-2 mb-2 mr-2 ml-2 text-xl text-center badge variant-filled">Nominate</button>
        </form>
        
        {#if form?.success === true}
            <p class="text-center text-success-500">Media has been nominated!</p>
        {:else if form?.success === false}
            <p class="text-center text-error-500">Media failed to nominate! because {form.message}</p>

        {/if}
    
    {/if}
{:else}
<div class="flex flex-col items-center justify-center p-2 text-center">
    <h1 class="text-2xl">Dashboard</h1>
    <p class="text-xl">Welcome to the dashboard, {$page.data.user.name}!</p>
    <p class= "text-md">From here you can Review, Modify, and Add content to the site Along with changing your user profile.</p>
</div>
{/if}

<div class="block mt-2 mb-1 mr-1 ml-1 rounded variant-filled md:border-0 md:p-0">
    <form class="logout" action="/logout" method="POST" use:enhance>
        <button type="submit">Log out</button>
    </form>
</div>
