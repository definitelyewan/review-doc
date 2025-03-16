<script>
    export let data;
    export let form;
    import DynamicAvatar from '$lib/client/dynamic_avatar.svelte';
    

    const user_name = data.settings.user_name;   
    const user_id = data.settings.user_id;
    const user_initials = data.settings.user_icon_text;
    const user_icon_colour = data.settings.user_icon_colour;
    const user_profile_path = data.settings.user_profile_path;
    

    function confirmSubmission(event) {
        if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            event.preventDefault();
        }
    }

    async function handleSaveSettings(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        try {
        const response = await fetch(form.action, {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            alert("Settings updated successfully!");
            location.reload(); // Trigger page reload
        } else {
            const { error } = await response.json();
            console.error("Error saving settings:", error);
            alert("Failed to update settings.");
        }
        } catch (error) {
        console.error("Error saving settings:", error);
        alert("An error occurred while saving settings.");
        }
    }

</script>

<title>Review Doc - Settings</title>

<div class="p-2">
    <div class="flex">
        <DynamicAvatar
            width="w-12 md:w-16"
            user_initals="{user_initials}"
            user_colour="{user_icon_colour}"
            user_id="{user_id}"
            user_image="{user_profile_path}"
        />
        <h1 class="py-2 ml-2 md:text-4xl text-2xl font-bold">{user_name}'s Settings</h1>
    </div>
    <div class="mt-2">
        <hr class="hr border-t-8" />
    </div>
</div>

<div class="container mx-auto px-4 lg:px-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!--Change password-->
    <div class="card p-6 md:p-8 shadow-lg rounded-lg w-full min-h-[250px] flex flex-col justify-between">

        <h2 class="text-xl md:text-2xl font-bold">Change Password</h2>
        <i class="text-gray-400">Enter your new password twice to change it. Once changed you will be logged out on all devices.</i>
        <form action="?/changePassword" method="POST">
    
            <div class="flex flex-wrap items-center">
                <!-- New Password -->
                <div class="mt-1">
                    <label for="newPassword">New Password</label>
                    <input id="newPassword" name="newPassword" type="password" required class="input" />
                </div>
                <!-- Confirm New Password -->
                <div class="mt-1">
                    <label for="confirmPassword">Confirm New Password</label>
                    <input id="confirmPassword" name="confirmPassword" type="password" required class="input" />
                </div>
            </div>
            <div class="flex flex-wrap items-center">
                <div class="mt-2">
                    <button type="submit" class="btn h-8 variant-filled">Change Password</button>
                </div>
                <!-- Error Messages -->
                <div class="p-2">
                    {#if form?.password_mismatch}
                        <p class="text-error-500 mt-2">Passwords do not match.</p>
                    {/if}
                </div>
            </div>
    
        </form>


    </div>
    <!--Change username-->
    <div class="card p-6 md:p-8 shadow-lg rounded-lg w-full min-h-[250px] flex flex-col justify-between">
        <h2 class="text-xl md:text-2xl font-bold">Change Username</h2>
        <i class="text-gray-400">Enter your new username twice to change it. Once changed you will be logged out on all devices.</i>
        <form action="?/changeUsername" method="POST">
    
            <div class="flex flex-wrap items-center">
                <!-- New username -->
                <div class="mt-1">
                    <label for="newUsername">New Username</label>
                    <input id="newUsername" name="newUsername" type="input" required class="input" />
                </div>
                <!-- Confirm New username -->
                <div class="mt-1">
                    <label for="confirmUsername">Confirm New Username</label>
                    <input id="confirmUsername" name="confirmUsername" type="input" required class="input" />
                </div>
            </div>
            <div class="flex flex-wrap items-center">
                <div class="mt-2">
                    <button type="submit" class="btn h-8 variant-filled">Change Username</button>
                </div>
                <!-- Error Messages -->
                <div class="p-2">
                    {#if form?.user_not_found}
                        <p class="text-error-500 mt-2">Who are you? Try again later</p>
                    {/if}
                    {#if form?.username_mismatch}
                        <p class="text-error-500 mt-2">New usernames do not match.</p>
                    {/if}
                    {#if form?.username_exists}
                    <p class="text-error-500 mt-2">Username is taken.</p>
                {/if}
                </div>
            </div>
    
        </form>
    </div>
    <!--Change icon initials-->
    <div class="card p-6 md:p-8 shadow-lg rounded-lg w-full min-h-[250px] flex flex-col justify-between">
        <h2 class="text-xl md:text-2xl font-bold">Change Icon Initials</h2>
        <i class="text-gray-400">Enter two characters to use as icon initials to further customize your profile.</i>
         <form action="?/changeIconInitials" method="POST" on:submit={handleSaveSettings}>
        <div class="mt-1">
            <label for="initials">New Icon Initials</label>
            <input id="initials" name="initials" type="text" maxlength="2" required class="input" />
        </div>
        <div class="mt-2">
            <button type="submit" class="btn h-8 variant-filled">Save Initials</button>
        </div>
        <!-- Error Messages -->
        <div class="p-2">
            {#if form?.invalid_initials}
                <p class="text-error-500 mt-2">Invalid initials. Please enter exactly two characters.</p>
            {/if}
            {#if form?.success === 'initials'}
                <p class="text-success-500 mt-2">Initials updated successfully!</p>
            {/if}
        </div>
    </form>
    </div>
    <!--Change icon colour-->
    <div class="card p-6 md:p-8 shadow-lg rounded-lg w-full min-h-[250px] flex flex-col justify-between">
        <h2 class="text-xl md:text-2xl font-bold">Change Icon Colour</h2>
        <i class="text-gray-400">Pick a new icon colour to further customize your profile.</i>
        
        <form action="?/changeIconColor" method="POST" on:submit={handleSaveSettings}>
            <label for="color">Select New Color</label>
            <div class="flex flex-wrap">
                <div class="mr-1">
                    <input id="color" name="color" value="#{user_icon_colour}" type="color" required class="input" />
                </div>
                <div class="mt-1">
                    <button type="submit" class="btn h-8 variant-filled">Save Color</button>
                </div>
                {#if form?.invalid_color}
                    <p class="text-error-500 mt-2">Invalid color format.</p>
                {/if}
            </div>

        </form>
    </div>
    <!--Delete account-->
    <div class="card p-6 md:p-8 shadow-lg rounded-lg w-full min-h-[250px] flex flex-col justify-between">
        <h2 class="text-xl md:text-2xl font-bold">Delete Account</h2>
        <i class="text-gray-400">Delete your account via the click of a button. <span class="text-error-500"> THIS CANNOT BE UNDONE<span></i>
        <div class="flex mt-1">
            <form action="?/delete_account" method="POST" on:submit={confirmSubmission}>
                <button type="submit" class="btn h-8 variant-outline-error">Delete Account?</button>
            </form>
            <!-- Error Messages -->
            <div class="p-2">
                {#if form?.deleted === true}
                    <p class="text-error-500 mt-2">Failed to remove account! Try again later.</p>
                {/if}
            </div>
        </div>
            

    </div>
    <!--Change icon image-->
    <div class="card p-6 md:p-8 shadow-lg rounded-lg w-full min-h-[250px] flex flex-col justify-between">
        <h2 class="text-xl md:text-2xl font-bold">Change Profile Picture</h2>
        <i class="text-gray-400">Upload a new profile picture to further customize your profile.</i>
        <form action="?/changeProfilePicture" method="POST" enctype="multipart/form-data">
            <div class="mt-1">
                <label for="profilePicture">Select New Profile Picture</label>
                <input id="profilePicture" name="profilePicture" type="file" accept="image/*" required class="input" />
            </div>
            <div class="mt-2">
                <button type="submit" class="btn h-8 variant-filled">Upload Picture</button>
            </div>
            <div class="p-2">
                {#if form?.success === 'image'}
                    <p class="text-success-500 mt-2">Profile picture updated successfully!</p>
                {/if}
            </div>
        </form>
    </div>
</div>