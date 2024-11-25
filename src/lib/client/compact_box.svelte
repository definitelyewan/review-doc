<script>
    import { Avatar } from '@skeletonlabs/skeleton';
    import corr from '$lib/client/corrections.js';
    import ReviewRadial from '$lib/client/review_radial.svelte';

    export let review_date;
    export let media_name;
    export let review_bullets;
    export let review_sub_name;
    export let media_type;
    export let review_score;
    export let user_name;
    export let media_id;

    let review_year = new Date(review_date).getFullYear();
    let banner_url = `/api/media/image/${media_id}/banner`;
</script>

<div class="mt-2">
    <hr class="hr border-t-8" />
</div>

<div class="relative">
    <div class="w-full">
        <img
            class="absolute top-0 -z-10 rounded-md w-full h-64 object-cover"
            src="/api/media/image/{media_id}/banner"
            alt={media_name}
            style="mask-image: linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0)); -webkit-mask-image: -webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,0.15)), to(rgba(0,0,0,0)));"
        />
    </div>


    <div class="mt-2 flex relative">
 
        <div class="flex-col md:w-2/12 w-1/3">
            <img
                class="z-10 rounded-md w-full"
                src="/api/media/image/{media_id}/cover"
                alt={media_name}
            />
    
            <div class="mt-2 mb-1 justify-center items-center">
                <ReviewRadial score={review_score} width="w-24 md:w-full"/>
            </div>
            
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
                {#if user_name != null}
                    <Avatar
                        width="w-4"
                        initials={user_name}
                        background="bg-primary-500"
                    />
                    <p class="ml-2">{user_name}</p>
                {/if}
                <i class="text-sm ml-2">{review_year}</i>
            </div>
    
            <ul class="list-disc ml-0 mt-2 md:mt-0">
                {#each review_bullets as bullet}
                    {#if bullet.length > 0}
                        <li class="ml-4">{bullet}</li>
                    {/if}
                {/each}
            </ul>
    
        </div>
    </div>



</div>
