<script>

    export let data = [];
    import { Autocomplete } from '@skeletonlabs/skeleton';
    import { popup } from '@skeletonlabs/skeleton';
    import { storePopup } from '@skeletonlabs/skeleton';
    import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
    import { Paginator } from '@skeletonlabs/skeleton';
    import { page } from '$app/stores';
    import corr from '$lib/client/corrections.js';
    
    const media_options = data.media_data.media;
    const og_length = media_options.length;
    const url_params = new URLSearchParams($page.url.search);
    const specific_page = url_params.get('page');

    function scrollToTop() {
        goto('#top', { replaceState: true });
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
