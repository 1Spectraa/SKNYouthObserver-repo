/**
 * --- GLOBAL FUNCTIONS ---
 * These must be available to the 'onclick' handlers in the HTML.
 */

window.deleteArticle = async (articleId) => {
    // Debugging: Check if the function even triggers
    console.log("Attempting to delete article:", articleId);

    const confirmed = confirm("Are you sure? This will permanently remove the article and its comments.");
    if (!confirmed) return;

    try {
        const { error } = await supabaseClient
            .from('articles')
            .delete()
            .eq('id', articleId);

        if (error) throw error;

        alert("Article deleted.");
        
        // Refresh the data without page reload
        if (typeof loadAnalytics === 'function') loadAnalytics();
        if (typeof loadArticles === 'function') loadArticles(); 
    } catch (err) {
        console.error("Delete failed:", err.message);
        alert("Delete failed: " + err.message);
    }
};

window.updateUserRole = async (userId, newRole) => {
    const { error } = await supabaseClient.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) alert("Update failed: " + error.message);
    else {
        alert("Role updated successfully!");
        loadAnalytics(); 
        loadUsers(); 
    }
};

// --- STATE MANAGEMENT ---
let allArticles = [];

/**
 * --- PAGE INITIALIZATION ---
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Security Check
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) { 
        window.location.href = 'login.html'; 
        return; 
    }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        alert("Access Denied: Admins Only");
        window.location.href = 'index.html';
        return;
    }

    const greeting = document.getElementById('admin-greeting');
    if (greeting) greeting.innerText = `Logged in as: ${profile.email}`;

    // 2. Initialize Dashboard
    loadAnalytics();
    loadUsers();
    loadArticles();

    // 3. Listeners
    const searchInput = document.getElementById('admin-search');
    const categoryFilter = document.getElementById('admin-filter-category');
    
    if (searchInput) searchInput.addEventListener('input', filterArticles);
    if (categoryFilter) categoryFilter.addEventListener('change', filterArticles);
});

/**
 * --- DATA LOADING FUNCTIONS ---
 */
async function loadAnalytics() {
    const { count: userCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true });
    const { count: artCount } = await supabaseClient.from('articles').select('*', { count: 'exact', head: true });
    const { count: staffCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'editor');

    document.getElementById('total-users').innerText = userCount || 0;
    document.getElementById('total-articles').innerText = artCount || 0;
    document.getElementById('editor-count').innerText = staffCount || 0;
}

async function loadUsers() {
    const { data: profiles } = await supabaseClient.from('profiles').select('*').order('email', { ascending: true });
    const tbody = document.getElementById('user-list');
    if (!tbody) return;

    tbody.innerHTML = profiles.map(p => `
        <tr>
            <td>${p.email}</td>
            <td><code>${p.id.substring(0, 8)}...</code></td>
            <td><span class="status-badge role-${p.role}">${p.role.toUpperCase()}</span></td>
            <td>
                <select onchange="updateUserRole('${p.id}', this.value)">
                    <option value="reader" ${p.role === 'reader' ? 'selected' : ''}>Reader</option>
                    <option value="editor" ${p.role === 'editor' ? 'selected' : ''}>Editor</option>
                    <option value="admin" ${p.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </td>
        </tr>
    `).join('');
}

async function loadArticles() {
    const { data: articles, error } = await supabaseClient
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return console.error("Error loading articles:", error);

    allArticles = articles;
    renderArticleTable(allArticles);
}

function renderArticleTable(data) {
    const tbody = document.getElementById('admin-articles-list');
    if (!tbody) return;
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No articles found.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(a => `
        <tr>
            <td><strong>${a.title}</strong></td>
            <td>${a.category}</td>
            <td>${a.is_featured ? '<span class="status-badge role-admin">FEATURED</span>' : 'Standard'}</td>
            <td>
                <button onclick="window.location.href='editor.html?edit=${a.id}'" class="btn-primary" style="padding:5px 10px; font-size: 0.8rem;">Edit</button>
                <button onclick="deleteArticle('${a.id}')" class="delete-btn" style="padding:5px 10px; font-size: 0.8rem; background: var(--danger); color: white; border-radius: 4px;">Delete</button>
            </td>
        </tr>
    `).join('');
}

function filterArticles() {
    const search = document.getElementById('admin-search').value.toLowerCase();
    const category = document.getElementById('admin-filter-category').value;

    const filtered = allArticles.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(search);
        const matchesCategory = category === "All" || a.category === category;
        return matchesSearch && matchesCategory;
    });
    renderArticleTable(filtered);
}