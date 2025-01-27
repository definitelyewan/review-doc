<script>
	import { ProgressRadial } from '@skeletonlabs/skeleton';
    export let score;
    export let width;
</script>


{#if score == 0}
    <ProgressRadial class="mx-auto md:mx-0" width="{width}" meter="stroke-red-500" track="stroke-red-500/30" strokeLinecap="round" value={100}>💀</ProgressRadial>
{:else if score <= 2}
    <ProgressRadial class="mx-auto md:mx-0" width="{width}" meter="stroke-orange-500" track="stroke-orange-500/30" strokeLinecap="round" value={score * 10}>{score} / 10</ProgressRadial>
{:else if score <= 4}
    <ProgressRadial class="mx-auto md:mx-0" width="{width}" meter="stroke-yellow-500" track="stroke-yellow-500/30" strokeLinecap="round" value={score * 10}>{score} / 10</ProgressRadial>
{:else if score <= 6}
<ProgressRadial class="mx-auto md:mx-0" width="{width}" meter="stroke-green-500" track="stroke-green-500/30" strokeLinecap="round" value={score * 10}>{score} / 10</ProgressRadial>
{:else if score <= 8}
<ProgressRadial class="mx-auto md:mx-0" width="{width}" meter="stroke-blue-500" track="stroke-blue-500/30" strokeLinecap="round" value={score * 10}>{score} / 10</ProgressRadial>
{:else if score <= 10}
<ProgressRadial class="mx-auto md:mx-0" width="{width}" meter="stroke-purple-500" track="stroke-purple-500/30" strokeLinecap="round" value={score * 10}>{score} / 10</ProgressRadial>
{/if}