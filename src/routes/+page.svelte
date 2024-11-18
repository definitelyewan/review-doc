<script>
    import ReviewRadial from '$lib/client/review_radial.svelte';
    import { Avatar } from '@skeletonlabs/skeleton';
    import { TabGroup, Tab, TabAnchor } from '@skeletonlabs/skeleton';
    import corr from '$lib/client/corrections.js';
    export let data;

    let elemNewestMovies;
    let elemMostAcclaimedMovies;
    let tabSet = 0;
    const newest_reviews = data.newest_reviews;
    const most_acclaimed = data.most_acclaimed;
    const score_counts = data.score_counts;
    const users = data.users;

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

<title>Review Doc</title>

<!-- paged top 20 newest reviewed works -->
<div class="mt-2 mb-2">
    <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
        <p class="text-4xl"><b>Latest Reviews</b></p>
    </div>
</div>

<div class="grid grid-cols-1 gap-4 items-center">
    <!-- Carousel -->
    <div bind:this={elemNewestMovies} class="snap-x snap-mandatory scroll-smooth flex gap-2 pb-2 overflow-x-auto">
        {#each newest_reviews as review}
            <a href="media/{review.media.media_id}?review={review.review_id}">
                <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-40 h-96 -z-10">
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-10 rounded-lg z-0">
                        <div class="absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{review.media.media_id}/banner');"></div>
                    </div>
                    <div class="flex items-center">
                        <Avatar
                            width="w-4"
                            initials={review.user.user_name}
                            background="bg-primary-500"
                        />
                        <p class="ml-2">{review.user.user_name}</p>
                    </div>
                    <div class="flex-shrink-0 w-full flex justify-center items-center">
                        <img
                            class="z-10 rounded-md w-36 h-52 object-cover"
                            src="/api/media/image/{review.media.media_id}/cover"
                            alt={review.media.media_name}
                        />
                    </div>
                    
                    <p class="text-center text-xl mb-2" style="font-size: {corr.calculate_title_font_size(review.media.media_name, 7, 20)}">{review.media.media_name}</p>
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
    <!-- Buttons -->
    <div class="flex justify-center mt-2 ml-2 mr-2">
        <!-- Button: Left -->
        <button type="button" class="btn variant-filled w-36 mr-2" on:click={() => multiColumnLeft(elemNewestMovies)}>
            <i class="fa-solid fa-arrow-left"> ◄ </i>
            Left
        </button>
        <!-- Button-Right -->
        <button type="button" class="btn variant-filled w-36 ml-2" on:click={() => multiColumnRight(elemNewestMovies)}>
            Right
            <i class="fa-solid fa-arrow-right"> ► </i>
        </button>
    </div>
</div>

<div class="mt-4 mr-2 ml-2 space-y-4">
    <hr class="hr border-t-8" />
</div>

<!-- highest reviewed works/dist -->
<div class="mt-2 mb-2">
    <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
        <p class="text-2xl"><b>Review Distribution</b></p>
    </div>
</div>

<div class="mt-2 mr-2 ml-2 flex flex-col items-center">
    <div class="w-full max-w-4xl">
        <div class="flex justify-center mb-4 items-end space-x-1 overflow-x-hidden flex-nowrap">
            {#each score_counts as { review_score, count }}
                <div class="flex flex-col items-center flex-1">
                    <span>{count}</span>

                    {#if review_score == 0}
                        <a href="/distribution/{review_score}" class="bg-red-500 hover:bg-red-200 w-full rounded-t-md" style="height: {Number(count) * 2}px">
                        </a>
                    {:else if review_score <= 2}
                        <a href="/distribution/{review_score}" class="bg-orange-500 hover:bg-orange-200 w-full rounded-t-md" style="height: {Number(count) * 2}px">
                        </a>
                    {:else if review_score <= 4}
                        <a href="/distribution/{review_score}" class="bg-yellow-500 hover:bg-yellow-200 w-full rounded-t-md" style="height: {Number(count) * 2}px">
                        </a>
                    {:else if review_score <= 6}
                        <a href="/distribution/{review_score}" class="bg-green-500 hover:bg-green-200 w-full rounded-t-md" style="height: {Number(count) * 2}px">
                        </a>
                    {:else if review_score <= 8}
                        <a href="/distribution/{review_score}" class="bg-blue-500 hover:bg-blue-200 w-full rounded-t-md" style="height: {Number(count) * 2}px">
                        </a>
                    {:else if review_score <= 10}
                        <a href="/distribution/{review_score}" class="bg-purple-500 hover:bg-purple-200 w-full rounded-t-md" style="height: {Number(count) * 2}px">
                        </a>
                    {/if}
                    
                    <span class="mt-2">{review_score}'s</span>
                    
                </div>
            {/each}
        </div>
    </div>
</div>


<TabGroup justify="justify-center">
    <Tab bind:group={tabSet} name="tab1" value={0}>
        <svelte:fragment slot="lead">Most Acclaimed</svelte:fragment>
    </Tab>
    <!-- Tab Panels --->
    <svelte:fragment slot="panel">
        {#if tabSet === 0}
            <div class="grid grid-cols-1 gap-4 items-center">
                <!-- Carousel -->
                <div bind:this={elemMostAcclaimedMovies} class="snap-x snap-mandatory scroll-smooth flex gap-2 pb-2 overflow-x-auto">
                    {#each most_acclaimed as review}
                        <a href="media/{review.media_id}">
                            <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-40 h-64 -z-10">
                                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-10 rounded-lg z-0">
                                    <div class="absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{review.media_id}}/banner');"></div>
                                </div>
                                <div class="flex-shrink-0 w-full flex justify-center items-center">
                                    <img
                                        class="z-10 rounded-md w-36 h-52 object-cover"
                                        src="/api/media/image/{review.media_id}/cover"
                                        alt={review.media_name}
                                    />
                                </div>
                                
                                <p class="text-center text-xl mb-2" style="font-size: {corr.calculate_title_font_size(review.media_name, 7, 20)}">{review.media_name}</p>
                            </div>
                        </a>
                    {/each}
                </div>
                <!-- Buttons -->
                <div class="flex justify-center mt-2 ml-2 mr-2">
                    <!-- Button: Left -->
                    <button type="button" class="btn variant-filled w-36 mr-2" on:click={() => multiColumnLeft(elemMostAcclaimedMovies)}>
                        <i class="fa-solid fa-arrow-left"> ◄ </i>
                        Left
                    </button>
                    <!-- Button-Right -->
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

<!-- users -->

<div class="mt-2 mb-2">
    <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
        <p class="text-2xl"><b>Users</b></p>
    </div>
</div>

{#each users as user}
    <div class="mt-2 mb-2 flex justify-center">
        <a href="user/{user.user_id}">
            <div class="relative card mx-2 my-2 p-2 w-80 shadow-lg rounded-lg flex flex-col flex-grow-0">
                <div class="flex items-center">
                    <Avatar
                        width="w-12"
                        initials={user.user_name}
                        background="bg-primary-500"
                    />
                    <p class="ml-2 text-xl">{user.user_name}</p>
                </div>
            </div>
        </a>
    </div>
{/each}