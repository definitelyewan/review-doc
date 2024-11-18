<script>
	export let data;
	import { page } from '$app/stores';
	import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
	import { TabGroup, Tab} from '@skeletonlabs/skeleton';
	import ReviewRadial from '$lib/client/review_radial.svelte';
	import ReviewBox from '$lib/client/review_box.svelte';

	function get_avg_score_general(reviews) {
		let sum = 0;
		reviews.forEach((review) => {
			let n = parseInt(review.review_score);

			if (isNaN(n)) {
				n = 0;
			}

			sum += n;
		});

		return Math.floor(sum / reviews.length);
	}


	function get_avg_score_weighted(reviews) {
		let sum = 0;
		let total = 0;

		Object.keys(reviews).forEach((season) => {
			for (const review of reviews[season]) {
				let n = review.review_sub_name.split(' ').length * parseInt(review.review_score);
				total += review.review_sub_name.split(' ').length;
				sum += n;
			}
		});
		
		return Math.floor(sum / total);
	}


	function combine_stduios_distributors(studios, distributors) {
		let combined = [...studios, ...distributors];
		let unique_combined = [...new Set(combined)];
		return unique_combined;
	}

	const media_name = data.media_data.media.media_name;
	const media_release_string = `Released ${data.media_data.media.media_release_date_range_start}` + (data.media_data.media.media_release_date_range_end != null ? ` - ${data.media_data.media.media_release_date_range_end}` : '');
	const media_id = data.media_data.media.media_id;
	const media_type = data.media_data.media.media_type;
	const tags = data.media_data.tags;
	const awards = data.media_data.awards.sort((a, b) => a.award_issue_year - b.award_issue_year);
	const users = data.media_data.users;
	const unique_award_years = [...new Set(awards.map((award) => award.award_issue_year))];
	const directors = data.media_data.directors;
	let multiple_seasons_flag = false;
	let avg_score = 0;
	let tabSet = 0;
	let value = 0;
	let specific_review = null;
	const url_params = new URLSearchParams($page.url.search);
	
	/**
	 * DIFFERENT STRUCTURES
	 * movie, book, music, other
	 * - [] where each index is a review
	 * tv, web
	 * - ["season value" : [{}]
	 * 
	 */
	let reviews = [];
	
	specific_review = url_params.get('review');

	if (media_type == 'tv' || media_type == 'web') {
		reviews = data.media_data.reviews; // comes pre-sorted
		avg_score = get_avg_score_weighted(reviews);


		if (specific_review != null) {
			Object.keys(reviews).forEach((season) => {
				reviews[season] = reviews[season].filter((review) => {
					return String(review.review_id) === String(specific_review);
				});

				if (reviews[season].length > 0) {
					tabSet = season;
				} else {
					delete reviews[season];
				}
			});

		}


	} else {
		reviews = data.media_data.reviews.sort(
			(a, b) => new Date(b.review_date) - new Date(a.review_date)
		);
		
		avg_score = get_avg_score_general(reviews);

		if (specific_review != null) {

            reviews = reviews.filter((review) => {
                return String(review.review_id) === String(specific_review);
            });

		}
	}

	const makers = combine_stduios_distributors(
		data.media_data.studios,
		data.media_data.distributors
	);

</script>

<title>Review Doc - {media_name}</title>
<meta property="og:image" content="/api/media/image/{media_id}/cover" />

<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2 mr-2 ml-2 mb-2">
    <!-- First Card -->
    <div class="relative card p-2 shadow-lg rounded-lg flex items-center col-span-1 lg:col-span-2" style="min-width: 300px;">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-10 rounded-lg">
            <div class="absolute inset-0 bg-cover bg-center rounded-lg" style="background-image: url('/api/media/image/{media_id}/banner'); object-fit: cover;"></div>
        </div>
        <div class="relative flex flex-col md:flex-row items-start w-full">
            <div class="flex-shrink-0 w-64 md:w-1/5 mx-auto md:mx-0">
                <img
                    class="rounded-md w-full h-auto"
                    src="/api/media/image/{media_id}/cover"
                    alt={media_name}
                />
            </div>
            <div class="flex-1 mt-4 md:mt-0 md:ml-2 md:mr-2 w-full">
                <div class="grid-cols-1">
                    <!-- title -->
                    <h2 class="text-2xl md:text-4xl font-bold md:mt-0 text-center md:text-left">{media_name}</h2>
                    <p class="text-lg md:text-xl text-center md:text-left">{media_release_string}</p>
                    <!-- tags -->
                    <div class="flex flex-wrap">
                        {#each tags as tag}
                            <span class="badge variant-filled mt-2 mb-2 mr-1">{tag}</span>
                        {/each}
                    </div>
                    <!-- score -->
                    <div class="flex mt-2 mb-2 items-center justify-center md:items-center md:justify-start">
                        <ReviewRadial score={avg_score} width="w-40"/>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Container for Second and Third Cards -->
    <div class="flex flex-col gap-4 col-span-1 lg:col-span-1">
        <!-- Second Card -->
        <div class="relative card p-2 shadow-lg rounded-lg flex flex-col items-center justify-center lg:h-1/2">
            <div class="relative flex flex-col items-center justify-center w-full h-full">
                <RadioGroup display="flex" class="items-center justify-center">
					<RadioItem bind:group={value} name="justify" value={0}>Directors</RadioItem>
					<RadioItem bind:group={value} name="justify" value={1}>Studios</RadioItem>
				</RadioGroup>
				<div class="relative card mt-2 p-2 w-full h-full shadow-lg rounded-lg flex items-center justify-center mx-auto">
					<div class="flex flex-wrap">
						{#if value == 0}
							{#each directors as director}
								<span class="badge variant-filled mt-2 mb-2 mr-1">{director}</span>
							{/each}
						{:else if value == 1}
							{#each makers as maker}
								<span class="badge variant-filled mt-2 mb-2 mr-1">{maker}</span>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</div>
		<!-- Third Card -->
		<div
			class="relative card p-2 shadow-lg rounded-lg flex flex-col items-center justify-center text-center lg:h-1/2"
		>
			<div class="relative flex flex-col items-center justify-center w-full h-full">
				<h2 class="text-xl font-bold">Awards</h2>
				{#if unique_award_years.length == 0}
					<p class="mt-2">{media_name} has not won any awards yet, maybe it will one day</p>
				{:else}
					{#each unique_award_years as year}
						<p class="mt-2">Awards won in {unique_award_years[0]}</p>
						<div
							class="relative card mt-2 p-2 w-full h-full shadow-lg rounded-lg flex items-center justify-center mx-auto"
						>
							<div class="flex flex-wrap justify-center items-center">
								{#each awards as award}
									{#if award.award_issue_year == year}
										<span class="badge variant-filled mt-2 mb-2 mr-1">{award.award_name}</span>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<div class="mt-2 mb-2">
    <div class="relative card mx-2 my-2 p-2 max-w-full shadow-lg rounded-lg flex flex-col items-center flex-grow-0">
        <p class="text-3xl">Reviews</p>
        {#if specific_review != null}
            <div class="mt-2 mb-2 mr-2 ml-2">
                <button type="button" class="flex flex-col btn items-center variant-filled h-6" on:click={() => window.location.href = `/media/${media_id}`}>
                    <p class="text-xl">Show Other Reviews</p>
				</button>
            </div>
        {/if}	
    </div>
</div>

{#if media_type == 'tv'}

    <div class="mr-2 ml-2">
		<TabGroup justify="justify-center">
			{#each Object.keys(reviews) as season}
				{#if isNaN(season) === false}
					<Tab bind:group={tabSet} name={season} value={season}>
						<span class="badge variant-filled mt-2 mb-2 mr-1">Season {season}</span>
					</Tab>
				{:else if isNaN(season) === true && !multiple_seasons_flag}
					<Tab bind:group={tabSet} name={"multi"} value={"multi"}>
						<span class="badge variant-filled mt-2 mb-2 mr-1">Multi-Season Reviews</span>
					</Tab>
					<script>
						$: multiple_seasons_flag = true;
					</script>
				{/if}
			{/each}
		
			<svelte:fragment slot="panel">
				{#each Object.keys(reviews) as season}
					{#if isNaN(season) === false && tabSet === season}
						{#each reviews[season] as review}
							<div class="flex justify-center">
								<ReviewBox users={users} review={review} media_type={media_type}/>
							</div>
						{/each}
					{:else if isNaN(season) === true && tabSet === "multi"}
						{#each reviews[season] as review}
							<div class="flex justify-center">
								<ReviewBox users={users} review={review} media_type={media_type}/>
							</div>
						{/each}
					{/if}
				{/each}
			</svelte:fragment>
		</TabGroup>
    </div>

{:else if media_type == 'web'}
<div class="mr-2 ml-2">

	{#if Array.from(new Set(Object.keys(reviews))).length > 1}

		<TabGroup justify="justify-center">
			{#each Object.keys(reviews) as season}
				{#if season.includes('|') === false}
					<Tab bind:group={tabSet} name={season} value={season}>
						<span class="badge variant-filled mt-2 mb-2 mr-1">{season}</span>
					</Tab>
				{:else if season.includes('|') === true && !multiple_seasons_flag}
					<Tab bind:group={tabSet} name={"multi"} value={"multi"}>
						<span class="badge variant-filled mt-2 mb-2 mr-1">Multi-Part Reviews</span>
					</Tab>
					<script>
						$: multiple_seasons_flag = true;
					</script>
				{/if}
			{/each}
		
			<svelte:fragment slot="panel">
				{#each Object.keys(reviews) as season}
					{#if season.includes('|') === false && tabSet === season}
						{#each reviews[season] as review}
							<div class="flex justify-center">
								<ReviewBox users={users} review={review} media_type={media_type}/>
							</div>
						{/each}
					{:else if season.includes('|') === true && tabSet === "multi"}
						{#each reviews[season] as review}
							<div class="flex justify-center">
								<ReviewBox users={users} review={review} media_type={media_type}/>
							</div>
						{/each}
					{/if}
				{/each}
			</svelte:fragment>
		</TabGroup>
	{:else}
		{#each Object.keys(reviews) as season}
			{#each reviews[season] as review}
				<div class="flex justify-center">
					<ReviewBox users={users} review={review} media_type={media_type}/>
				</div>
			{/each}
		{/each}
	{/if}

</div>
{:else}

	{#each reviews as review}
		<div class="flex justify-center">
			<ReviewBox users={users} review={review} media_type={media_type}/>
		</div>
	{/each}

{/if}
