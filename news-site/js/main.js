// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('news-grid')) {
        fetchAllArticles();
    } else if (document.getElementById('full-article')) {
        fetchSingleArticle();
    }
    setupNavbar(); // Consolidated function
});

// --- NEWS FEED LOGIC ---
async function fetchAllArticles() {
    try {
        const { data: articles, error } = await supabaseClient
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('news-grid');
        if (!articles || articles.length === 0) {
            container.innerHTML = '<p>No articles found. Use the Admin panel to create one!</p>';
            return;
        }

        container.innerHTML = articles.map(article => `
            <article class="news-card">
                <img src="${article.image_url}" alt="${article.title}">
                <div class="card-content">
                    <span class="card-tag">${article.category}</span>
                    <h3>${article.title}</h3>
                    <p>${article.content.substring(0, 100)}...</p>
                    <a href="article.html?id=${article.id}" class="read-more">Read More →</a>
                </div>
            </article>
        `).join('');
    } catch (err) {
        console.error('Fetch Articles Error:', err.message);
    }
}

// --- LOGIC FOR SINGLE ARTICLE PAGE ---
async function fetchSingleArticle() {
    // 1. Get the ID from the URL (?id=uuid-here)
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');

    // If there is no ID in the URL, go back home
    if (!articleId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // 2. Fetch that specific article from Supabase
        const { data: article, error } = await supabaseClient
            .from('articles')
            .select('*')
            .eq('id', articleId)
            .single();

        if (error || !article) throw new Error('Article not found');

        // 3. Inject data into your HTML elements
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('article-category').textContent = article.category;
        document.getElementById('article-image').src = article.image_url;
        document.getElementById('article-image').alt = article.title;
        
        // Use innerHTML for the body in case you want to support formatting later
        document.getElementById('article-body').innerHTML = `<p>${article.content}</p>`;
        
        // Format the date nicely
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = new Date(article.created_at).toLocaleDateString(undefined, dateOptions);
        document.getElementById('article-date').textContent = `Published on ${formattedDate}`;

    } catch (err) {
        console.error('Fetch Single Article Error:', err.message);
        document.getElementById('full-article').innerHTML = `
            <h2>Story Not Found</h2>
            <p>Sorry, we couldn't find the article you're looking for.</p>
            <a href="index.html">Return to Home</a>
        `;
    }
}

// --- NAVBAR & ROLE LOGIC ---
async function setupNavbar() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const navLinks = document.querySelector('.nav-links');
    const authSection = document.getElementById('auth-section');

    if (!user) {
        // Not logged in: Show default links
        if (authSection) authSection.innerHTML = '<a href="login.html" class="btn-primary">Login</a>';
        return;
    }

    try {
        // Fetch profile - if this fails, we catch the error below
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        // 1. Update the NAV LINKS (Add Admin/Editor links)
        if (profile.role === 'admin' || profile.role === 'editor') {
            const editorLi = document.createElement('li');
            editorLi.innerHTML = '<a href="editor.html" style="color: #e67e22; font-weight: bold;">+ Create Post</a>';
            navLinks.prepend(editorLi);
        }

        if (profile.role === 'admin') {
            const adminLi = document.createElement('li');
            adminLi.innerHTML = '<a href="admin.html">Admin Panel</a>';
            navLinks.prepend(adminLi);
        }

        // 2. Update the AUTH SECTION (Replace Login button with Logout)
        if (authSection) {
            authSection.innerHTML = `<button onclick="handleLogout()" class="btn-primary" style="background:#ff4757">Logout</button>`;
        }

    } catch (err) {
        console.error("Navbar Setup Error (Likely Profile Table):", err.message);
        // If profile fetch fails, still show a logout button so the user isn't stuck
        if (authSection) authSection.innerHTML = `<button onclick="handleLogout()" class="btn-primary">Logout</button>`;
    }
}

// --- LOGOUT LOGIC ---
async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}