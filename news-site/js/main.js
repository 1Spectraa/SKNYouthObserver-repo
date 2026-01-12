// --- GLOBAL STATE ---
let allArticlesList = [];

document.addEventListener('DOMContentLoaded', () => {
    setupNavbar();
    
    if (document.getElementById('news-grid')) {
        fetchAllArticles();
        setupFilters();
    } else if (document.getElementById('full-article')) {
        fetchSingleArticle();
    }
});

// --- NEWS FEED LOGIC ---
async function fetchAllArticles() {
    try {
        const { data: articles, error } = await supabaseClient
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Store globally for filtering
        allArticlesList = articles;

        // 1. Handle Featured Hero Section
        const featuredArticle = articles.find(a => a.is_featured === true);
        const featuredContent = document.getElementById('featured-content');
        
        if (featuredArticle && featuredContent) {
            const heroSection = document.getElementById('featured-section');
            heroSection.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${featuredArticle.image_url}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';

            featuredContent.innerHTML = `
                <div class="hero-badge" style="background: #e67e22; padding: 5px 10px; display: inline-block; border-radius: 4px; margin-bottom: 10px; color: white;">FEATURED STORY</div>
                <h1 style="font-size: 3rem; margin-bottom: 1rem; color: white;">${featuredArticle.title}</h1>
                <p style="font-size: 1.2rem; max-width: 600px; margin-bottom: 2rem; color: white;">${featuredArticle.content.substring(0, 160)}...</p>
                <a href="article.html?id=${featuredArticle.id}" class="btn-primary" style="padding: 15px 30px; font-weight: bold; text-decoration: none;">Read Full Story</a>
            `;
        }

        // 2. Render the grid (excluding featured article if it exists)
        const regularArticles = featuredArticle 
            ? articles.filter(a => a.id !== featuredArticle.id) 
            : articles;

        renderGrid(regularArticles);

    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

// Helper function to draw cards in the grid
function renderGrid(articlesToDisplay) {
    const gridContainer = document.getElementById('news-grid');
    if (!gridContainer) return;

    if (articlesToDisplay.length === 0) {
        gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No articles found in this category.</p>';
        return;
    }

    gridContainer.innerHTML = articlesToDisplay.map(article => `
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

// --- FILTER LOGIC ---
function setupFilters() {
    // Looks for elements with class 'filter-tag' or links in the navbar categories
    const filterButtons = document.querySelectorAll('.filter-tag, .category-link');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.innerText.trim();
            
            // Highlight active filter (optional UI polish)
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            if (category === "All" || category === "The SKN Youth Observer") {
                renderGrid(allArticlesList);
            } else {
                const filtered = allArticlesList.filter(a => a.category === category);
                renderGrid(filtered);
            }
        });
    });
}

// --- LOGIC FOR SINGLE ARTICLE PAGE ---
async function fetchSingleArticle() {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');
    if (!articleId) { window.location.href = 'index.html'; return; }

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        const { data: article, error } = await supabaseClient
            .from('articles')
            .select('*')
            .eq('id', articleId)
            .single();

        if (error || !article) throw new Error('Article not found');

        // Inject Data
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('article-category').textContent = article.category;
        document.getElementById('article-image').src = article.image_url;
        document.getElementById('article-body').innerHTML = `<p style="white-space: pre-wrap;">${article.content}</p>`;
        
        const formattedDate = new Date(article.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('article-date').textContent = `Published on ${formattedDate}`;

        // Admin Edit Button logic
        if (user) {
            const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role === 'admin' || profile?.role === 'editor') {
                const controls = document.getElementById('admin-controls');
                if (controls) {
                    controls.style.display = 'block';
                    document.getElementById('edit-article-btn').onclick = () => {
                        window.location.href = `editor.html?edit=${article.id}`;
                    };
                }
            }
        }

        loadComments(articleId);
        setupCommentForm(articleId);

    } catch (err) {
        console.error('Fetch Single Article Error:', err.message);
    }
}

// --- NAVBAR & AUTH LOGIC ---
async function setupNavbar() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const navLinks = document.querySelector('.nav-links');
    const authSection = document.getElementById('auth-section');

    if (!user) {
        if (authSection) authSection.innerHTML = '<a href="login.html" class="btn-primary">Login</a>';
        return;
    }

    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();

    if (profile) {
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
    }

    if (authSection) {
        authSection.innerHTML = `<button onclick="handleLogout()" class="btn-primary" style="background:#ff4757; border:none; cursor:pointer;">Logout</button>`;
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

// --- COMMENTS LOGIC ---
async function loadComments(articleId) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    let userRole = 'reader';
    if (user) {
        const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
        userRole = profile?.role || 'reader';
    }

    const { data: comments } = await supabaseClient.from('comments').select('*').eq('article_id', articleId).order('created_at', { ascending: false });
    const list = document.getElementById('comments-list');

    if (!comments || comments.length === 0) {
        list.innerHTML = '<p style="color:gray;">No comments yet.</p>';
        return;
    }

    list.innerHTML = comments.map(c => `
        <div class="comment-item" style="border-bottom: 1px solid #eee; padding: 15px 0;">
            <p><strong>${c.user_email.split('@')[0]}</strong> • <small>${new Date(c.created_at).toLocaleDateString()}</small></p>
            <p>${c.content}</p>
            ${(userRole === 'admin' || userRole === 'editor') ? 
                `<button onclick="deleteComment('${c.id}', '${articleId}')" class="delete-btn" style="color:red; background:none; border:none; cursor:pointer; padding:0; font-size:0.8rem;">Delete</button>` : ''}
        </div>
    `).join('');
}

window.deleteComment = async (id, articleId) => {
    if (confirm("Delete this comment permanently?")) {
        await supabaseClient.from('comments').delete().eq('id', id);
        loadComments(articleId);
    }
}

async function setupCommentForm(articleId) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const form = document.getElementById('comment-form');
    const authMsg = document.getElementById('auth-to-comment');

    if (user && form) {
        form.style.display = 'block';
        form.onsubmit = async (e) => {
            e.preventDefault();
            const commentBox = document.getElementById('comment-text');
            const { error } = await supabaseClient.from('comments').insert([{
                article_id: articleId,
                user_id: user.id,
                user_email: user.email,
                content: commentBox.value
            }]);

            if (error) alert(error.message);
            else {
                commentBox.value = '';
                loadComments(articleId);
            }
        };
    } else if (authMsg) {
        authMsg.style.display = 'block';
    }
}
// This matches the 'onclick' in your HTML buttons
window.filterNews = (category) => {
    // Update button colors
    const buttons = document.querySelectorAll('.category-link');
    buttons.forEach(btn => {
        if(btn.innerText.toLowerCase() === category.toLowerCase()) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Run the filtering
    if (category === 'all') {
        renderGrid(allArticlesList);
    } else {
        const filtered = allArticlesList.filter(a => a.category === category);
        renderGrid(filtered);
    }
};