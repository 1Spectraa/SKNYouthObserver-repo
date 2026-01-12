// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check which page we are on
    if (document.getElementById('news-grid')) {
        fetchAllArticles();
    } else if (document.getElementById('full-article')) {
        fetchSingleArticle();
    }
});

// --- LOGIC FOR HOME PAGE ---
async function fetchAllArticles() {
    const { data: articles, error } = await supabaseClient
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    const container = document.getElementById('news-grid');
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
}

// --- LOGIC FOR SINGLE ARTICLE PAGE ---
async function fetchSingleArticle() {
    // 1. Get the ID from the URL (?id=123)
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');

    if (!articleId) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Fetch that specific article
    const { data: article, error } = await supabaseClient
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single(); // We only expect one result

    if (error || !article) {
        console.error('Article not found');
        return;
    }

    // 3. Inject into the page
    document.getElementById('article-title').textContent = article.title;
    document.getElementById('article-category').textContent = article.category;
    document.getElementById('article-image').src = article.image_url;
    document.getElementById('article-body').innerHTML = article.content;
    document.getElementById('article-date').textContent = `Published on ${new Date(article.created_at).toLocaleDateString()}`;
}

async function updateNavbar() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const authSection = document.getElementById('auth-section');

    if (user) {
        // User is logged in, show Logout and check for Admin link
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        authSection.innerHTML = `
            ${profile?.role === 'admin' ? '<a href="admin.html">Admin</a>' : ''}
            <button onclick="handleLogout()">Logout</button>
        `;
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

updateNavbar();

// Add this to the end of main.js
async function setupNavbar() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const navLinks = document.querySelector('.nav-links');

    if (user) {
        // Fetch the user's role
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile) {
            // If they are Admin or Editor, show the "Create Post" link
            if (profile.role === 'admin' || profile.role === 'editor') {
                const editorLi = document.createElement('li');
                editorLi.innerHTML = '<a href="editor.html" style="color: #e67e22; font-weight: bold;">+ Create Post</a>';
                navLinks.prepend(editorLi);
            }

            // If they are an Admin, show the "Admin Dashboard" link
            if (profile.role === 'admin') {
                const adminLi = document.createElement('li');
                adminLi.innerHTML = '<a href="admin.html">Admin Panel</a>';
                navLinks.prepend(adminLi);
            }
        }

        // Add a Logout button for everyone who is logged in
        const logoutLi = document.createElement('li');
        logoutLi.innerHTML = '<a href="#" id="logout-link">Logout</a>';
        navLinks.appendChild(logoutLi);

        document.getElementById('logout-link').addEventListener('click', async (e) => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });
    } else {
        // If not logged in, show Login link
        const loginLi = document.createElement('li');
        loginLi.innerHTML = '<a href="login.html">Login</a>';
        navLinks.appendChild(loginLi);
    }
}

// Run this on every page load
setupNavbar();