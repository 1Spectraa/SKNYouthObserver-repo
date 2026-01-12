// Toggle between Login and Signup UI
const toggleBtn = document.getElementById('toggle-auth');
let isLogin = true;

if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        document.getElementById('form-title').innerText = isLogin ? 'Sign In' : 'Sign Up';
        document.getElementById('submit-btn').innerText = isLogin ? 'Sign In' : 'Sign Up';
        toggleBtn.innerText = isLogin ? 'Sign Up' : 'Sign In';
    });
}

// Handle Form Submission
document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorBox = document.getElementById('error-message');

    let result;
    if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password });
    } else {
        result = await supabase.auth.signUp({ email, password });
    }

    if (result.error) {
        errorBox.style.display = 'block';
        errorBox.innerText = result.error.message;
    } else {
        window.location.href = 'index.html';
    }
});

// Helper function to check Role
async function getUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    return data?.role;
}

// js/auth.js

document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorBox = document.getElementById('error-message');
    const submitBtn = document.getElementById('submit-btn');

    // Determine if we are on the signup page or login page based on button text
    const isSignupPage = submitBtn.innerText.includes('Sign Up');

    let result;

    if (isSignupPage) {
        // Sign Up Logic
        result = await supabase.auth.signUp({
            email: email,
            password: password,
        });
    } else {
        // Login Logic
        result = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
    }

    if (result.error) {
        errorBox.style.display = 'block';
        errorBox.innerText = result.error.message;
    } else {
        // Success!
        if (isSignupPage) {
            alert("Check your email for the confirmation link!");
        }
        window.location.href = 'index.html';
    }
});