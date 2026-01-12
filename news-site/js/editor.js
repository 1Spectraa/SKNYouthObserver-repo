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

    if (!profile || profile.role === 'reader') {
        alert("Access Denied: Editors and Admins only.");
        window.location.href = 'index.html';
        return;
    }

    // --- EDIT MODE DETECTION ---
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    let existingImageUrl = null;

    if (editId) {
        const { data: article } = await supabaseClient
            .from('articles')
            .select('*')
            .eq('id', editId)
            .single();
            
        if (article) {
            // Populate form fields
            document.getElementById('post-title').value = article.title;
            document.getElementById('post-content').value = article.content;
            document.getElementById('post-category').value = article.category;
            document.getElementById('is-featured').checked = article.is_featured;
            existingImageUrl = article.image_url;
            
            // Update UI for Edit Mode
            const header = document.querySelector('h1');
            if (header) header.textContent = "Edit Article";
            
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = "Update Article";
            
            // Image is optional during an edit
            document.getElementById('post-image-file').required = false;
        }
    }

    // --- PREVIEW LOGIC ---
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const title = document.getElementById('post-title').value;
            const category = document.getElementById('post-category').value;
            const content = document.getElementById('post-content').value;
            const previewContainer = document.getElementById('preview-container');
            const previewContent = document.getElementById('preview-content');

            if(!title || !content) {
                alert("Add a title and content to see a preview!");
                return;
            }

            previewContainer.style.display = 'block';
            previewContent.innerHTML = `
                <span class="card-tag">${category}</span>
                <h1>${title}</h1>
                <div class="article-body" style="white-space: pre-wrap;">${content}</div>
            `;
            previewContainer.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // --- PUBLISH / UPDATE LOGIC ---
    const form = document.getElementById('article-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const imageFile = document.getElementById('post-image-file').files[0];
        const title = document.getElementById('post-title').value;
        const category = document.getElementById('post-category').value;
        const content = document.getElementById('post-content').value;
        const isFeatured = document.getElementById('is-featured').checked;

        let finalImageUrl = existingImageUrl;

        // 1. Handle Image Upload (only if a new file is selected)
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('article-images')
                .upload(filePath, imageFile);

            if (uploadError) {
                alert("Image upload failed: " + uploadError.message);
                return;
            }

            const { data: { publicUrl } } = supabaseClient
                .storage
                .from('article-images')
                .getPublicUrl(filePath);
            
            finalImageUrl = publicUrl;
        }

        // Validate image existence for new posts
        if (!editId && !finalImageUrl) {
            alert("Please select an image file for new articles.");
            return;
        }

        // 2. Prepare Data Object
        const articleData = {
            title: title,
            category: category,
            image_url: finalImageUrl,
            content: content,
            is_featured: isFeatured
        };

        // 3. Save to Database (Update vs Insert)
        try {
            if (editId) {
                const { error: dbError } = await supabaseClient
                    .from('articles')
                    .update(articleData)
                    .eq('id', editId);

                if (dbError) throw dbError;
                alert("Article updated successfully!");
                window.location.href = 'admin.html'; 
            } else {
                const { error: dbError } = await supabaseClient
                    .from('articles')
                    .insert([articleData]);

                if (dbError) throw dbError;
                alert("Article published successfully!");
                window.location.href = 'index.html';
            }
        } catch (err) {
            alert("Database Error: " + err.message);
        }
    });
});