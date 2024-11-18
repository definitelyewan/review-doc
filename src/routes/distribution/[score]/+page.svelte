<script>
    export let data;
    import { Avatar } from '@skeletonlabs/skeleton';
    import { page } from '$app/stores';

    let dist_score = data.score;
    let type = $page.url.searchParams.get('type');
    let user_id = $page.url.searchParams.get('user');
    let medias = data.media_data;

    function update_url(score, new_type, new_user_id) {
        const url = new URL(window.location.origin + "/distribution/" + score);
        if (new_type != null) {
            url.searchParams.set('type', new_type);
        }
        
        if (new_user_id != null) {
            url.searchParams.set('user', new_user_id);
        }

        window.location.href = url.toString();
    }

    $: filter = medias.filter(row => {
        if ((type == null || row.media_type === type) && (user_id == null || row.user_id == user_id)) {
            return row;
        }
    });


</script>

<title>Review Doc - {dist_score}'s</title>

<div class="mt-2 mb-2">
    <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
        <p class="text-2xl"><b>Review Distribution</b></p>

        <div class="flex flex-wrap items-center justify-center mt-2 mb-2 mr-2 ml-2">
            {#each {length : 11} as _, i}
                <button type="button" class="p-1" on:click={() => update_url(i, type, user_id)}>
                    <Avatar
                        border="border-4 {dist_score == i ? 'border-primary-500' : 'border-surface-300-600-token hover:!border-primary-500'}"
                        initials={i === 0 ? "💀" : i.toString()}
                        cursor="cursor-pointer"
                        width="w-12"/>
                </button>
            {/each}
        </div>
        <div class="relative flex flex-col items-center justify-center w-full h-full">
            <div class="relative card mt-2 p-2 w-full h-full shadow-lg rounded-lg flex items-center justify-center mx-auto">
                <div class="flex flex-wrap justify-center">
                    <button type="button" class="p-2 m-2 badge variant-filled rounded-lg shadow-lg" on:click={() => update_url(dist_score, null, user_id)}>All</button>
                    <button type="button" class="p-2 m-2 badge variant-filled rounded-lg shadow-lg" on:click={() => update_url(dist_score, 'tv', user_id)}>TV</button>
                    <button type="button" class="p-2 m-2 badge variant-filled rounded-lg shadow-lg" on:click={() => update_url(dist_score, 'movie', user_id)}>Movies</button>
                    <button type="button" class="p-2 m-2 badge variant-filled rounded-lg shadow-lg" on:click={() => update_url(dist_score, 'game', user_id)}>Games</button>
                    <button type="button" class="p-2 m-2 badge variant-filled rounded-lg shadow-lg" on:click={() => update_url(dist_score, 'book', user_id)}>Books</button>
                    <button type="button" class="p-2 m-2 badge variant-filled rounded-lg shadow-lg" on:click={() => update_url(dist_score, 'music', user_id)}>Music</button>
                    <button type="button" class="p-2 m-2 badge variant-filled rounded-lg shadow-lg" on:click={() => update_url(dist_score, 'other', user_id)}>Other</button>
                </div>
            </div>
        </div>
    </div>
</div>

<ul class="mt-2 ml-2 mr-2 mb-2">
    <div class="flex flex-wrap -mx-2 items-center justify-center">
        {#each filter as row}
            <div class="p-1 md:w-1/2 w-full">
                <a href="../media/{row.media_id}">
                    <div class="relative card p-2 shadow-lg rounded-lg flex items-center col-span-1 lg:col-span-2" style="min-width: 300px;">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40 rounded-lg z-5">
                            <div class="-z-10 absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{row.media_id}/banner'); object-fit: cover;"></div>
                        </div>
                        <div class="z-0 flex-shrink-0 flex items-center">
                            <img
                                class="rounded-md w-32 h-auto"
                                src="/api/media/image/{row.media_id}/cover"
                                alt={row.media_name}
                            />
                            <div class="grid grid-col-1">
                                <div class="ml-4">
                                    <h2 class="text-xl break-words max-w-[12ch] sm:max-w-none">{row.media_name}</h2>
                                </div>
                                <div class="ml-4">
                                    {#if row.media_release_date_range_end == null}
                                        <p class="text-left text-sm z-20">Release {row.media_release_date_range_start.toISOString().split('T')[0]}</p>
                                    {:else}
                                        <p class="text-left text-sm z-20">Release {row.media_release_date_range_start.toISOString().split('T')[0]} - {row.media_release_date_range_end.toISOString().split('T')[0]}</p>
                                    {/if}
                                    <p class="text-left text-sm mb-2 z-20">Type: {row.media_type}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        {/each}
    </div>
</ul>