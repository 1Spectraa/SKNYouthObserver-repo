// js/editor.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Permissions
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile.role === 'reader') {
        alert("Access Denied: Editors and Admins only.");
        window.location.href = 'index.html';
        return;
    }

    // 2. Handle Form Submission
    const form = document.getElementById('article-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newArticle = {
            title: document.getElementById('post-title').value,
            category: document.getElementById('post-category').value,
            image_url: document.getElementById('post-image').value,
            content: document.getElementById('post-content').value,
        };

        const { error } = await supabaseClient
            .from('articles')
            .insert([newArticle]);

        if (error) {
            alert("Error publishing: " + error.message);
        } else {
            alert("Article published successfully!");
            window.location.href = 'index.html';
        }
    });
});