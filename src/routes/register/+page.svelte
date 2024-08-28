<script>

    export let form;

</script>
  

  
<div class="flex justify-center items-center p-2">
    <div class="card p-6 shadow-lg rounded-lg w-full max-w-md">
        <h1 class="p-2 text-2xl font-bold text-center">Register</h1>
        <form action="?/register" method="POST">
        <div class="p-2">
            <label for="username">Username</label>
            <input id="username" name="username" type="text" required class="input" />
        </div>

        <div class="p-2">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required class="input" />
        </div>

        <div class="p-2">
            {#if form?.user_exists}
                <p class="text-error-500 mt-2">Username is taken.</p>
            {/if}
            {#if form?.user_fail_reg_closed}
                <p class="text-error-500 mt-2">Registration is closed.</p>
            {/if}
        </div>

            <button type="submit" class="btn mt-2 mb-2 ml-2 variant-filled">Register</button>
        </form>
    </div>
</div>
  