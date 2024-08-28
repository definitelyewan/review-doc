<script>

    export let data = [];
    import { Autocomplete } from '@skeletonlabs/skeleton';
    import { popup } from '@skeletonlabs/skeleton';
    import { storePopup } from '@skeletonlabs/skeleton';
    import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
    import { Paginator } from '@skeletonlabs/skeleton';
    import corr from '$lib/client/corrections.js';
    
    const media_options = data.media_data.media;
    const og_length = media_options.length;
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

<ul class="mt-2">
    <div class="flex flex-wrap -mx-2 items-center justify-center">
        {#each paginated_source as row}
            <a href="media/{row.value.id}">
                <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-64 h-80">
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-10 rounded-lg z-10">
                        <div class="absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{row.value.id}/banner');"></div>
                    </div>

                    {#if row.label.length > 15}
                        <p class="text-center text-xl mb-2 z-20" style="font-size: {corr.calculate_title_font_size(row.label, 15, 20)}">{row.label}</p>
                    {:else}
                        <p class="text-center text-xl mb-2 z-20">{row.label}</p>
                    {/if}

                    <div class="flex-shrink-0 w-full flex justify-center items-center z-20">
                        <img
                            class="rounded-md w-40 h-56 object-cover"
                            src="/api/media/image/{row.value.id}/cover"
                            alt={row.label}
                        />
                    </div>

                    {#if row.value.release_end == null}
                        <p class="text-center text-sm mb-2 z-20">Release {row.value.release_start.split('T')[0]}</p>
                    {:else}
                        <p class="text-center text-sm mb-2 z-20">Release {row.value.release_start.split('T')[0]} - {row.value.release_end.split('T')[0]}</p>
                    {/if}
                </div>
            </a>
        {/each}
    </div>
</ul>

<Paginator class="mt-2 mr-2 ml-2 mb-2"
	bind:settings={pagination_settings}
	showFirstLastButtons="{false}"
	showPreviousNextButtons="{true}"
/>
