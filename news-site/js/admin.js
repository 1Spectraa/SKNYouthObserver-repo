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

    // 2. Load all Dashboard Data
    loadAnalytics();
    loadUsers();
    loadRecentArticles();
});

/**
 * Fetches counts for the Stat Cards
 */
async function loadAnalytics() {
    // Total Users
    const { count: userCount } = await supabaseClient
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // Total Articles
    const { count: artCount } = await supabaseClient
        .from('articles')
        .select('*', { count: 'exact', head: true });

    // Count specifically for Editors
    const { count: staffCount } = await supabaseClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'editor');

    document.getElementById('total-users').innerText = userCount || 0;
    document.getElementById('total-articles').innerText = artCount || 0;
    document.getElementById('editor-count').innerText = staffCount || 0;
}

/**
 * Loads the User Management Table
 */
async function loadUsers() {
    const { data: profiles, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('email', { ascending: true });
    
    if (error) {
        console.error("Error loading users:", error);
        return;
    }

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

/**
 * Handles the role change from the dropdown.
 * Attached to window so the HTML 'onchange' can find it.
 */
window.updateUserRole = async (userId, newRole) => {
    const { error } = await supabaseClient
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) {
        alert("Update failed: " + error.message);
    } else {
        alert("Role updated successfully!");
        // Refresh everything to keep numbers and table colors in sync
        loadAnalytics(); 
        loadUsers(); 
    }
};

/**
 * Loads the 5 most recent articles
 */
async function loadRecentArticles() {
    const { data: articles, error } = await supabaseClient
        .from('articles')
        .select('id, title, created_at, category')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error loading articles:", error);
        return;
    }

    const list = document.getElementById('recent-posts-list');
    if (articles && articles.length > 0) {
        list.innerHTML = articles.map(a => `
            <li>
                <div>
                    <strong>${a.title}</strong> 
                    <span class="tag">${a.category}</span>
                    <br><small>${new Date(a.created_at).toLocaleDateString()} at ${new Date(a.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                </div>
                <button class="btn-delete" onclick="deleteArticle('${a.id}')" style="background:#ff4757; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
            </li>
        `).join('');
    } else {
        list.innerHTML = "<li>No articles found.</li>";
    }
}

/**
 * Moderation: Delete an article
 */
window.deleteArticle = async (articleId) => {
    if (!confirm("Are you sure you want to delete this article? This cannot be undone.")) return;

    const { error } = await supabaseClient
        .from('articles')
        .delete()
        .eq('id', articleId);

    if (error) {
        alert("Delete failed: " + error.message);
    } else {
        alert("Article deleted.");
        loadAnalytics();
        loadRecentArticles();
    }
};