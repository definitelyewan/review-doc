<script>
    export let data = [];
    
    import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
    import { Paginator } from '@skeletonlabs/skeleton';
    import ReviewRadial from '$lib/client/review_radial.svelte';
    import corr from '$lib/client/corrections.js';

    const options = data.lookup;

    let pagination_settings = {
	    page: 0,
	    limit: 10,
	    size: options.length,
	    amounts: [10,20,50,options.length],
    };

    $: paginated_source = options.slice(
	    pagination_settings.page * pagination_settings.limit,
	    pagination_settings.page * pagination_settings.limit + pagination_settings.limit
    );
</script>

<style>
    @media (max-width: 768px) {
        .responsive-grid {
            grid-template-columns: 1fr !important;
        }
    }
</style>

<Paginator class="mt-2 mr-2 ml-2"
	bind:settings={pagination_settings}
	showFirstLastButtons="{false}"
	showPreviousNextButtons="{true}"
/>

<ul class="mt-2">
    <div class="flex flex-col items-center justify-center">
        {#each paginated_source as row}
        <a href="../../media/{row.value.media_id}" class="w-full">
            <div class="mt-2 mr-2 ml-2 relative card max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0 min-h-80">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-10 rounded-lg z-1">
                    <div class="absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{row.value.media_id}/banner');"></div>
                </div>
                <div class="grid grid-cols-2 responsive-grid">
                    <div class="grid grid-cols-1">
                        <div class="mt-2 justify-center items-center">
                            <p class="text-center text-2xl mb-2 z-10">{row.label}</p>
                        </div>
                        <div class="grid grid-cols-2">
                            <div class="grid grid-cols-1">
                                <div class="mt-2 flex-shrink-0 w-full flex justify-center items-center z-10">
                                    <img
                                        class="rounded-md w-40 h-56 object-cover"
                                        src="/api/media/image/{row.value.media_id}/cover"
                                        alt={row.label}
                                    />
                                </div>
                            </div>
                            <div>
                                <div class="mt-8 ml-2">
                                    <ReviewRadial score={row.value.review_score} width="w-40"/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="w-full flex justify-center items-center md:ml-8" id="notes">
                        <div class="w-full max-w-md mt-2">
                            <div class="card relative bg-primary-500 mt-2 mr-2 ml-2 mb-2 z-5">
                                <p class="text-center text-md mb-2 z-5">Notes</p>
                                
                                <ul class="ml-4 mb-4 list-disc">
                                    {#each row.value.review_bullets as bullet}
                                        <li class="text-sm z-5">{bullet}</li>
                                    {/each}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </a>
        {/each}
    </div>
</ul>



<Paginator class="mt-2 mr-2 ml-2"
	bind:settings={pagination_settings}
	showFirstLastButtons="{false}"
	showPreviousNextButtons="{true}"
/>
