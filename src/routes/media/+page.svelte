<script>

    export let data = [];
    export let form;
    import { Autocomplete } from '@skeletonlabs/skeleton';
    import { popup } from '@skeletonlabs/skeleton';
    import { storePopup } from '@skeletonlabs/skeleton';
    import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
    import { Paginator } from '@skeletonlabs/skeleton';
    import { page } from '$app/stores';
    import { Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
    import { initializeStores } from '@skeletonlabs/skeleton';
    import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
    import { enhance } from '$app/forms';
    import { TreeView, TreeViewItem} from '@skeletonlabs/skeleton';

    initializeStores();
    
    
    const media_options = data.media_data.media;
    const og_length = media_options.length;
    const url_params = new URLSearchParams($page.url.search);
    const specific_page = url_params.get('page');

    function scrollToTop() {
        goto('#top', { replaceState: true });
    }


    /**
     * drawer
    */

    const drawer_store = getDrawerStore();

    const drawer_settings = {
	id: 'add-media',
        width: ' w-5/6 md:w-1/2',
        rounded: 'rounded-tl-xl rounded-bl-xl',
    };

    let add_type = 0;
    let media_search_word = '';
    let media_directors = '';
    let other_string = 'other';
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

    /**
     * search bar 
    */
    storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

    let popup_settings = {
        event: 'focus-click',
        target: 'popupAutocomplete',
        placement: 'bottom',
    };

    let search_val = '';
    function on_popup_select(event) {
        search_val = event.detail.value.id;
        window.location.href = `/media/${search_val}`;
    }

    // Computed property to filter and limit options based on search input
    $: filtered_options = media_options
        .filter(option => option.label.toLowerCase().includes(search_val.toLowerCase()))
        .slice(0, 10);

    /**
     * paging
     */

     let pagination_settings = {
	    page: 0,
	    limit: 10,
	    size: media_options.length,
	    amounts: [10,20,50,og_length],
    };

    if (!isNaN(specific_page)) {
        pagination_settings.page = specific_page;
    }

    $: paginated_source = media_options.slice(
	    pagination_settings.page * pagination_settings.limit,
	    pagination_settings.page * pagination_settings.limit + pagination_settings.limit
    );
    



    // const media_options = [
    //     { label: 'Vanilla', value: 'vanilla', keywords: 'plain, basic', meta: { healthy: false } },
    //     { label: 'Chocolate', value: 'chocolate', keywords: 'dark, white', meta: { healthy: false } },
    //     { label: 'Strawberry', value: 'strawberry', keywords: 'fruit', meta: { healthy: true } },
    //     { label: 'Neapolitan', value: 'neapolitan', keywords: 'mix, strawberry, chocolate, vanilla', meta: { healthy: false } },
    //     { label: 'Pineapple', value: 'pineapple', keywords: 'fruit', meta: { healthy: true } },
    //     { label: 'Peach', value: 'peach', keywords: 'fruit', meta: { healthy: true } }
    // ];

</script>

<title>Review Doc - Media</title>
<div id="top"></div>

{#if $page.data.user}
    <div class="ml-2 mr-2">
        <button class="p-2 mt-2 mb-2 w-full bg-surface-100 hover:bg-surface-200 text-slate-900 rounded-xl" on:click={() => drawer_store.open(drawer_settings)}>
            <span class="text-md p-2">Add Media</span>
        </button>
    </div>

    <Drawer position="right">
        <div class="p-2">
            <!-- <p class=" p-2 text-md text-center text-warning-500"><i>YOU BETTER CHECK THAT THIS ISNT ALREADY POSTED. NO REMASTERS OR RERELEASES. REMAKES ARE OK!</i></p> -->
            
            
            <RadioGroup display="flex" class="items-center justify-center">
                <RadioItem on bind:group={add_type} name="justify" value={0}>
                    Auto
                </RadioItem>
                <RadioItem on bind:group={add_type} name="justify" value={1}>
                    Manual
                </RadioItem>
            </RadioGroup>

            <div class="p-2">
                {#if add_type == 0}

                    <p class="text-2xl">Search other sites</p>
                    <p class="text-sm"><i>Looks for media on idgb and tmdb results may vary. Loads can take a minute once 'Find' is pressed.</i></p>
                    
                    <textarea
                        class="input mt-2 w-full rounded-sm"
                        rows="1"
                        bind:value={media_search_word}
                        on:input={(e) => media_search_word = e.target.value}
                        placeholder="Search value..."
                    ></textarea>

                    <form action="?/search_sites" method="POST" use:enhance on:submit|preventDefault>
                        <input type="hidden" name="media_search_word" value={media_search_word} />
                        <button class="p-2 mt-2 mb-2 w-full bg-surface-100 hover:bg-surface-200 text-slate-900 rounded-xl">
                            <span class="text-md p-2">Find</span>
                        </button>
                    </form>
                    {#if form?.lookup}
                        <TreeView indent="" class="mt-2">
                            {#each form.lookup as item}
                                <TreeViewItem class="bg-surface-800 rounded-sm">
                                    <div class="flex flex-col items-center justify-center p-2">
                                        <p class="text-xl">{item.name} - {item.media_type}</p>
                                    </div>
                                    
                                    <svelte:fragment slot="children">
                                        <div class="flex flex-wrap justify-center bg-surface-700">
                                            <div class="flex flex-wrap w-full">
                                                <div class="rounded-sm flex justify-center w-1/2">
                                                    <div class="relative card p-2 max-w-full mx-2 shadow-lg rounded-lg flex flex-col items-center flex-grow-0 h-auto mb-2 mt-2">
                                                        <div class="relative flex-shrink-0 w-full flex justify-center items-center z-20">
                                                            <img
                                                                class="rounded-md md:w-40 md:h-64 object-cover"
                                                                src="{item.cover_url}"
                                                                alt="{item.name}"
                                                            />
                                                        </div>
                                                        <p class="text-md">Cover</p>
                                                    </div>
                                                </div>
                                                <div class="rounded-sm flex justify-center w-1/2">
                                                    <div class="relative card p-2 max-w-full mx-2 shadow-lg rounded-lg flex flex-col items-center flex-grow-0 mb-2 mt-2">
                                                        <div class="relative flex-shrink-0 w-full flex justify-center items-center z-20">
                                                            <img
                                                                class="rounded-md md:w-80 md:h-64 object-cover"
                                                                src="{item.banner_url}"
                                                                alt="{item.name}"
                                                            />
                                                        </div>
                                                        <p class="text-md">Banner</p>
                                                    </div>
                                                </div>

                                                <div class="rounded-sm flex justify-center w-1/2">
                                                    <div class="relative card p-2 max-w-full mx-2 shadow-lg rounded-lg flex flex-col items-center flex-grow-0 mb-2 mt-2">
                                                        <div class="flex flex-wrap justify-center">
                                                            {#each item.tags as tag}
                                                                <div class="mx-1 my-2 text-sm md:text-md">
                                                                    <span class="badge variant-filled">{tag}</span>
                                                                </div>
                                                                
                                                            {/each}
                                                        </div>
                                                        <p class="text-md">Tags</p>
                                                    </div>
                                                </div>

                                                <div class="rounded-sm flex justify-center w-1/2">
                                                    <div class="relative card p-2 max-w-full mx-2 my-2 shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-80 h-auto lg:h-80 mb-2 mt-2">
                                                        <div class="flex flex-wrap justify-center">
                                                            {#each item.distributors as distributor}
                                                                <span class="badge variant-filled mt-2 mb-2 mr-1">{distributor}</span>
                                                            {/each}
                                                        </div>
                                                        <p class="text-md">Distributors</p>
                                                        <div class="flex flex-wrap justify-center">
                                                            {#each item.studios as studio}
                                                                <span class="badge variant-filled mt-2 mb-2 mr-1">{studio}</span>
                                                            {/each}
                                                        </div>
                                                        <p class="text-md">Studios</p>
                                                        {#if item.directors}
                                                            <div class="flex flex-wrap justify-center">
                                                                {#each item.directors as director}
                                                                    <span class="badge variant-filled mt-2 mb-2 mr-1">{director}</span>
                                                                {/each}
                                                            </div>
                                                            <p class="text-md">Directors</p>
                                                        
                                                        {:else}
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
                                                        {/if}
    
                                                    </div>
                                                </div>
                                                
                                            </div>
                                            <form action="?/add_media" method="POST" use:enhance on:submit|preventDefault class="flex justify-center items-center">
                                                <input type="hidden" name="media_name" value={item.name} />
                                                <input type="hidden" name="media_cover_path" value={item.cover_url} />
                                                <input type="hidden" name="media_banner_path" value={item.banner_url} />
                                                <input type="hidden" name="media_tags" value={item.tags} />
                                                <input type="hidden" name="media_distributors" value={item.distributors} />
                                                <input type="hidden" name="media_studios" value={item.studios} />
                                                {#if item.media_type === 'game'}
                                                    <input type="hidden" name="media_directors" value={media_directors} />
                                                {:else}
                                                    <input type="hidden" name="media_directors" value={item.directors} />
                                                {/if}
                                                <input type="hidden" name="media_release_date_range_start" value={item.release_date_start} />
                                                <input type="hidden" name="media_release_date_range_end" value={item.release_date_end} />
                                                <input type="hidden" name="media_type" value={item.media_type} />
                                                <button class="mt-2 mb-2 mr-2 ml-2 text-center badge variant-filled">Add</button>
                                            </form>
                                        </div>
                                    </svelte:fragment>
                                </TreeViewItem>
                            {/each}
        
                        </TreeView>
                    {/if}

                {:else if add_type == 1}
                    
                    <p class="text-2xl my-2">Select a media type and fill in the info below.</p>

                    <RadioGroup display="flex" class="items-center justify-center">
                        <RadioItem on bind:group={other_string} name="justify" value={'other'}>
                            Other
                        </RadioItem>
                        <RadioItem on bind:group={other_string} name="justify" value={'web'}>
                            Web
                        </RadioItem>
                        <RadioItem on bind:group={other_string} name="justify" value={'book'}>
                            Book
                        </RadioItem>
                        <RadioItem on bind:group={other_string} name="justify" value={'music'}>
                            Music
                        </RadioItem>
                    </RadioGroup>

                    <p class="text-2xl">Name</p>
                    <div class="flex">
                        <textarea
                            class="input my-2 mt-2 w-full rounded-sm"
                            rows="1"
                            bind:value={manual_media.name}
                            on:input={(e) =>  manual_media.name = e.target.value}
                            placeholder="media name..."
                        ></textarea>
                    </div>
                    <p class="text-sm"><i>The name of the media you want to add.</i></p>

                    <p class="text-2xl">Cover</p>
                    <div class="flex">
                        <textarea
                            class="input my-2 mt-2 w-full rounded-sm"
                            rows="1"
                            bind:value={manual_media.cover_url}
                            on:input={(e) => manual_media.cover_url = e.target.value}
                            placeholder="media cover url..."
                        ></textarea>
                    </div>
                    <p class="text-sm"><i>The url of an image for this medias cover.</i></p>

                    <p class="text-2xl">Banner</p>
                    <div class="flex">
                        <textarea
                            class="input my-2 mt-2 w-full rounded-sm"
                            rows="1"
                            bind:value={manual_media.banner_url}
                            on:input={(e) => manual_media.banner_url = e.target.value}
                            placeholder="media banner url..."
                        ></textarea>
                    </div>
                    <p class="text-sm"><i>The url of an image for this medias banner.</i></p>

                    <p class="text-2xl">Tags</p>
                    <div class="flex">
                        <textarea
                            class="input my-2 mt-2 w-full rounded-sm"
                            rows="1"
                            bind:value={manual_media.tags}
                            on:input={(e) => manual_media.tags = e.target.value}
                            placeholder="media tags..."
                        ></textarea>
                    </div>
                    <p class="text-sm"><i>The tags linked to this property seperated by ",".</i></p>

                    <p class="text-2xl">Distributors</p>
                    <div class="flex">
                        <textarea
                            class="input my-2 mt-2 w-full rounded-sm"
                            rows="1"
                            bind:value={manual_media.distributors}
                            on:input={(e) => manual_media.distributors = e.target.value}
                            placeholder="media distributors..."
                        ></textarea>
                    </div>
                    <p class="text-sm"><i>The distributors linked to this property seperated by ",".</i></p>

                    <p class="text-2xl">Directors</p>
                    <div class="flex">
                        <textarea
                            class="input my-2 mt-2 w-full rounded-sm"
                            rows="1"
                            bind:value={manual_media.directors}
                            on:input={(e) => manual_media.directors = e.target.value}
                            placeholder="media directors..."
                        ></textarea>
                    </div>
                    <p class="text-sm"><i>The directors linked to this property seperated by ",".</i></p>

                    <p class="text-2xl">First air date</p>
                    <div class="flex">
                        <textarea
                            class="input my-2 mt-2 w-full rounded-sm"
                            rows="1"
                            bind:value={manual_media.media_date_range_start}
                            on:input={(e) => manual_media.media_date_range_start = e.target.value}
                            placeholder="when this thing came out..."
                        ></textarea>
                    </div>
                    <p class="text-sm p-2"><i>The first air date of the media in yyyy-mm-dd format</i></p>

                    <p class="text-2xl">Last air date</p>
                    <div class="flex">
                        <textarea
                            class="input my-2 mt-2 w-full rounded-sm"
                            rows="1"
                            bind:value={manual_media.media_date_range_end}
                            on:input={(e) => manual_media.media_date_range_end = e.target.value}
                            placeholder="when the last occurance of this was..."
                        ></textarea>
                    </div>

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
                        <input type="hidden" name="media_type" value={other_string} />
                        <button class="ml-2 mr-2 mt-2 mb-2 bg-surface-100 text-slate-900 rounded-xl w-full">
                            <span class="text-md p-2">Add</span>
                        </button>
                    </form>
                {/if}
            </div>

            {#if form?.success === true}
                <p class="text-center text-success-500">Media has been added!</p>
            {:else if form?.success === false}
                <p class="text-center text-error-500">Media was not added! because {form.message}</p>

            {/if}

            <button class="p-2 mt-2 mb-2 w-full bg-surface-100 hover:bg-surface-200 text-slate-900 rounded-xl" on:click={() => drawer_store.close()}>
                <span class="text-md p-2">Close</span>
            </button>
        </div>




    </Drawer>

{/if}


<div class="mr-2 ml-2">
    <input
        class="input autocomplete mt-2 z-1"
        type="search"
        name="autocomplete-search"
        bind:value={search_val}
        placeholder="Search..."
        use:popup={popup_settings}
    />
    <div data-popup="popupAutocomplete" class="fixed top-0 left-0 right-0 z-50 rounded-lg p-4 shadow-lg bg-surface-700">
        <Autocomplete
            bind:input={search_val}
            options={filtered_options}
            on:selection={on_popup_select}
        />
    </div>
</div>


<Paginator class="mt-2 mr-2 ml-2"
	bind:settings={pagination_settings}
	showFirstLastButtons="{false}"
	showPreviousNextButtons="{true}"
/>

<div id="top"></div>

<ul class="mt-2">
    <div class="flex flex-wrap -mx-2 items-center justify-center">
        {#each paginated_source as row}
            <div class="p-1 md:w-1/2 w-full">
                <a href="../media/{row.value.id}">
                    <div class="relative card p-2 shadow-lg rounded-lg flex items-center col-span-1 lg:col-span-2" style="min-width: 300px;">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40 rounded-lg z-5">
                            <div class="-z-10 absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{row.value.id}/banner'); object-fit: cover;"></div>
                        </div>
                        <div class="z-0 flex-shrink-0 flex items-center">
                            <img
                                class="rounded-md w-32 h-auto"
                                src="/api/media/image/{row.value.id}/cover"
                                alt={row.label}
                            />
                            <div class="grid grid-col-1">
                                <div class="ml-4">
                                    <h2 class="text-xl break-words max-w-[12ch] sm:max-w-none">{row.label}</h2>
                                </div>
                                <div class="ml-4">
                                    {#if row.value.release_end == null}
                                        <p class="text-left text-sm mb-2 z-20">Release {row.value.release_start.split('T')[0]}</p>
                                    {:else}
                                        <p class="text-left text-sm mb-2 z-20">Release {row.value.release_start.split('T')[0]} - {row.value.release_end.split('T')[0]}</p>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        {/each}
    </div>
</ul>


<button class="w-full" on:click={scrollToTop}>
    <Paginator class="mt-2 mr-2 ml-2"
        bind:settings={pagination_settings}
        showFirstLastButtons={false}
        showPreviousNextButtons={true}
    />
</button>
