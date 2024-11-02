<script>
    import ReviewRadial from '$lib/client/review_radial.svelte';
    import { Avatar } from '@skeletonlabs/skeleton';
    import { TabGroup, Tab} from '@skeletonlabs/skeleton';
    import corr from '$lib/client/corrections.js';
    export let data;

    let elemNewestMovies;
    let elemMostAcclaimedMovies;
    let tabSet = 0;
    const newest_reviews = data.newest_reviews;
    const most_acclaimed = data.most_acclaimed;
    const score_counts = data.score_counts;
    const user = data.user;

    function multiColumnLeft(elem) {
        let x = elem.scrollWidth;
        if (elem.scrollLeft !== 0) x = elem.scrollLeft - elem.clientWidth;
        elem.scroll(x, 0);
    }

    function multiColumnRight(elem) {
        let x = 0;
        if (elem.scrollLeft < elem.scrollWidth - elem.clientWidth - 1) x = elem.scrollLeft + elem.clientWidth;
        elem.scroll(x, 0);
    }


</script>


<div class="flex flex-col items-center justify-center mt-2">
    <Avatar width="w-20" initials={user.user_name} background="bg-primary-500"/>
    <p class="text-2xl"><b>{user.user_name}</b></p>
</div>

<div class="mt-4 mr-2 ml-2 space-y-4">
    <hr class="hr border-t-8" />
</div>

<TabGroup justify="justify-center">
    <Tab bind:group={tabSet} name="tab1" value={0}>
        <svelte:fragment slot="lead">Favourites</svelte:fragment>
    </Tab>

    <svelte:fragment slot="panel">
        {#if tabSet === 0}
            <div class="grid grid-cols-1 gap-4 items-center">

                <div bind:this={elemMostAcclaimedMovies} class="snap-x snap-mandatory scroll-smooth flex gap-2 pb-2 overflow-x-auto">
                    {#each most_acclaimed as review}
                        <a href="../media/{review.media_id}">
                            <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-40 h-62">
                                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-10 rounded-lg z-10">
                                    <div class="absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{review.media_id}/banner');"></div>
                                </div>
                                <div class="flex-shrink-0 w-full flex justify-center items-center">
                                    <img
                                        class="rounded-md w-36 h-52 object-cover"
                                        src="/api/media/image/{review.media_id}/cover"
                                        alt={review.media_name}
                                    />
                                </div>
                                {#if review.media_name.length > 7}
                                    <p class="text-center text-xl mb-2" style="font-size: {corr.calculate_title_font_size(review.media_name, 7, 20)}">{review.media_name}</p>
                                {:else}
                                    <p class="text-center text-xl mb-2">{review.media_name}</p>
                                {/if}
                            </div>
                        </a>
                    {/each}
                </div>

                <div class="flex justify-center mt-2 ml-2 mr-2">

                    <button type="button" class="btn variant-filled w-36 mr-2" on:click={() => multiColumnLeft(elemMostAcclaimedMovies)}>
                        <i class="fa-solid fa-arrow-left"> ◄ </i>
                        Left
                    </button>

                    <button type="button" class="btn variant-filled w-36 ml-2" on:click={() => multiColumnRight(elemMostAcclaimedMovies)}>
                        Right
                        <i class="fa-solid fa-arrow-right"> ► </i>
                    </button>
                </div>
            </div>
        {/if}
    </svelte:fragment>
</TabGroup>

<div class="mt-4 mr-2 ml-2 space-y-4">
    <hr class="hr border-t-8" />
</div>

<!-- paged top 20 newest reviewed works -->
<div class="mt-2 mb-2">
    <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
        <p class="text-2xl"><b>Latest Reviews</b></p>
    </div>
</div>

<div class="grid grid-cols-1 gap-4 items-center">
    <div bind:this={elemNewestMovies} class="snap-x snap-mandatory scroll-smooth flex gap-2 pb-2 overflow-x-auto">
        {#each newest_reviews as review}
            <a href="../media/{review.media.media_id}">
                <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-40 h-96 -z-10">
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-10 rounded-lg z-0">
                        <div class="absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{review.media.media_id}/banner');"></div>
                    </div>
                    <div class="flex-shrink-0 w-full flex justify-center items-center">
                        <img
                            class="rounded-md w-36 h-52 object-cover z-10"
                            src="/api/media/image/{review.media.media_id}/cover"
                            alt={review.media.media_name}
                        />
                    </div>
                    
                    <p class="text-center text-xl mb-2" style="font-size: {corr.calculate_title_font_size(review.media.media_name, 9, 20)}">{review.media.media_name}</p>

                    <ReviewRadial class="mt-2" score={review.review_score} width="w-16"/>
                    
                    {#if review.review_sub_name != null}
                        {#if review.media.media_type == 'tv'}
                            {#if isNaN(review.review_sub_name) === true}
                                <p class="text-center text-xl mb-2" style="font-size: {corr.calculate_title_font_size(`Seasons ${review.review_sub_name.split(' ')[0]} - ${review.review_sub_name.split(' ')[review.review_sub_name.split(' ').length - 1]}`, 7, 20)}">
                                    Seasons {review.review_sub_name.split(' ')[0]} - {review.review_sub_name.split(' ')[review.review_sub_name.split(' ').length - 1]}
                                </p>
                            {:else}
                                <p class="text-center mb-1">Season {review.review_sub_name}</p>
                            {/if}
                        {:else}
                            <p class="text-center text-xl mb-2" style="font-size: {corr.calculate_title_font_size(review.review_sub_name, 7, 20)}">
                                {review.review_sub_name}
                            </p>
                        {/if}
                    {/if}
                </div>
            </a>
        {/each}
    </div>

    <div class="flex justify-center mt-2 ml-2 mr-2">

        <button type="button" class="btn variant-filled w-36 mr-2" on:click={() => multiColumnLeft(elemNewestMovies)}>
            <i class="fa-solid fa-arrow-left"> ◄ </i>
            Left
        </button>
        <button type="button" class="btn variant-filled w-36 ml-2" on:click={() => multiColumnRight(elemNewestMovies)}>
            Right
            <i class="fa-solid fa-arrow-right"> ► </i>
        </button>
    </div>
</div>

<div class="flex flex-wrap items-center justify-center mr-2 ml-2">
    <button class="ml-2 mr-2 mt-2 mb-2 bg-surface-100 text-slate-900 rounded-xl">
        <a href="{user.user_id}/all">
            <span class="text-md p-2">View all reviews</span>
        </a>
    </button>
</div>

<div class="mt-4 mr-2 ml-2 space-y-4">
    <hr class="hr border-t-8" />
</div>

<!-- highest reviewed works/dist -->
<div class="mt-2 mb-2">
    <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
        <p class="text-xl"><b>Review Distribution</b></p>
    </div>
</div>

<div class="mt-2 mr-2 ml-2 flex flex-col items-center">
    <div class="w-full max-w-4xl">
        <div class="flex justify-center mb-4 items-end space-x-1 overflow-x-hidden flex-nowrap">
            {#each score_counts as { review_score, count }}
                <div class="flex flex-col items-center flex-1">
                    <span>{count}</span>

                    {#if review_score == 0}
                        <a href="/distribution/{review_score}?user={user.user_id}" class="bg-red-500 hover:bg-red-200 w-full rounded-t-md" style="height: {Number(count) * 2}px">
                        </a>
                    {:else if review_score <= 2}
                        <a href="/distribution/{review_score}?user={user.user_id}" class="bg-orange-500 hover:bg-orange-200 w-full rounded-t-md" style="height: {Number(count) * 2}px">
                        </a>
                    {:else if review_score <= 4}
                        <a href="/distribution/{review_score}?user={user.user_id}" class="bg-yellow-500 hover:bg-yellow-200 w-full rounded-t-md" style="height: {Number(count) * 2}px">
                        </a>
                    {:else if review_score <= 6}
                        <a href="/distribution/{review_score}?user={user.user_id}" class="bg-green-500 hover:bg-green-200 w-full rounded-t-md" style="height: {Number(count) * 2}px">
                        </a>
                    {:else if review_score <= 8}
                        <a href="/distribution/{review_score}?user={user.user_id}" class="bg-blue-500 hover:bg-blue-200 w-full rounded-t-md" style="height: {Number(count) * 2}px">
                        </a>
                    {:else if review_score <= 10}
                        <a href="/distribution/{review_score}?user={user.user_id}" class="bg-purple-500 hover:bg-purple-200 w-full rounded-t-md" style="height: {Number(count) * 2}px">
                        </a>
                    {/if}
                    
                    <span class="mt-2">{review_score}'s</span>
                    
                </div>
            {/each}
        </div>
    </div>
</div>


