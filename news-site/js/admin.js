// --- GLOBAL STATE ---
let allArticles = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Security Check: Redirect if not logged in or not an Admin
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

    // Display greeting
    document.getElementById('admin-greeting').innerText = `Logged in as: ${profile.email}`;

    // 2. Initialize Dashboard
    loadAnalytics();
    loadUsers();
    loadArticles(); // This replaces loadRecentArticles

    // 3. Search & Filter Listeners
    document.getElementById('admin-search').addEventListener('input', filterArticles);
    document.getElementById('admin-filter-category').addEventListener('change', filterArticles);
});

/**
 * Fetches counts for the Stat Cards
 */
async function loadAnalytics() {
    const { count: userCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true });
    const { count: artCount } = await supabaseClient.from('articles').select('*', { count: 'exact', head: true });
    const { count: staffCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'editor');

    document.getElementById('total-users').innerText = userCount || 0;
    document.getElementById('total-articles').innerText = artCount || 0;
    document.getElementById('editor-count').innerText = staffCount || 0;
}

/**
 * User Management Logic
 */
async function loadUsers() {
    const { data: profiles } = await supabaseClient.from('profiles').select('*').order('email', { ascending: true });
    const tbody = document.getElementById('user-list');
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

window.updateUserRole = async (userId, newRole) => {
    const { error } = await supabaseClient.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) alert("Update failed: " + error.message);
    else {
        alert("Role updated successfully!");
        loadAnalytics(); 
        loadUsers(); 
    }
};

/**
 * Article Management Logic (Search & Filter)
 */
async function loadArticles() {
    const { data: articles, error } = await supabaseClient
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return console.error("Error loading articles:", error);

    allArticles = articles; // Store globally for search
    renderArticleTable(allArticles);
}

function renderArticleTable(data) {
    const tbody = document.getElementById('admin-articles-list');
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
                <button onclick="window.location.href='editor.html?edit=${a.id}'" style="cursor:pointer; background:#3498db; color:white; border:none; padding:5px 10px; border-radius:4px;">Edit</button>
                <button onclick="deleteArticle('${a.id}')" style="cursor:pointer; background:#ff4757; color:white; border:none; padding:5px 10px; border-radius:4px; margin-left:5px;">Delete</button>
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

window.deleteArticle = async (articleId) => {
    const confirmed = confirm("Are you sure? This will permanently remove the article and its comments.");
    if (!confirmed) return;

    try {
        const { error } = await supabaseClient
            .from('articles')
            .delete()
            .eq('id', articleId);

        if (error) throw error;

        alert("Article deleted.");
        // Re-run the load functions to refresh the UI without a page reload
        loadAnalytics();
        loadArticles(); 
    } catch (err) {
        console.error("Delete failed:", err.message);
        alert("Delete failed: " + err.message);
    }
};

