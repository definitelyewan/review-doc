<script>
    import { Avatar } from '@skeletonlabs/skeleton';
    import corr from '$lib/client/corrections.js';
    import { Ratings } from '@skeletonlabs/skeleton';
    export let review_date;
    export let media_name;
    export let review_bullets;
    export let review_sub_name;
    export let media_type;
    export let review_score;
    export let user_name;
    export let media_id;



    let r_colour = (score) => {
        if (score == 0) {
            return 'text-red-500';
        } else if (score <= 2) {
            return 'text-orange-500';
        } else if (score <= 4) {
            return 'text-yellow-500';
        } else if (score <= 6) {
            return 'text-green-500';
        } else if (score <= 8) {
            return 'text-blue-500';
        } else {
            return 'text-purple-500';
        }
    }

    let review_year = new Date(review_date).getFullYear();
    let split = { current: review_score, max: 10 };
</script>

<div class="mt-2">
    <hr class="hr border-t-8" />
</div>

<div class="mt-2 flex">
    <div id="im" class="flex-col md:w-2/12">
        <img
            class="z-10 rounded-md w-full"
            src="/api/media/image/{media_id}/cover"
            alt={media_name}
        />
        {#if review_sub_name != null}
            {#if media_type == 'tv'}
            
                {#if isNaN(review_sub_name) === true}
                    <p class="text-center text-xl mb-2" style="font-size: {corr.calculate_title_font_size(`Seasons ${review_sub_name.split(' ')[0]} - ${review_sub_name.split(' ')[review_sub_name.split(' ').length - 1]}`, 7, 20)}">
                        Seasons {review_sub_name.split(' ')[0]} - {review_sub_name.split(' ')[review_sub_name.split(' ').length - 1]}
                    </p>
                {:else}
                    <p class="text-center mb-1">Season {review_sub_name}</p>
                {/if}
            {:else}
                <p class="text-center text-xl mb-2" style="font-size: {corr.calculate_title_font_size(review_sub_name, 7, 20)}">
                    {review_sub_name}
                </p>
            {/if}
        {/if}
    </div>
    <div class="flex-1 ml-2">
        <p class="text-2xl text-left">{media_name}</p>
        <div class="flex items-center">
            <Avatar
                width="w-4"
                initials={user_name}
                background="bg-primary-500"
            />
            <p class="ml-2">{user_name}</p>
            <i class="text-sm ml-2">{review_year}</i>
        </div>
        <Ratings justify="justify-left" bind:value={split.current} max={split.max}>
            <svelte:fragment slot="empty">
                <span class={r_colour(split.current)}>○</span>
            </svelte:fragment>
            <svelte:fragment slot="half">
                <span class={r_colour(split.current)}>◐</span>
            </svelte:fragment>
            <svelte:fragment slot="full">
                <span class={r_colour(split.current)}>◉</span>
            </svelte:fragment>
        </Ratings>

        <ul class="list-disc ml-0 mt-2 md:mt-0">
            {#each review_bullets as bullet}
                {#if bullet.length > 0}
                    <li class="ml-4">{bullet}</li>
                {/if}
            {/each}
        </ul>

    </div>
</div>





