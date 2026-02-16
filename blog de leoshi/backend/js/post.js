document.addEventListener('DOMContentLoaded', () => {
    const postContainer = document.getElementById('post-content-container');
    
    // Obtener el ID del post de la URL (ej: post.html?id=1)
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        postContainer.innerHTML = '<h1>Error: No se especificó un ID de post.</h1>';
        return;
    }

    fetch(`http://localhost:3000/api/posts/${postId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Post no encontrado');
            }
            return response.json();
        })
        .then(post => {
            // Actualizar el título de la página
            document.title = post.title + ' | Leoshi net';

            // Crear el HTML para el post
            postContainer.innerHTML = `
                <article class="full-post">
                    <h1 class="post-title-full">${post.title}</h1>
                    <p class="post-meta">Publicado el ${post.created_date} por ${post.author}</p>
                    <div class="post-content-full">${post.content.replace(/\n/g, '<br>')}</div>
                    <a href="edit-post.html?id=${post.id}" class="edit-button">Editar Artículo</a>
                </article>`;
        })
        .catch(error => {
            console.error('Error al cargar el post:', error);
            postContainer.innerHTML = `<h1>Error al cargar el artículo.</h1><p>${error.message}</p>`;
        });
});