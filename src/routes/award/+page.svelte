<script>
    export let data = [];
    import corr from "$lib/client/corrections.js"
    import { onMount } from 'svelte';


    const awards_by_name = data.awards_by_name;
    const unique_years = data.unique_years;
    const best_of_awards = data.best_of[0];
</script>

<div class="mt-2 mb-2">
    <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
        <p class="text-4xl"><b>All Awards</b></p>
        <p class="text-2xl">{unique_years[0]} to {unique_years[unique_years.length - 1]} </p>
        <div class="relative flex flex-col items-center justify-center w-full h-full">
            <div class="relative card mt-2 p-2 w-full h-full shadow-lg rounded-lg flex items-center justify-center mx-auto">
                <div class="flex flex-wrap justify-center">
                    {#each unique_years as award}
                        <a href="award/{award}"><span class="badge variant-filled mt-2 mb-2 mr-1">{award}</span></a>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>

<div class="mt-2 mb-2">
    <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
        <p class="text-2xl">Best of the Year</p>
    </div>
</div>

{#each best_of_awards as award}
    <div class="mt-2 mb-2 ml-2 mr-2">
        <a href= "../media/{award.media[0].media_id}">
            <div class="relative card p-2 shadow-lg rounded-lg flex items-center col-span-1 lg:col-span-2" style="min-width: 300px;">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40 rounded-lg">
                    <div class="-z-10 absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{award.media[0].media_id}/banner'); object-fit: cover;"></div>
                </div>
                <div class="z-0 flex-shrink-0 flex flex-wrap items-center">
                    <img
                        class=" rounded-md md:w-48 w-32 h-auto"
                        src="/api/media/image/{award.media[0].media_id}/cover"
                        alt={award.media[0].media_name}
                    />
                    <div class="ml-4">
                        <h2 class="text-2xl md:text-4xl break-words max-w-[12ch] sm:max-w-none bg-gradient-to-r from-[#cd7f32] to-[#ffd700] bg-clip-text text-transparent">
                            {award.media[0].media_name}
                        </h2>
                        <h2 class="text-1xl md:text-2xl">{award.year}</h2>
                    </div>
                </div>
            </div>
        </a>
    </div>
{/each}

{#each awards_by_name as award}
    
    <div class="mt-2 mb-2 mr-2 ml-2">
        <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
            <p class="text-xl text-center">{award.award_name}</p>
        </div>
        <div class="flex flex-wrap justify-center">
            {#each award.years as award_medias}
                {#each award_medias.media as media}
                    <div class="p-1 md:w-1/2 w-full">
                        <a href="../media/{media.media_id}">
                            <div class="relative card p-2 shadow-lg rounded-lg flex items-center col-span-1 lg:col-span-2" style="min-width: 300px;">
                                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40 rounded-lg z-5">
                                    <div class="-z-10 absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{media.media_id}/banner'); object-fit: cover;"></div>
                                </div>
                                <div class="z-0 flex-shrink-0 flex items-center">
                                    <img
                                        class="rounded-md w-32 h-auto"
                                        src="/api/media/image/{media.media_id}/cover"
                                        alt={media.media_name}
                                    />
                                    <div class="ml-4">
                                        <h2 class="text-2xl text-warning-300 break-words max-w-[12ch] sm:max-w-none bg-gradient-to-r from-[#cd7f32] to-[#ffd700] bg-clip-text text-transparent">{media.media_name}</h2>
                                        <h2 class="text-1xl">{award_medias.year}</h2>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                {/each}
            {/each}
        </div>
    </div>
{/each}


<!-- {#each awards_by_name as award}
    
    <div class="mt-2 mb-2 mr-2 ml-2">
        <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
            <p class="text-xl text-center">{award.award_name}</p>
        </div>
        {#each award.years as award_medias}
            {#each award_medias.media as media}
            <div class="mt-2">
                <a href="../media/{media.media_id}">
                    <div class="relative card p-2 shadow-lg rounded-lg flex items-center col-span-1 lg:col-span-2" style="min-width: 300px;">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40 rounded-lg z-5">
                            <div class="-z-10 absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{media.media_id}/banner'); object-fit: cover;"></div>
                        </div>
                        <div class="z-0 flex-shrink-0 flex flex-wrap items-center">
                            <img
                                class="rounded-md w-32 h-auto"
                                src="/api/media/image/{media.media_id}/cover"
                                alt={media.media_name}
                            />
                            <div class="ml-4">
                                <h2 class="text-2xl text-warning-300 break-words max-w-[12ch] sm:max-w-none bg-gradient-to-r from-[#cd7f32] to-[#ffd700] bg-clip-text text-transparent">{media.media_name}</h2>
                                <h2 class="text-1xl">{award_medias.year}</h2>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
            {/each}
        {/each}
    </div>
{/each} -->