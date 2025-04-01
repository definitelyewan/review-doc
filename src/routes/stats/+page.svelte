<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    // Data comes from the server
    export let data;

    // Get data from the server response
    $: mediaList = data.mediaList || [];
    $: mediaTypeStats = data.mediaTypeStats || [];
    $: reviewYears = data.filterOptions?.reviewYears || [];
    $: releaseYears = data.filterOptions?.releaseYears || [];
    $: mediaTypes = data.filterOptions?.mediaTypes || [];
    $: reviewers = data.filterOptions?.reviewers || [];

    interface Filters {
        reviewYear: string;
        releaseYear: string;
        mediaType: string;
        reviewer: string;
    }

    // Initialize filters based on URL search params
    let filters: Filters = {
        reviewYear: $page.url.searchParams.get('reviewYear') || '',
        releaseYear: $page.url.searchParams.get('releaseYear') || '',
        mediaType: $page.url.searchParams.get('mediaType') || '',
        reviewer: $page.url.searchParams.get('reviewer') || ''
    };

    $: filteredMedia = mediaList.filter(m =>
        (!filters.reviewYear || m.reviewYear === +filters.reviewYear) &&
        (!filters.releaseYear || m.releaseYear === +filters.releaseYear) &&
        (!filters.mediaType || m.mediaType.toLowerCase() === filters.mediaType.toLowerCase()) &&
        (!filters.reviewer || m.reviewer.toLowerCase().includes(filters.reviewer.toLowerCase()))
    );

    $: filteredMediaTypeStats = calculateMediaTypeStats(filteredMedia);
    
    let sortBy = 'count';
    let sortOrder = 'desc'; // 'asc' or 'desc'
    
    $: sortedMediaTypeStats = [...filteredMediaTypeStats].sort((a, b) => {
        const multiplier = sortOrder === 'desc' ? -1 : 1;
        return sortBy === 'count' 
            ? multiplier * (a.count - b.count) 
            : multiplier * (a.avgRating - b.avgRating);
    });

    // Apply filters to the URL and reload page
    function applyFilters() {
        const searchParams = new URLSearchParams();
        
        if (filters.reviewYear) searchParams.set('reviewYear', filters.reviewYear);
        if (filters.releaseYear) searchParams.set('releaseYear', filters.releaseYear);
        if (filters.mediaType) searchParams.set('mediaType', filters.mediaType);
        if (filters.reviewer) searchParams.set('reviewer', filters.reviewer);
        
        goto(`?${searchParams.toString()}`, { replaceState: true });
    }

    // Function to calculate media type statistics for client-side filtering
    function calculateMediaTypeStats(mediaItems) {
        const typeCounts = {};
        const typeRatings = {};
        
        mediaItems.forEach(item => {
            if (!typeCounts[item.mediaType]) {
                typeCounts[item.mediaType] = 0;
                typeRatings[item.mediaType] = 0;
            }
            typeCounts[item.mediaType]++;
            typeRatings[item.mediaType] += item.rating;
        });
        
        return Object.keys(typeCounts).map(mediaType => ({
            mediaType,
            count: typeCounts[mediaType],
            avgRating: parseFloat((typeRatings[mediaType] / typeCounts[mediaType]).toFixed(1))
        }));
    }

    //calculate the maximum count for bar scaling
    $: maxCount = Math.max(...sortedMediaTypeStats.map(stat => stat.count), 1);
    
    function toggleSort(field) {
        if (sortBy === field) {
            sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        } else {
            sortBy = field;
            sortOrder = 'desc';
        }
    }

    //color based on media type
    function getMediaTypeColor(mediaType) {
        switch(mediaType.toLowerCase()) {
            case 'movie': return 'bg-blue-500';
            case 'tv': return 'bg-purple-500';
            case 'game': return 'bg-green-500';
            case 'book': return 'bg-amber-500';
            default: return 'bg-gray-500';
        }
    }

    // format media type for display
    function formatMediaType(mediaType) {
        switch(mediaType.toLowerCase()) {
            case 'tv': return 'TV Shows';
            case 'movie': return 'Movies';
            case 'game': return 'Games';
            case 'book': return 'Books';
            default: return mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
        }
    }
</script>

<div class="min-h-screen bg-[#1a202e] text-white">
    <div class="max-w-7xl mx-auto p-8">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-10">
            <div class="flex items-center justify-center">
                <svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="7" height="18" rx="1" fill="#4ADE80" />
                    <rect x="12" y="8" width="7" height="13" rx="1" fill="#3B82F6" />
                    <rect x="21" y="5" width="0" height="16" rx="1" fill="#F472B6" />
                </svg>
            </div>
            <h1 class="text-3xl font-bold tracking-tight">Media Stats</h1>
        </div>

        <!-- Media Type -->
        <div class="bg-[#232939] rounded-xl p-6 mb-8 border border-[#2e3446]">
            <h2 class="text-xl font-semibold mb-4">Reviews by Media Type</h2>
            
            <!-- Sort Controls -->
            <div class="flex gap-4 mb-4">
                <button 
                    class={`px-3 py-1 rounded text-sm ${sortBy === 'count' ? 'bg-blue-600' : 'bg-[#2a3042]'}`}
                    on:click={() => toggleSort('count')}
                >
                    Sort by Count {#if sortBy === 'count'}{sortOrder === 'desc' ? '↓' : '↑'}{/if}
                </button>
                <button 
                    class={`px-3 py-1 rounded text-sm ${sortBy === 'avgRating' ? 'bg-blue-600' : 'bg-[#2a3042]'}`}
                    on:click={() => toggleSort('avgRating')}
                >
                    Sort by Rating {#if sortBy === 'avgRating'}{sortOrder === 'desc' ? '↓' : '↑'}{/if}
                </button>
            </div>
            
            <!-- Media Type Stats  -->
            <div class="space-y-3">
                {#each sortedMediaTypeStats as stat}
                    <div class="flex items-center">
                        <div class="w-28 text-sm font-medium">{formatMediaType(stat.mediaType)}</div>
                        <div class="flex-1 h-8 bg-[#1a202e] rounded overflow-hidden flex items-center">
                            <div 
                                class={`h-full ${getMediaTypeColor(stat.mediaType)} flex items-center`}
                                style={`width: ${Math.max((stat.count / maxCount) * 100, 5)}%`}
                            >
                                <span class="px-2 text-xs font-medium">{stat.count} reviews</span>
                            </div>
                        </div>
                        <div class="w-16 text-right text-sm">
                            <span class="font-medium">{stat.avgRating}</span>
                            <span class="text-gray-400 text-xs"> avg</span>
                        </div>
                    </div>
                {/each}
                
                {#if sortedMediaTypeStats.length === 0}
                    <div class="text-center py-4 text-gray-400">No data available</div>
                {/if}
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-[#232939] rounded-xl p-6 mb-8 border border-[#2e3446]">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Review Year -->
                <div>
                    <label for="review-year-select" class="block text-sm font-medium text-gray-300 mb-2">Review Year</label>
                    <div class="relative">
                        <select 
                            id="review-year-select" 
                            bind:value={filters.reviewYear} 
                            on:change={applyFilters}
                            class="w-full rounded-md bg-[#1a202e] border border-[#2e3446] py-2 px-3 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All</option>
                            {#each reviewYears as year}
                                <option value={year}>{year}</option>
                            {/each}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Release Year -->
                <div>
                    <label for="release-year-select" class="block text-sm font-medium text-gray-300 mb-2">Release Year</label>
                    <div class="relative">
                        <select 
                            id="release-year-select" 
                            bind:value={filters.releaseYear} 
                            on:change={applyFilters}
                            class="w-full rounded-md bg-[#1a202e] border border-[#2e3446] py-2 px-3 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All</option>
                            {#each releaseYears as year}
                                <option value={year}>{year}</option>
                            {/each}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Media Type -->
                <div>
                    <label for="media-type-select" class="block text-sm font-medium text-gray-300 mb-2">Media Type</label>
                    <div class="relative">
                        <select 
                            id="media-type-select" 
                            bind:value={filters.mediaType} 
                            on:change={applyFilters}
                            class="w-full rounded-md bg-[#1a202e] border border-[#2e3446] py-2 px-3 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All</option>
                            {#each mediaTypes as type}
                                <option value={type}>{formatMediaType(type)}</option>
                            {/each}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Reviewer -->
                <div>
                    <label for="reviewer-select" class="block text-sm font-medium text-gray-300 mb-2">Reviewer</label>
                    <div class="relative">
                        <select 
                            id="reviewer-select" 
                            bind:value={filters.reviewer} 
                            on:change={applyFilters}
                            class="w-full rounded-md bg-[#1a202e] border border-[#2e3446] py-2 px-3 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All</option>
                            {#each reviewers as r}
                                <option value={r}>{r}</option>
                            {/each}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="rounded-xl overflow-hidden border border-[#2e3446]">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-[#2a3042] uppercase text-xs font-semibold tracking-wider">
                        <th class="px-6 py-4 text-left">Title</th>
                        <th class="px-6 py-4 text-left">Release Year</th>
                        <th class="px-6 py-4 text-left">Review Year</th>
                        <th class="px-6 py-4 text-left">Media Type</th>
                        <th class="px-6 py-4 text-left">Reviewer</th>
                        <th class="px-6 py-4 text-left">Rating</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[#2e3446]">
                    {#if filteredMedia.length > 0}
                        {#each filteredMedia as media}
                            <tr class="hover:bg-[#232939]">
                                <td class="px-6 py-4 font-medium">{media.title}</td>
                                <td class="px-6 py-4">{media.releaseYear}</td>
                                <td class="px-6 py-4">{media.reviewYear}</td>
                                <td class="px-6 py-4">
                                    <span class={`px-2 py-1 rounded-full text-xs font-medium ${getMediaTypeColor(media.mediaType)} bg-opacity-20 border border-opacity-30 ${getMediaTypeColor(media.mediaType).replace('bg-', 'border-')}`}>
                                        {formatMediaType(media.mediaType)}
                                    </span>
                                </td>
                                <td class="px-6 py-4">{media.reviewer}</td>
                                <td class="px-6 py-4 font-semibold">{media.rating}</td>
                            </tr>
                        {/each}
                    {:else}
                        <tr>
                            <td colspan="6" class="px-6 py-10 text-center text-gray-400">No results found.</td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>
    </div>
</div>