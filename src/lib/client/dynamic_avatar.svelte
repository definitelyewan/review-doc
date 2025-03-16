<script>
    import { Avatar } from '@skeletonlabs/skeleton';


    export let user_initals;
    export let user_colour;
    export let user_image;
    export let width;
    export let user_id;

    // init variables in case they are left blank

    // console.log("user_initals: ", user_initals);
    // console.log("user_colour: ", user_colour);
    // console.log("user_image: ", user_image);
    // console.log("width: ", width);
    // console.log("user_id: ", user_id);


    if (!user_initals) {
        user_initals = '??';
    }

    if (!user_colour) {
        user_colour = '000000';
    }

    if (!user_image || !user_id) {
        user_image = null;
    }

    if (!width) {
        width = 'w-12';
    }


</script>



{#if user_image == null}
    <Avatar
        width="{width}"
        initials={user_initals}
        style={`background-color: #${user_colour};}`}
    />
{:else}
    <Avatar
        width="{width}"
        style="background-image: url('/api/user/{user_id}/image'); background-size: cover; background-position: center;"
    />
{/if}

