document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorBox = document.getElementById('error-message');
            const submitBtn = document.getElementById('submit-btn');

            // Hide previous errors
            errorBox.style.display = 'none';

            // Check if we are on the Signup or Login page based on the button
            const isSignup = submitBtn.innerText.includes('Sign Up');

            try {
                let result;
                if (isSignup) {
                    // SUPABASE SIGN UP
                    result = await supabaseClient.auth.signUp({
                        email: email,
                        password: password,
                    });
                } else {
                    // SUPABASE LOGIN
                    result = await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password,
                    });
                }

                if (result.error) {
                    errorBox.style.display = 'block';
                    errorBox.innerText = result.error.message;
                } else {
                    if (isSignup) {
                        alert("Signup successful! Please check your email for a confirmation link.");
                    }
                    // Redirect to home page on success
                    window.location.href = 'index.html';
                }
            } catch (err) {
                console.error("Auth Exception:", err);
                errorBox.style.display = 'block';
                errorBox.innerText = "An unexpected error occurred.";
            }
        });
    }
});