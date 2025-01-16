<!-- Frontend code for media/[id] to work-->
<script>
	export let data;
	export let form;
	import { page } from '$app/stores';
	import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
	import { TabGroup, Tab} from '@skeletonlabs/skeleton';
	import { TreeView, TreeViewItem} from '@skeletonlabs/skeleton';
	import { Avatar } from '@skeletonlabs/skeleton';
	import { enhance } from '$app/forms';
    import { Autocomplete } from '@skeletonlabs/skeleton';
    import { popup } from '@skeletonlabs/skeleton';
    import { storePopup } from '@skeletonlabs/skeleton';
    import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';

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


	// user panel section
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
    let popup_settings = {
        event: 'focus-click',
        target: 'popupAutocomplete',
        placement: 'bottom',
    };

	let search_val = '';

	/**
	 * reviews
	 */

	let review_radio = 0;
	let review_id = null;
	let review_score = 0;
	let review_bullets = '';
	let review_sub_name = '';
	let review_platform = '';
	const user_reviews = data.user_reviews;


	function init_review_values() {

		search_val = '';

		review_radio = 0;
		review_score = 0;
		review_id = null;
		review_bullets = '';
		review_sub_name = '';
		review_platform = '';
	}

	function modify_on_popup_select(event){
		search_val = event.detail.label;

		let edit_values = event.detail.value;

		review_id = edit_values.review_id;
		review_score = parseInt(edit_values.review_score);
		review_bullets = edit_values.review_bullets.join('\n');
		review_sub_name = edit_values.review_sub_name;
		review_platform = edit_values.review_platform;

	}


	$: modify_filtered_options = user_reviews
        .filter(option => option.label.toLowerCase().includes(search_val.toLowerCase()))
        .slice(0, 10);


	/**
	 * awards
	 */

	let award_radio = 0;
	let award_name = '';
	let award_id = null;
	const user_awards = data.user_awards;



</script>

<title>Review Doc - {media_name}</title>
<meta property="og:image" content="/api/media/image/{media_id}/cover" />

{#if $page.data.user}
	<div class="mt-2 ml-2 mr-2 card relative max-w-full">
		<TreeView indent="" width="w-full">
			<TreeViewItem>
				User Panel
				<svelte:fragment slot="children">
					<TreeViewItem>
						Review
						<svelte:fragment slot="children">
							<div class="relative w-full p-2">
								<div class="justify-center">
									<RadioGroup display="flex">
										<RadioItem bind:group={review_radio} on:click={() => {init_review_values()}} name="justify" value={0}>Review</RadioItem>
										<RadioItem bind:group={review_radio} on:click={() => {init_review_values()}} name="justify" value={1}>Modify</RadioItem>
									</RadioGroup>

									{#if review_radio === 1}
										<div class="relative w-full">
											<input
												class="input autocomplete mt-2 z-1 w-full"
												type="search"
												name="autocomplete-search"
												bind:value={search_val}
												placeholder="Search..."
												use:popup={popup_settings}
											/>
											<div data-popup="popupAutocomplete" class="absolute top-0 left-0 right-0 z-50 rounded-lg p-4 shadow-lg bg-surface-700 w-full">
												<Autocomplete
													bind:input={search_val}
													options={modify_filtered_options}
													on:selection={modify_on_popup_select}
												/>
											</div>
										</div>
									{/if}


									<div class="flex flex-wrap items-center justify-center mt-2">
										{#each {length : 11} as _, i}
											<button type="button" on:click={() => review_score = i} class="p-1">
												<Avatar
													border="border-4 {review_score === i ? 'border-primary-500' : 'border-surface-300-600-token hover:!border-primary-500'}"
													initials={i === 0 ? "💀" : i.toString()}
													cursor="cursor-pointer"
													width="w-12"/>
											</button>
										{/each}
									</div>
									<p class="text-2xl p-2">Review Bullets</p>
									<div class="items-center justify-center p-2">
										<textarea
											class="input w-full rounded-sm p-1"
											rows="8"
											bind:value={review_bullets}
											on:input={(e) => review_bullets = e.target.value}
											placeholder="review content..."
										></textarea>
										<p class="text-sm"><i>Each new line(use of the enter key) will be treated as a bullet point.</i></p>
									</div>
									<p class="text-2xl p-2">Version or Season</p>
									<div class="items-center justify-center p-2">
										<textarea
											class="input w-full rounded-sm p-1"
											rows="1"
											bind:value={review_sub_name}
											on:input={(e) => review_sub_name = e.target.value}
											placeholder="What version/season is this for?"
										></textarea>
										<p class="text-sm"><i>Tv shows must match the following format to be cataloged correctly. If a review is for season 1 only enter the number 1 in this box, if it is for multiple seasons like season 1 through 3 please enter it like so "1 2 3" with a space between each number. Otherwise, anything can be put here like "Remastered" for a game or or "2005 DVD" for a movie.</i></p>
									</div>
									<p class="text-2xl p-2">Platform</p>
									<div class="items-center justify-center p-2">
										<textarea
											class="input w-full rounded-sm p-1"
											rows="1"
											bind:value={review_platform}
											on:input={(e) => review_platform = e.target.value}
											placeholder="Where did you watch/play this?"
										></textarea>
										<p class="text-sm"><i>Where you watched or played this media. For example, "Steam" could be could be where you played Bioshock or Disney+ could be where you watched Andor</i></p>
									</div>
								</div>


								{#if review_radio === 0}
									<div class="items-center justify-center">
										<form class="review" action="?/add_review" method="POST" use:enhance >
											<input type="hidden" name="review_score" value={review_score} />
											<input type="hidden" name="review_bullets" value={review_bullets} />
											<input type="hidden" name="media_id" value={media_id} />
											<input type="hidden" name="review_sub_name" value={review_sub_name} />
											<input type="hidden" name="review_platform" value={review_platform} />
											<input type="hidden" name="type" value={"review"} />
											<button class="p-2 mt-2 mb-2 w-full bg-surface-100 hover:bg-surface-200 text-slate-900 rounded-xl">
												<span class="text-md p-2">Review</span>
											</button>
										</form>
									</div>
									{#if form?.success === true}
										<p class="text-center text-success-500">Review has been added!</p>
									{:else if form?.success === false}
										<p class="text-center text-error-500">Review failed! because {form.message}</p>
							
									{/if}
								{:else if review_radio === 1 && search_val != ''}
									<div class="items-center justify-center ">
										<form action="?/update_review" method="POST" use:enhance on:submit|preventDefault >
											<input type="hidden" name="review_score" value={review_score} />
											<input type="hidden" name="review_bullets" value={review_bullets} />
											<input type="hidden" name="review_id" value={review_id} />
											<input type="hidden" name="review_sub_name" value={review_sub_name} />
											<input type="hidden" name="review_platform" value={review_platform} />
											<button class="p-2 mt-2 mb-2 w-full bg-surface-100 hover:bg-surface-200 text-slate-900 rounded-xl">
												<span class="text-md p-2">Update Review</span>
											</button>
										</form>
										<form class="delete_review" action="?/delete_review" method="POST" use:enhance on:submit|preventDefault>
											<input type="hidden" name="review_id" value={review_id} />
											<button class="p-2 mt-2 mb-2 w-full bg-surface-100 hover:bg-surface-200 text-slate-900 rounded-xl">
												<span class="text-md p-2">Delete Review</span>
											</button>
										</form>
										{#if form?.success === true}
											<p class="text-center text-success-500">Review has been updated!</p>
										{:else if form?.success === false}
											<p class="text-center text-error-500">Review failed to update! because {form.message}</p>
								
										{/if}
									</div>
								{/if}
							</div>
						</svelte:fragment>
					</TreeViewItem>
					<TreeViewItem>
						Award
						<svelte:fragment slot="children">
							<div class="relative w-full p-2">
								<div class="justify-center">
									<RadioGroup display="flex">
										<RadioItem bind:group={award_radio} on:click={() => {}} name="justify" value={0}>Nominate</RadioItem>
										<RadioItem bind:group={award_radio} on:click={() => {}} name="justify" value={1}>Award</RadioItem>
									</RadioGroup>
									
								
									{#if award_radio === 0}
										<div class="flex flex-wrap items-center justify-center mt-2 mb-2 mr-2 ml-2">
											{#if media_type === 'game'}
												<button type="button" on:click={() => award_name = 'Game of the Year'} class="p-1">
													<span class="badge variant-filled p-2">Game of the Year</span>
												</button>
											{/if}
											{#if media_type === 'movie'}
												<button type="button" on:click={() => award_name = 'Movie of the Year'} class="p-1">
													<span class="badge variant-filled p-2">Movie of the Year</span>
												</button>
											{/if}
											{#if media_type === 'tv'}
												<button type="button" on:click={() => award_name = 'Show of the Year'} class="p-1">
													<span class="badge variant-filled p-2">Show of the Year</span>
												</button>
											{/if}
								
											<button type="button" on:click={() => award_name = 'Story of the Year'} class="p-1">
												<span class="badge variant-filled p-2">Story of the Year</span>
											</button>
											<button type="button" on:click={() => award_name = 'Cinematography of the Year'} class="p-1">
												<span class="badge variant-filled p-2">Cinematography of the Year</span>
											</button>
											<button type="button" on:click={() => award_name = 'Best Animation of the Year'} class="p-1">
												<span class="badge variant-filled p-2">Best Animation of the Year</span>
											</button>
											<button type="button" on:click={() => award_name = 'Best of the Year'} class="p-1">
												<span class="badge variant-filled p-2">Best of the Year</span>
											</button>
										</div>

										<p class="text-sm p-2"><i>Select a single award to nominate then click the nominate button. If it is already nominated it will be removed from the nominations on submit. The current nomination is for <span class="text-success-200 "><b>{award_name}</b></span></i></p>
										<div class="p-2">

											{#if user_awards.length === 0}
												<p>{media_name} has not been nominated for any awards yet, maybe it will one day</p>
											{:else}
												<p>{media_name} is currently nominated for the below awards:</p>
												<ul class="list-disc ml-0 mt-2 md:mt-0">
													{#each user_awards as award}
														<li class="ml-4">{award.label}</li>
													{/each}
												</ul>
											{/if}
										</div>
										<div class="items-center justify-center ">
											<form action="?/nominate_media" method="POST" use:enhance on:submit|preventDefault class="flex justify-center items-center">
												<input type="hidden" name="award_name" value={award_name} />
												<input type="hidden" name="media_id" value={media_id} />
												<button class="p-2 mt-2 mb-2 w-full bg-surface-100 hover:bg-surface-200 text-slate-900 rounded-xl">Nominate</button>
											</form>
										</div>

									
									{:else if award_radio === 1}
										<p class="p-2">Click the below nominations to toggle its award status. A nomination will become an Award if nominated an award will become a nomination.</p>
										<div class="flex flex-wrap items-center justify-center mt-2 mb-2 mr-2 ml-2">
											{#each user_awards as award}
												<form action="?/grant_award" method="POST" use:enhance on:submit|preventDefault class="flex justify-center items-center">
													<input type="hidden" name="award_id" value={award.value.award_id} />
													<button class="p-2 mt-2 mb-2 w-full bg-surface-100 hover:bg-surface-200 text-slate-900 rounded-xl">{award.label}</button>
												</form>
											{/each}
										</div>

									
									{/if}

									{#if form?.success === true}
										<p class="text-center text-success-500">Award Success!</p>
									{:else if form?.success === false}
										<p class="text-center text-error-500">Award failed to update! because {form.message}</p>
									{/if}
								</div>
							</div>
						</svelte:fragment>
					</TreeViewItem>
				</svelte:fragment>
			</TreeViewItem>
		</TreeView>
	</div>
{/if}


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
