<script>
    export let data = [];
    import corr from "$lib/client/corrections.js"

    console.log(data);
    
    const awards_by_name = data.awards_by_name;
    const unique_years = data.unique_years;

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

{#each awards_by_name as award}
    <div class="mt-2 mb-2">
        <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
            <p class="text-xl text-center">{award.award_name}</p>
        </div>
        <div class="flex flex-wrap justify-center">
            {#each award.years as award_medias}
                {#each award_medias.media as media}
                    <a href="../media/{media.media_id}" class="m-2">
                        <div class="relative card p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-64 h-auto lg:h-96">
                            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-10 rounded-lg z-10">
                                <div class="absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{media.media_id}/banner');"></div>
                            </div>
                            {#if award.award_name.length > 15}
                                <p class="text-center text-xl mb-2 z-20">{award_medias.year}</p>
                            {/if}

                            <div class="relative flex-shrink-0 w-full flex justify-center items-center z-20">
                                <img
                                    class="rounded-md w-40 h-64 object-cover"
                                    src="/api/media/image/{media.media_id}/cover"
                                    alt={media.media_name}
                                />
                            </div>
                            
                            {#if media.media_name.length > 15}
                                <p class="text-center text-xl mb-2 z-20" style="font-size: {corr.calculate_title_font_size(media.media_name, 15, 20)}">{media.media_name}</p>
                            {:else}
                                <p class="text-center text-xl mb-2 z-20">{media.media_name}</p>
                            {/if}
                        </div> 
                    </a>
                {/each}

            {/each}
        </div>
    </div>
{/each}