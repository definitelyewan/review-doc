<!-- Frontend view for the award/[year] url -->
<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { TreeView, TreeViewItem} from '@skeletonlabs/skeleton';
    import { TabGroup, Tab, TabAnchor } from '@skeletonlabs/skeleton';
    import corr from '$lib/client/corrections.js';
    export let data = [];

    const users = data.media_data.user;
    const awards = data.unique_awards;
    const year = $page.params.year
    let tabSet = 0;
    let justify = 'justify-start';

    function updateJustify() {
        if (window.innerWidth >= 1024) {
            justify = 'justify-center';
        } else {
            justify = 'justify-start';
        }
    }

    onMount(() => {
        updateJustify();
        window.addEventListener('resize', updateJustify);

        return () => {
            window.removeEventListener('resize', updateJustify);
        };
    });

</script>

<title>Review Doc - Awards {year}</title>

<div class="mt-2 mb-2">
    <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
        <p class="text-4xl"><b>{year}</b></p>
        <p class="text-2xl">Awards Issued this year</p>
    </div>
</div>


<div class="ml-2 mr-2">
    <TabGroup {justify}>
        {#each awards as award}
            <Tab bind:group={tabSet} name="{award}" value={award}>
                {award}
            </Tab>
        {/each}

        <svelte:fragment slot="panel">
            {#each awards as award}
                {#if tabSet === award}
                    <div class="flex justify-center items-center flex-wrap">
                        <TreeView>
                            {#each users as user}
                                <TreeViewItem>
                                    {user.user_name}
                                    <svelte:fragment slot="children">
                                        <div class="flex justify-center items-center flex-wrap">
                                            {#each user.media_award_info as info}
                                                {#if info.award.award_name == award}
                                                    <a href="../media/{info.award.media_id}">
                                                        <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0 w-64 h-auto lg:h-80">
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-10 rounded-lg z-10">
                                                                <div class="absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{info.award.media_id}/banner');"></div>
                                                            </div>
                                    
                                                            <div class="relative flex-shrink-0 w-full flex justify-center items-center z-20">
                                                                {#if info.award.award_status == "winner"}
                                                                    <img
                                                                        class="rounded-md w-40 h-64 object-cover"
                                                                        src="/api/media/image/{info.media.media_id}/cover"
                                                                        alt={info.media.media_name}
                                                                    />
                                                                    <img
                                                                        class="absolute inset-0 w-full h-full z-30 object-cover"
                                                                        src="/Award.svg"
                                                                        alt="Award"
                                                                        style="filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));"
                                                                    />
                                                                {:else}
                                                                    <img
                                                                        class="rounded-md w-40 h-64 object-cover hidden sm:block"
                                                                        src="/api/media/image/{info.media.media_id}/cover"
                                                                        alt={info.media.media_name}
                                                                        style="filter: brightness(0.5); opacity: 0.7;"
                                                                    />
                                                                {/if}
                                                            </div>
                                                            
                                                            {#if info.media.media_name.length > 15}
                                                                <p class="text-center text-xl mb-2 z-20" style="font-size: {corr.calculate_title_font_size(info.media.media_name, 15, 20)}">{info.media.media_name}</p>
                                                            {:else}
                                                                <p class="text-center text-xl mb-2 z-20">{info.media.media_name}</p>
                                                            {/if}
                                                        </div>
                                                    </a>
                                                {/if}
                                            {/each}
                                        </div>
                                    </svelte:fragment>
                                </TreeViewItem>
                            {/each}
                        </TreeView>
                    </div>
                {/if}
            {/each}

        </svelte:fragment>
    </TabGroup>
</div>
