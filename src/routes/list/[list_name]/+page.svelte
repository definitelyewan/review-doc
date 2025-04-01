<script>
    export let data;

    import { page } from '$app/stores';
    import ReviewRadial from '$lib/client/review_radial.svelte';

    const list_name = $page.params.list_name.charAt(0).toUpperCase() + $page.params.list_name.slice(1);
    const total_average_score = Math.round(data.average_score);
    const media_info = data.media;
    const reviewer_average_score = data.reviewer_average_score;

    const bar_data = data.years;

</script>
<div id="top"/>

<div class="flex flex-wrap mt-2 mb-2 ml-2 mr-2">
    <div class="flex flex-col md:flex-row w-full">
        <div id="info" class="p-2 w-full md:w-1/3">
            <h1 class="text-center text-7xl">{list_name}</h1>
            <div class="mt-1 mb-1">
                <hr class="hr border-t-8" />
            </div>
            <p class="text-center text-lg">Key Words</p>
            <div class="flex flex-wrap w-full">
                {#each data.key_words as word}
                    <div class="p-1">
                        <p class="badge variant-filled">
                            {word}
                        </p>
                    </div>

                {/each}
            </div>
            <div class="mt-1 mb-1">
                <hr class="hr border-t-8" />
            </div>
            <p class="text-center text-lg">Current Scores</p>
            <div class="flex flex-wrap items-center justify-center">
                <div class="flex flex-col p-2">
                    <ReviewRadial score={total_average_score} width="w-32"/>
                    <p>Community Score</p>
                </div>
                {#if reviewer_average_score == Number(reviewer_average_score)}
                
                    <div class="flex flex-col p-2">
                        <ReviewRadial score={Math.round(reviewer_average_score)} width="w-32"/>
                        <p>{$page.data.user.name}'s Avg. Score</p>
                    </div>
                {/if}

            </div>
            <div class="mt-1 mb-1">
                <hr class="hr border-t-8" />
            </div>
            <p class="text-center text-lg">History</p>
            <p class="text-center text-slate-400 mb-2">How the score has changed over the years.</p>

            <div class="w-full max-w-4xl">
                <div class="flex flex-col space-y-2">
                    {#each bar_data as { avg_score, year }}
                        <div class="flex items-center space-x-4">
                            <!-- Year Label -->
                            <span class="font-medium">{year}</span>
                            
                            <!-- Horizontal Bar -->
                            <div class="flex-1 bg-gray-200 rounded relative overflow-hidden">
                                {#if avg_score == 0}
                                    <div 
                                       class="bg-red-500 hover:bg-red-200 text-white text-sm font-medium text-center p-1 rounded" 
                                       style="width: {avg_score / 10 * 100}%;">
                                        {Math.round(avg_score)}
                                    </div>
                                {:else if avg_score <= 2}
                                    <div 
                                       class="bg-orange-500 hover:bg-orange-200 text-white text-sm font-medium text-center p-1 rounded" 
                                       style="width: {avg_score / 10 * 100}%;">
                                        {Math.round(avg_score)}
                                    </div>
                                {:else if avg_score <= 4}
                                    <div 
                                       class="bg-yellow-500 hover:bg-yellow-200 text-white text-sm font-medium text-center p-1 rounded" 
                                       style="width: {avg_score / 10 * 100}%;">
                                        {Math.round(avg_score)}
                                    </div>
                                {:else if avg_score <= 6}
                                    <div  
                                       class="bg-green-500 hover:bg-green-200 text-white text-sm font-medium text-center p-1 rounded" 
                                       style="width: {avg_score / 10 * 100}%;">
                                        {Math.round(avg_score)}
                                    </div>
                                {:else if avg_score <= 8}
                                    <div  
                                       class="bg-blue-500 hover:bg-blue-200 text-white text-sm font-medium text-center p-1 rounded" 
                                       style="width: {avg_score / 10 * 100}%;">
                                        {Math.round(avg_score)}
                                    </div>
                                {:else if avg_score <= 10}
                                    <div 
                                       class="bg-purple-500 hover:bg-purple-200 text-white text-sm font-medium text-center p-1 rounded" 
                                       style="width: {avg_score / 10 * 100}%;">
                                        {Math.round(avg_score)}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

        </div>

        <div id="media" class="p-2 w-full md:w-2/3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each media_info as media}
                    <div class="p-1">
                        <a href="/media/{media.media_id}" class="block">
                            <div class="relative card p-4 rounded-lg flex items-center overflow-hidden" style="min-height: 160px;">
                                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40">
                                    <div class="absolute inset-0 bg-cover bg-center" 
                                        style="background-image: url('/api/media/image/{media.media_id}/banner');">
                                    </div>
                                </div>
                                <div class="relative z-10 flex items-start space-x-4">
                                    <div class="flex-shrink-0">
                                        <img
                                            src="/api/media/image/{media.media_id}/cover"
                                            alt={media.media_name}
                                            class="w-24 h-36 object-cover rounded-md shadow-lg"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-medium text-lg text-white mb-2">{media.media_name}</h3>
                                        {#if $page.data.user}
                                            <p class="text-sm text-gray-200 capitalize">
                                                {#if media.seen == true}
                                                    Already Experienced 👁
                                                {:else}
                                                    To Be Experienced
                                                {/if}
                                                
                                            </p>
                                        {/if}

                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>