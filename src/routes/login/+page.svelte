<!-- login frontend-->
<script>
    export let data;
    export let form;

    const can_register = data.can_register;

</script>

<title>Review Doc - Login</title>

  
<div class="flex justify-center items-center p-2">
    <div class="card p-6 shadow-lg rounded-lg w-full max-w-md">
        <h1 class="p-2 text-2xl font-bold text-center">Login</h1>
        <form action="?/login" method="POST">
        <div class="p-2">
            <label for="username">Username</label>
            <input id="username" name="username" type="text" required class="input" />
        </div>

        <div class="p-2">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required class="input" />
        </div>

        <div class="p-2">
            {#if form?.invalid}
                <p class="text-error-500 mt-2">A username and passowrd are required.</p>
            {/if}
            {#if form?.credentials}
                <p class="text-error-500 mt-2">Your username, passowrd, or both are incorrect.</p>
            {/if}
        </div>
            <div class="flex">
                <button type="submit" class="btn mt-2 mb-2 ml-2 variant-filled">Login</button>
                {#if can_register === true}
                    <a href="../register">
                        <button class="btn mt-2 mb-2 ml-2 variant-filled">Sign Up?</button>
                    </a>
                {/if}
                
            </div>

        </form>
    </div>
</div>
  