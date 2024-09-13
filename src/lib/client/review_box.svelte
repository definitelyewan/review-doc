<script>
	import { Avatar } from '@skeletonlabs/skeleton';
    import ReviewRadial from '$lib/client/review_radial.svelte';

    import corr from '$lib/client/corrections.js';

    export let users = [];
    export let review = {};
    export let media_type;

	function user_id_index_to_user_name(user_id_index) {
		return users[user_id_index].user_name;
	}

</script>

<div class="card w-full max-w-full ml-2 mr-2 mb-2 p-2 inline-block">
    <div class="flex items-center mb-2">
        <Avatar
            width="w-12"
            initials={user_id_index_to_user_name(
                users.findIndex((item) => item['user_id'] === review.user_id)
            )}
            background="bg-primary-500"
        />
        <div class="ml-2 flex items-center">
            <b class="text-2xl">
                {user_id_index_to_user_name(
                    users.findIndex((item) => item['user_id'] === review.user_id)
                )}
            </b>
            <i class="text-sm ml-2">from {review.review_date.split('T')[0]}</i>
        </div>
    </div>
    <div class="space-y-4">
        <hr class="hr border-t-8" />
    </div>

    <div class="grid grid-cols-1 md:flex md:flex-row items-start p-2">
        <div class="flex flex-col items-center justify-center md:mr-4">
            
            {#if review.review_sub_name != null}
                {#if media_type == 'tv'}
                    {#if review.review_sub_name != null && isNaN(review.review_sub_name) === true}
                        <p class="text-xl text-center mb-1">Seasons {review.review_sub_name.split(' ')[0]} - {review.review_sub_name.split(' ')[review.review_sub_name.split(' ').length - 1]}</p>
                    {/if}
                {:else}
                    <p class="text-xl text-center mb-1">{review.review_sub_name}</p>
                {/if}
            {/if}

            <ReviewRadial score={review.review_score} width="w-24" class="mt-1"/>
        </div>
        <ul class="list-disc ml-0 mt-2 md:mt-0">
            {#each review.review_bullets as bullet}
                <li class="ml-4">{bullet}</li>
            {/each}
        </ul>
    </div>
    <div class="space-y-4">
        <hr class="hr border-t-8" />
    </div>
    {#if review.review_platform != null}
        <div class="flex items-center mt-2">
            <p class="text-sm">Experienced on/in {review.review_platform}</p>
            <img alt="." src="../{corr.platform_to_svg_name(review.review_platform)}" class="w-6 h-6 ml-2" />
        </div>
    {/if}
</div>