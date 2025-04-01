<script>
    import ReviewRadial from '$lib/client/review_radial.svelte';
    import corr from '$lib/client/corrections.js';
    import { page } from '$app/stores';
    import DynamicAvatar from '$lib/client/dynamic_avatar.svelte';

    export let users = [];
    export let review = {};
    export let media_type;
    export let form;

    let media_data = $page.data.media_data;
    let media_id = media_data.media_id;
    let reviewInfo = media_data.reviewInfo;

    const reviewCheck = reviewInfo.find(iter => iter.review_id === review.review_id);
    const reviewIndex = reviewInfo.findIndex(iter => iter.review_id === review.review_id);

    // Count only interactions where interaction_comment is NOT null
    const interactionCount = reviewCheck
        ? reviewCheck.interactions.filter(comment => comment.interaction_comment !== null).length
        : 0;

    // Initialize with values from reviewInfo
    let reviewIsLiked = reviewInfo[reviewIndex].isLiked === 2; // can convert to boolean for easier comparison
    let reviewLikeCount = reviewInfo[reviewIndex].likeCount || 0; // default to 0 if undefined

    //  log initial values
    console.log("Initial reviewIsLiked:", reviewIsLiked);
    console.log("Initial reviewLikeCount:", reviewLikeCount);

    let interactions = [];
    reviewInfo.forEach(review => {
        review.interactions.forEach(interaction => {
            interactions.push(interaction);
        });
    });
    
    // Comment system state
    let showComments = false;
    let commentText = '';
    let comments = review.comments || [];
    
    function toggleComments() {
        showComments = !showComments;
    }
    
    async function addComment() {
        if (!commentText.trim()) return;
        console.log(`Adding comment: ${commentText}`);
    }
    
    function deleteComment(commentId) {
        comments = comments.filter(comment => comment.id !== commentId);
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

	function user_id_index_to_user_name(user_id_index) {
		return users[user_id_index].user_name;
	}

    function user_id_index_to_user_initials(user_id_index) {
		return users[user_id_index].user_icon_text;
	}

    function user_id_index_to_user_colour(user_id_index) {
		return users[user_id_index].user_icon_colour;
	}

    function user_id_index_to_user_pfp(user_id_index) {
		return users[user_id_index].user_profile_path;
	}
    
    // Find user in users array by ID
    function findUserById(userId) {
        return users.find(user => user.user_id === userId);
    }

    // Manual toggle function for immediate UI update
    function toggleLike(event) {
        event.preventDefault();
        
        if (!$page.data.user) {
            alert('Please log in to like reviews');
            return;
        }
        
        // Toggle like state immediately for UI
        reviewIsLiked = !reviewIsLiked;
        reviewLikeCount = reviewIsLiked ? reviewLikeCount + 1 : Math.max(0, reviewLikeCount - 1);
        
        // Log the updated state
        console.log("After toggle - reviewIsLiked:", reviewIsLiked);
        console.log("After toggle - reviewLikeCount:", reviewLikeCount);
        
        // Submit the form
        const formData = new FormData();
        formData.append('review_id', review.review_id);
        formData.append('action', reviewIsLiked ? 'like' : 'unlike');
        
        fetch(`/media/${media_id}?/toggleLike`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.success) {
                console.log("Server response:", data);
                reviewIsLiked = data.isLiked === 2;
                reviewLikeCount = data.likeCount || 0;
            }
        })
        .catch(error => {
            console.error("Error toggling like:", error);
        });
    }
</script>

<div class="card w-full max-w-full ml-2 mr-2 mb-2 p-2 inline-block">
    <!-- Avatar and user info section -->
    <div class="flex items-center mb-2">
        <DynamicAvatar
            user_id={review.user_id}
            user_image={user_id_index_to_user_pfp(
                users.findIndex((item) => item['user_id'] === review.user_id)
            )}
            user_initals={user_id_index_to_user_initials(
                users.findIndex((item) => item['user_id'] === review.user_id)
            )}
            user_colour={user_id_index_to_user_colour(
                users.findIndex((item) => item['user_id'] === review.user_id)
            )}
            width="w-12"
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

    <!-- Review content section -->
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
                {#if bullet.length > 0}
                    <li class="ml-4">{bullet}</li>
                {/if}
            {/each}
        </ul>
    </div>
    
    <div class="space-y-4">
        <hr class="hr border-t-8" />
    </div>
    
    <!-- Like Button -->
    <div class="flex items-center justify-start ml-4 mt-2">
        <form on:submit|preventDefault={toggleLike} class="flex items-center gap-2">
            <input type="hidden" name="review_id" value="{review.review_id}" />
            <button type="submit" class="flex items-center justify-center p-2 rounded-lg">
                <span class="text-3xl {reviewIsLiked ? 'text-red-500' : 'text-surface-700 hover:text-red-400'}">
                    {reviewIsLiked ? '♥' : '♡'}
                </span>
            </button>
            <span class="text-white font-semibold">
                {reviewLikeCount} {reviewLikeCount === 1 || reviewLikeCount === 0? 'Like' : 'Likes'}
            </span>
        </form>
    </div>
    
    {#if review.review_platform != null}
        <div class="flex items-center mt-2">
            <p class="text-sm">Experienced on/in {review.review_platform}</p>
            <img alt="." src="../{corr.platform_to_svg_name(review.review_platform)}" class="w-6 h-6 ml-2" />
        </div>
    {/if}
    
    <!-- Comments Section -->
    <div class="mt-4">
        <button 
            class="p-2 bg-surface-100 hover:bg-surface-200 text-slate-900 rounded-lg w-full flex items-center justify-center"
            on:click={toggleComments}
        >
            <span>{showComments ? 'Hide Comments' : 'Show Comments'}</span>
            <span class="ml-2 badge variant-filled">{interactionCount}</span>
        </button>
        
        {#if showComments}
            <div class="mt-2 card p-4 bg-surface-100-800-token">
                <!-- Comment Form -->
                {#if $page.data.user}
                <div class="flex flex-col mb-4">
                    <form action="/../../media/{media_id}?/addComment" method="POST" >
                        <textarea
                            class="input w-full rounded-sm p-2 mb-2"
                            rows="2"
                            name="commentText"
                            bind:value={commentText}
                            placeholder="Add a comment..."
                        ></textarea>
                        <input type="hidden" name="review_id" value={review.review_id} />
                        <button 
                            class="self-end p-2 text-white rounded-lg 
                                {commentText.trim() ? 'bg-primary-500 hover:bg-primary-600' : 'bg-gray-400 cursor-not-allowed'}"
                            on:click={() => window.location.href = `/media/${media_id}/?review=${review.review_id}`}
                            disabled={!commentText.trim()}
                        >
                            Post Comment
                        </button>
                    </form>
                </div>
                {:else}
                    <p class="text-center p-2 mb-2">Please log in to comment</p>
                {/if}
                
                <!-- Comments List -->
                <div class="space-y-3 mt-2">
                    {#if interactionCount}
                    {#each reviewInfo[reviewIndex].interactions.filter(comment => comment.interaction_comment) as comment}
                            <div class="p-3 bg-surface-200-700-token rounded-lg">
                                <div class="flex justify-between items-start">
                                    <div class="flex items-center">
                                        <DynamicAvatar
                                            user_id={comment.interaction_user_id}
                                            width="w-12"
                                            user_initals={comment.user_icon_text}
                                            user_colour={comment.user_icon_colour}
                                            user_image={comment.user_profile_path}

                                        />
                                        <span class="ml-2 font-semibold">{comment.user_name}</span>
                                    </div>
                                    {#if $page.data.user && comment.interaction_user_id === $page.data.user.id}
                                    <form action="/../../media/{media_id}?/deleteComment" method="POST">
                                        <input type="hidden" name="interaction_id" value={comment.interaction_id} />
                                        <button 
                                            type="submit"
                                            class="text-error-500 hover:text-error-600 p-1"
                                        >
                                            Delete
                                        </button>
                                    </form>
                                    {/if}
                                </div>
                                <p class="mt-2">{comment.interaction_comment}</p>
                            </div>
                        {/each}
                    {:else}
                        <p class="text-center text-surface-400-500-token">No comments yet. Be the first to comment!</p>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>