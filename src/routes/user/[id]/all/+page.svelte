<script>
    export let data = [];
    
    import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
    import { page } from '$app/stores';
    import { Paginator } from '@skeletonlabs/skeleton';
    import ReviewRadial from '$lib/client/review_radial.svelte';
    import { goto } from '$app/navigation';
    import CompactBox from '$lib/client/compact_box.svelte';

    const options = data.lookup;
    const url_params = new URLSearchParams($page.url.search);
    const specific_page = url_params.get('page');

    function scrollToTop() {
        goto('#top', { replaceState: true });
    }

    let pagination_settings = {
	    page: 0,
	    limit: 10,
	    size: options.length,
	    amounts: [10,20,50,options.length],
    };

    if (!isNaN(specific_page)) {
        pagination_settings.page = specific_page;
    }

    $: paginated_source = options.slice(
	    pagination_settings.page * pagination_settings.limit,
	    pagination_settings.page * pagination_settings.limit + pagination_settings.limit
    );
    
</script>

<title>Review Doc</title>

<div id="top"></div>

<Paginator class="mt-2 mr-2 ml-2"
	bind:settings={pagination_settings}
	showFirstLastButtons="{false}"
	showPreviousNextButtons="{true}"
/>

<ul class="mt-2">
    <div class="flex flex-col items-center justify-center">
        {#each paginated_source as row}
            <div class="w-full md:w-1/2 p-2">
                <a href="../../media/{row.value.media_id}" class="w-full">
                    <CompactBox
                        media_name="{row.label}"
                        review_bullets="{row.value.review_bullets}"
                        review_sub_name="{row.value.review_sub_name}"
                        review_score="{row.value.review_score}"
                        media_id="{row.value.media_id}"
                        review_date="{row.value.review_date}"

                    />
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
