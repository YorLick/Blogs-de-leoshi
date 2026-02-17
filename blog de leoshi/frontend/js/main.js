document.addEventListener('DOMContentLoaded', () => {

    // --- AQUÍ SE GUARDA TODO EN EL NAVEGADOR (COMO UNA GALLETA GIGANTE) ---
    // Recordatorio Leoshi: Cuando tengamos servidor real, cambiar esto por fetch() a la API.
    const DB = {
        getUsers: () => JSON.parse(localStorage.getItem('leoshi_users') || '[]'),
        saveUser: (user) => {
            const users = DB.getUsers();
            users.push(user);
            localStorage.setItem('leoshi_users', JSON.stringify(users));
        },
        updateUser: (updatedUser) => {
            let users = DB.getUsers();
            const index = users.findIndex(u => u.email === updatedUser.email);
            if (index !== -1) {
                users[index] = updatedUser;
                localStorage.setItem('leoshi_users', JSON.stringify(users));
            }
        },
        findUser: (email, password) => {
            const users = DB.getUsers();
            return users.find(u => u.email === email && u.password === password);
        },
        getPosts: () => JSON.parse(localStorage.getItem('leoshi_posts') || '[]'),
        savePost: (post) => {
            const posts = DB.getPosts();
            posts.unshift(post); // Agregar al principio
            localStorage.setItem('leoshi_posts', JSON.stringify(posts));
        },
        updatePost: (updatedPost) => {
            let posts = DB.getPosts();
            const index = posts.findIndex(p => p.id === updatedPost.id);
            if (index !== -1) {
                posts[index] = updatedPost;
                localStorage.setItem('leoshi_posts', JSON.stringify(posts));
            }
        },
        incrementPostViews: (postId) => {
            let posts = DB.getPosts();
            const index = posts.findIndex(p => p.id === postId);
            if (index !== -1) {
                if (!posts[index].views) posts[index].views = 0;
                posts[index].views++;
                localStorage.setItem('leoshi_posts', JSON.stringify(posts));
            }
        },
        getComments: (postId) => JSON.parse(localStorage.getItem(`leoshi_comments_${postId}`) || '[]'),
        saveComment: (postId, comment) => {
            const comments = DB.getComments(postId);
            // Asegurar estructura de votos
            if (!comment.likes) comment.likes = [];
            if (!comment.dislikes) comment.dislikes = [];
            comments.push(comment);
            localStorage.setItem(`leoshi_comments_${postId}`, JSON.stringify(comments));
        },
        voteComment: (postId, commentIndex, voteType, username) => {
            const comments = DB.getComments(postId);
            const comment = comments[commentIndex];
            if (!comment) return;

            // Inicializar si no existen (compatibilidad con comentarios viejos)
            if (!comment.likes) comment.likes = [];
            if (!comment.dislikes) comment.dislikes = [];

            const likeIndex = comment.likes.indexOf(username);
            const dislikeIndex = comment.dislikes.indexOf(username);

            if (voteType === 'like') {
                if (likeIndex !== -1) {
                    comment.likes.splice(likeIndex, 1); // Quitar like si ya lo tenía
                } else {
                    comment.likes.push(username); // Dar like
                    if (dislikeIndex !== -1) comment.dislikes.splice(dislikeIndex, 1); // Quitar dislike si existía
                }
            } else if (voteType === 'dislike') {
                if (dislikeIndex !== -1) {
                    comment.dislikes.splice(dislikeIndex, 1); // Quitar dislike si ya lo tenía
                } else {
                    comment.dislikes.push(username); // Dar dislike
                    if (likeIndex !== -1) comment.likes.splice(likeIndex, 1); // Quitar like si existía
                }
            }
            
            localStorage.setItem(`leoshi_comments_${postId}`, JSON.stringify(comments));
        },
        getChatMessages: () => JSON.parse(localStorage.getItem('leoshi_chat_msgs') || '[]'),
        saveChatMessage: (msg) => {
            const msgs = DB.getChatMessages();
            msgs.push(msg);
            localStorage.setItem('leoshi_chat_msgs', JSON.stringify(msgs));
        },
        getSession: () => JSON.parse(localStorage.getItem('leoshi_session')),
        setSession: (user) => localStorage.setItem('leoshi_session', JSON.stringify(user)),
        clearSession: () => localStorage.removeItem('leoshi_session')
    };

    // --- ELEMENTOS DE LA PÁGINA (BOTONES, CAJAS, ETC) ---
    const postsContainer = document.getElementById('posts-container');
    const authLinks = document.getElementById('auth-links');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const userAvatarNav = document.getElementById('nav-user-avatar');
    const fabCreate = document.getElementById('fab-create');
    const searchInput = document.getElementById('search-input');
    const btnNavChat = document.getElementById('btn-nav-chat');
    const chatView = document.getElementById('chat-view');
    const btnCloseChat = document.getElementById('btn-close-chat');
    const chatMessagesArea = document.getElementById('chat-messages-area');
    const chatInput = document.getElementById('chat-input-text');
    const btnSendChat = document.getElementById('btn-send-chat');
    const btnToggleStickers = document.getElementById('btn-toggle-stickers');
    const inputUploadSticker = document.getElementById('input-upload-sticker');
    
    // Ventanas emergentes (Modales)
    const modalLogin = document.getElementById('modal-login');
    const modalRegister = document.getElementById('modal-register');
    const modalCreate = document.getElementById('modal-create');
    const modalEditPost = document.getElementById('modal-edit-post');
    const modalView = document.getElementById('modal-view-post');
    const modalEditProfile = document.getElementById('modal-edit-profile');
    const modalRecover = document.getElementById('modal-recover');
    const modalShare = document.getElementById('modal-share');
    const modalUserProfile = document.getElementById('modal-user-profile');
    const allModals = [modalLogin, modalRegister, modalCreate, modalEditPost, modalView, modalEditProfile, modalRecover, modalShare, modalUserProfile];

    // --- FUNCIONES VISUALES (ABRIR/CERRAR VENTANAS) ---
    function openModal(modal) {
        modal.classList.add('active');
    }
    function closeModal(modal) {
        modal.classList.remove('active');
        // Limpiar formularios si existen dentro
        const form = modal.querySelector('form');
        if (form) form.reset();
    }

    // Cerrar modales al hacer click en la X o fuera del contenido
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal-overlay')));
    });
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) closeModal(e.target);
    });

    let typingTimer; // Variable para controlar el efecto y evitar superposiciones

    // --- CONTROL DE SESIÓN (SABER SI ESTÁS LOGUEADO) ---
    function checkSession() {
        const user = DB.getSession();
        
        // Aplicar tema visual (Plantilla)
        document.body.className = ''; // Limpiar clases anteriores
        if (user && user.theme) {
            document.body.classList.add('theme-' + user.theme);
        }

        // Actualizar subtítulo del tipo de blog
        const blogTypeSubtitle = document.getElementById('blog-type-subtitle');
        if (blogTypeSubtitle) {
            blogTypeSubtitle.textContent = (user && user.blogType) ? user.blogType : "Blog Personal";
        }
        
        // Actualizar el título principal con efecto de escritura (Typing Effect)
        const mainTitle = document.querySelector('.main-title');
        if (mainTitle) {
            const text = (user && user.blogTitle) ? user.blogTitle : "Leoshi Net";
            
            if (typingTimer) clearTimeout(typingTimer); // Detener animación anterior si existe
            mainTitle.innerText = ''; // Limpiar texto
            
            let i = 0;
            function type() {
                if (i < text.length) {
                    mainTitle.innerText += text.charAt(i);
                    i++;
                    typingTimer = setTimeout(type, 100); // Velocidad: 100ms por letra
                }
            }
            type();
        }

        if (user) {
            authLinks.classList.add('hidden');
            userInfo.classList.remove('hidden');
            fabCreate.classList.remove('hidden');
            fabCreate.textContent = user.fabText || 'Crear Nota +';
            usernameDisplay.textContent = user.name;
            if (user.avatar) {
                userAvatarNav.src = user.avatar;
                userAvatarNav.classList.remove('hidden');
            } else {
                userAvatarNav.classList.add('hidden');
            }
            renderChatMessages();
        } else {
            authLinks.classList.remove('hidden');
            userInfo.classList.add('hidden');
            fabCreate.classList.add('hidden');
        }
    }

    // Botones de Entrar/Salir
    document.getElementById('btn-login').addEventListener('click', (e) => { e.preventDefault(); openModal(modalLogin); });
    document.getElementById('btn-register').addEventListener('click', (e) => { e.preventDefault(); openModal(modalRegister); });
    document.getElementById('btn-edit-profile').addEventListener('click', (e) => { e.preventDefault(); loadEditProfile(); });
    document.getElementById('btn-logout').addEventListener('click', (e) => { 
        e.preventDefault(); 
        DB.clearSession(); 
        checkSession(); 
        alert('Has cerrado sesión.');
    });

    // Cuando te registras
    document.getElementById('form-register').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        // Límite de 5 usuarios (Recordatorio Leoshi: Quitar esto cuando paguemos el servidor)
        if (DB.getUsers().length >= 50) {
            alert('Lo sentimos, se ha alcanzado el límite máximo de 50 usuarios registrados en esta demo.');
            return;
        }

        if(DB.getUsers().find(u => u.email === email)) {
            alert('El email ya está registrado.');
            return;
        }

        const newUser = { name, email, password };
        DB.saveUser(newUser);
        DB.setSession(newUser); // Auto login
        closeModal(modalRegister);
        checkSession();
        alert('¡Registro exitoso! Bienvenido ' + name);
    });

    // Cuando inicias sesión
    document.getElementById('form-login').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const user = DB.findUser(email, password);
        if (user) {
            DB.setSession(user);
            closeModal(modalLogin);
            checkSession();
            alert('Bienvenido de nuevo, ' + user.name);
        } else {
            alert('Credenciales incorrectas.');
        }
    });

    // --- RECUPERAR CONTRASEÑA ---
    // Abrir modal de recuperación desde el login
    document.getElementById('link-recover').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(modalLogin);
        openModal(modalRecover);
    });

    document.getElementById('form-recover').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('recover-email').value;
        const newPass = document.getElementById('recover-new-password').value;

        const users = DB.getUsers();
        const userIndex = users.findIndex(u => u.email === email);

        if (userIndex !== -1) {
            users[userIndex].password = newPass;
            localStorage.setItem('leoshi_users', JSON.stringify(users));
            closeModal(modalRecover);
            alert('Contraseña actualizada correctamente. Por favor inicia sesión con tu nueva clave.');
            openModal(modalLogin);
        } else {
            alert('No encontramos ninguna cuenta con ese correo electrónico.');
        }
    });

    // --- PERFIL DE USUARIO ---
    function loadEditProfile() {
        const user = DB.getSession();
        if(!user) return;
        document.getElementById('edit-name').value = user.name;
        document.getElementById('edit-blog-title').value = user.blogTitle || '';
        document.getElementById('edit-blog-type').value = user.blogType || 'Blog Personal';
        document.getElementById('edit-theme').value = user.theme || 'default';
        document.getElementById('edit-fab-text').value = user.fabText || '';
        const skillsInput = document.getElementById('edit-skills');
        skillsInput.value = user.skills || '';
        
        // Cargar el avatar actual en la vista previa circular
        document.getElementById('edit-profile-avatar-preview').src = user.avatar || 'https://via.placeholder.com/100?text=U';
        
        // --- SKILLS INSTALLER (Generar sugerencias) ---
        const installerArea = document.getElementById('skills-installer-area');
        if (installerArea) {
            const popularSkills = ['HTML', 'CSS', 'JavaScript', 'Node.js', 'MySQL', 'React', 'Python', 'Git', 'Diseño UI', 'Figma', 'DevOps', 'PHP', 'Java'];
            installerArea.innerHTML = '<small style="display:block; width:100%; margin-bottom:5px; color:#777;">Instalador rápido (Click para añadir):</small>';
            
            popularSkills.forEach(skill => {
                const chip = document.createElement('span');
                chip.className = 'skill-chip-install';
                chip.textContent = '+ ' + skill;
                chip.onclick = () => {
                    const current = skillsInput.value ? skillsInput.value.split(',').map(s => s.trim()) : [];
                    if (!current.includes(skill)) {
                        current.push(skill);
                        skillsInput.value = current.join(', ');
                    }
                };
                installerArea.appendChild(chip);
            });
        }

        openModal(modalEditProfile);
    }

    // --- EDITOR DE FOTOS (RECORTAR Y ROTAR) ---
    const cropperImg = document.getElementById('cropper-img');
    const cropperContainer = document.getElementById('cropper-container');
    const cropperZoom = document.getElementById('cropper-zoom');
    const cropperRotate = document.getElementById('cropper-rotate');
    const cropperWrapper = document.getElementById('cropper-wrapper');
    let cropperState = { x: 0, y: 0, scale: 1, rotation: 0, isDragging: false, startX: 0, startY: 0 };

    document.getElementById('edit-avatar-file').addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                cropperImg.src = evt.target.result;
                // Actualizar también la vista previa circular al seleccionar una nueva imagen
                document.getElementById('edit-profile-avatar-preview').src = evt.target.result;
                cropperWrapper.classList.remove('hidden');
                // Reset state
                cropperState = { x: 0, y: 0, scale: 1, rotation: 0, isDragging: false };
                cropperZoom.value = 1;
                cropperRotate.value = 0;
                updateCropperTransform();
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    function updateCropperTransform() {
        // Aplicamos movimiento, escala y rotación
        cropperImg.style.transform = `translate(${cropperState.x}px, ${cropperState.y}px) scale(${cropperState.scale}) rotate(${cropperState.rotation}deg)`;
    }

    cropperZoom.addEventListener('input', (e) => {
        cropperState.scale = parseFloat(e.target.value);
        updateCropperTransform();
    });
    cropperRotate.addEventListener('input', (e) => {
        cropperState.rotation = parseInt(e.target.value);
        updateCropperTransform();
    });

    cropperContainer.addEventListener('mousedown', (e) => {
        cropperState.isDragging = true;
        cropperState.startX = e.clientX - cropperState.x;
        cropperState.startY = e.clientY - cropperState.y;
    });

    window.addEventListener('mousemove', (e) => {
        if (!cropperState.isDragging) return;
        e.preventDefault();
        cropperState.x = e.clientX - cropperState.startX;
        cropperState.y = e.clientY - cropperState.startY;
        updateCropperTransform();
    });

    window.addEventListener('mouseup', () => { cropperState.isDragging = false; });

    // Guardar perfil con la foto editada
    document.getElementById('form-edit-profile').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = DB.getSession();
        const newName = document.getElementById('edit-name').value;
        const newBlogTitle = document.getElementById('edit-blog-title').value;
        const newBlogType = document.getElementById('edit-blog-type').value;
        const newTheme = document.getElementById('edit-theme').value;
        const newFabText = document.getElementById('edit-fab-text').value;
        const newSkills = document.getElementById('edit-skills').value;
        const fileInput = document.getElementById('edit-avatar-file');

        const saveChanges = (avatarBase64) => {
            user.name = newName;
            user.blogTitle = newBlogTitle; // Guardamos el título personalizado
            user.blogType = newBlogType; // Guardamos el tipo de blog
            user.theme = newTheme; // Guardamos el tema seleccionado
            user.fabText = newFabText; // Guardamos el texto del botón
            user.skills = newSkills; // Guardamos las habilidades
            if (avatarBase64) user.avatar = avatarBase64;
            
            DB.updateUser(user);
            DB.setSession(user);
            closeModal(modalEditProfile);
            checkSession();
            alert('Perfil actualizado.');
        };

        if (fileInput.files && fileInput.files[0]) {
            // Procesar el recorte usando Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            // Tamaño final del avatar
            canvas.width = 200;
            canvas.height = 200;

            // Dibujar imagen transformada
            const img = cropperImg;
            
            // --- CORRECCIÓN DE GUARDADO (Sincronizar con vista previa CSS) ---
            // 1. Ajustar escala del canvas (200px) respecto al contenedor visual (250px)
            const ratio = canvas.width / 250;
            ctx.scale(ratio, ratio);

            // 2. Aplicar transformaciones en el mismo orden que CSS
            ctx.translate(cropperState.x, cropperState.y); // Traslación
            
            // Mover origen al centro de la imagen para rotar/escalar desde el centro
            ctx.translate(img.naturalWidth / 2, img.naturalHeight / 2);
            
            ctx.scale(cropperState.scale, cropperState.scale);
            ctx.rotate(cropperState.rotation * Math.PI / 180); // Rotación (Faltaba antes)
            
            ctx.drawImage(img, -img.naturalWidth/2, -img.naturalHeight/2);

            const croppedAvatar = canvas.toDataURL('image/jpeg');
            document.getElementById('edit-profile-avatar-preview').src = croppedAvatar; // Feedback visual inmediato
            saveChanges(croppedAvatar);
        } else {
            saveChanges(null);
        }
    });

    // --- COMPARTIR EN REDES ---
    function openShareModal(post = null) {
        const user = DB.getSession();
        
        // Si hay post, compartimos el post, si no, el perfil
        const shareUrl = post 
            ? `https://miblogdeleoshi.com/post/${post.id}` 
            : `https://miblogdeleoshi.com/user/${user ? user.name.replace(/\s+/g, '') : 'guest'}`;
        const textToShare = post ? `Mira este post: ${post.title}` : `¡Mira mi perfil en el Blog de Leoshi!`;

        // Configurar enlaces
        document.getElementById('share-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        document.getElementById('share-wa').href = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
        
        // Generar QR usando API pública
        document.getElementById('share-qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;
        document.getElementById('qr-username').textContent = post ? 'este post' : (user ? user.name : 'invitado');

        openModal(modalShare);
    }

    // --- LÓGICA DE LAS NOTAS (POSTS) ---
    
    // Mostrar las notas en la pantalla
    function renderPosts(filterText = '') {
        let posts = DB.getPosts();
        const currentUser = DB.getSession();
        
        if (filterText) {
            const lower = filterText.toLowerCase();
            posts = posts.filter(p => p.title.toLowerCase().includes(lower) || p.author.toLowerCase().includes(lower));
        }

        postsContainer.innerHTML = '';

        if (posts.length === 0) {
            postsContainer.innerHTML = '<p style="text-align:center; width:100%; color:#777;">No hay artículos aún. ¡Sé el primero en escribir!</p>';
            return;
        }

        posts.forEach((post, index) => {
            const article = document.createElement('article');
            article.className = 'post-preview';
            
            let mediaContent = '';
            if (post.type === 'video') {
                mediaContent = `<video src="${post.image}" class="post-video" controls></video>`;
            } else {
                const imgUrl = post.image || 'https://via.placeholder.com/400x200?text=Blog+Leoshi';
                mediaContent = `<img src="${imgUrl}" alt="${post.title}" class="post-img" loading="lazy">`;
            }
            
            const isAuthor = currentUser && post.author === currentUser.name;
            
            // Generar HTML de etiquetas
            const tagsHtml = post.tags ? `<div class="post-tags-list">${post.tags.split(',').map(t => `<span class="post-tag">#${t.trim()}</span>`).join('')}</div>` : '';

            article.innerHTML = `
                ${mediaContent}
                <div class="post-body">
                    <h2 class="post-title">${post.title}</h2>
                    <p class="post-meta">Por ${post.author} | ${post.date} | 👁️ ${post.views || 0}</p>
                    ${tagsHtml}
                    <div class="post-excerpt">${post.content.substring(0, 100)}...</div>
                    <div class="post-actions">
                        <a href="#" class="read-more" data-index="${index}">Leer más...</a>
                        <div style="display:flex; gap:10px;">
                            ${isAuthor ? `<span class="btn-edit-post" data-index="${index}" title="Editar Nota" style="cursor:pointer;">✏️</span>` : ''}
                            <span class="btn-share-post" data-index="${index}" title="Compartir">🔗</span>
                        </div>
                    </div>
                </div>
            `;
            postsContainer.appendChild(article);
        });

        // Eventos para "Leer más" (abrir modal en lugar de otra página)
        document.querySelectorAll('.read-more').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = e.target.getAttribute('data-index');
                showPostDetail(posts[index]);
            });
        });

        // Eventos para "Compartir"
        document.querySelectorAll('.btn-share-post').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = e.target.getAttribute('data-index');
                openShareModal(posts[index]);
            });
        });

        // Eventos para "Editar"
        document.querySelectorAll('.btn-edit-post').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = e.target.getAttribute('data-index');
                openEditPostModal(posts[index]);
            });
        });
    }

    // Ver nota completa
    function showPostDetail(post) {
        // Registrar visita (Analytics básico)
        DB.incrementPostViews(post.id);
        const updatedPost = DB.getPosts().find(p => p.id === post.id) || post;

        const container = document.getElementById('view-post-body');
        const commentsList = document.getElementById('comments-list');
        
        let mediaContent = '';
        if (updatedPost.type === 'video') {
            mediaContent = `<video src="${updatedPost.image}" class="full-post-video" controls autoplay></video>`;
        } else {
            mediaContent = `<img src="${updatedPost.image || 'https://via.placeholder.com/800x400?text=Blog+Leoshi'}" class="full-post-img" alt="${updatedPost.title}" loading="lazy">`;
        }
        
        // Renderizar contenido del post
        container.innerHTML = `
            ${mediaContent}
            <h1 class="full-post-title">${updatedPost.title}</h1>
            <p class="post-meta">Publicado por <b>${updatedPost.author}</b> el ${updatedPost.date} | 👁️ ${updatedPost.views || 0} Vistas</p>
            <div class="full-post-content">${updatedPost.content.replace(/\n/g, '<br>')}</div>
        `;

        // Renderizar comentarios
        renderComments(updatedPost.id);

        // Configurar formulario de comentarios
        const commentForm = document.getElementById('form-comment');
        // Clonar para eliminar listeners anteriores
        const newForm = commentForm.cloneNode(true);
        commentForm.parentNode.replaceChild(newForm, commentForm);
        
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = DB.getSession();
            if (!user) {
                alert('Debes iniciar sesión para comentar.');
                return;
            }
            const text = newForm.querySelector('textarea').value;
            const newComment = {
                author: user.name,
                text: text,
                date: new Date().toLocaleDateString()
            };
            DB.saveComment(updatedPost.id, newComment);
            newForm.reset();
            renderComments(updatedPost.id);
        });

        openModal(modalView);
    }

    // Mostrar comentarios
    function renderComments(postId) {
        const list = document.getElementById('comments-list');
        const comments = DB.getComments(postId);
        const users = DB.getUsers();
        const currentUser = DB.getSession();

        list.innerHTML = comments.map((c, index) => {
            // Buscar avatar del autor del comentario
            const authorUser = users.find(u => u.name === c.author);
            const avatarUrl = authorUser && authorUser.avatar ? authorUser.avatar : 'https://via.placeholder.com/32?text=U';
            
            // Datos de votos
            const likes = c.likes || [];
            const dislikes = c.dislikes || [];
            const userLiked = currentUser && likes.includes(currentUser.name);
            const userDisliked = currentUser && dislikes.includes(currentUser.name);

            return `
                <div class="comment-item">
                    <img src="${avatarUrl}" class="comment-avatar" alt="${c.author}">
                    <div>
                        <div class="comment-bubble">
                            <span class="comment-author">${c.author}</span>
                            <span class="comment-text">${c.text}</span>
                        </div>
                        <div class="comment-actions">
                            <span>${c.date}</span>
                            <button class="btn-comment-action ${userLiked ? 'active-like' : ''}" onclick="handleCommentVote(${postId}, ${index}, 'like')">
                                👍 ${likes.length || ''}
                            </button>
                            <button class="btn-comment-action ${userDisliked ? 'active-dislike' : ''}" onclick="handleCommentVote(${postId}, ${index}, 'dislike')">
                                👎 ${dislikes.length || ''}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('') || '<p style="font-size:0.8rem; color:#999;">Sé el primero en comentar.</p>';
    }

    // Función global para manejar los votos desde el HTML
    window.handleCommentVote = (postId, index, type) => {
        const user = DB.getSession();
        if (!user) return alert('Inicia sesión para votar comentarios.');
        
        DB.voteComment(postId, index, type, user.name);
        renderComments(postId); // Refrescar para ver cambios
    };

    // Crear Nueva Nota
    fabCreate.addEventListener('click', () => openModal(modalCreate));

    document.getElementById('form-create-post').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        const tags = document.getElementById('post-tags').value;
        const fileInput = document.getElementById('post-image-file');
        const user = DB.getSession();

        if (!user) {
            alert('Debes iniciar sesión.');
            return;
        }

        // Función para guardar el post (imgBase64 puede ser imagen o video en base64)
        const savePostToDB = (mediaBase64, type) => {
            const newPost = {
                id: Date.now(), // ID único temporal
                title,
                content,
                author: user.name,
                tags: tags, // Guardar etiquetas SEO
                date: new Date().toLocaleDateString(),
                likes: [], // Inicializar likes del post (futuro)
                dislikes: [],
                views: 0, // Inicializar contador de vistas
                image: mediaBase64, // Reutilizamos el campo image para la data
                type: type // 'image' o 'video'
            };
            DB.savePost(newPost);
            closeModal(modalCreate);
            renderPosts();
            alert('Artículo publicado con éxito (Guardado localmente).');
        };

        // Procesar imagen si existe
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const fileType = fileInput.files[0].type.startsWith('video') ? 'video' : 'image';
                savePostToDB(e.target.result, fileType); // Guardar como Base64
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            savePostToDB(null, 'image'); // Guardar sin imagen
        }
    });

    // --- EDITAR NOTA EXISTENTE ---
    function openEditPostModal(post) {
        document.getElementById('edit-post-id').value = post.id;
        document.getElementById('edit-post-title').value = post.title;
        document.getElementById('edit-post-content').value = post.content;
        document.getElementById('edit-post-tags').value = post.tags || '';
        document.getElementById('edit-post-image-file').value = ''; // Limpiar input file
        openModal(modalEditPost);
    }

    document.getElementById('form-edit-post').addEventListener('submit', (e) => {
        e.preventDefault();
        const postId = parseInt(document.getElementById('edit-post-id').value);
        const title = document.getElementById('edit-post-title').value;
        const content = document.getElementById('edit-post-content').value;
        const tags = document.getElementById('edit-post-tags').value;
        const fileInput = document.getElementById('edit-post-image-file');
        
        // Buscar el post original para mantener datos que no cambian (autor, fecha, imagen vieja si no hay nueva)
        const originalPost = DB.getPosts().find(p => p.id === postId);
        if (!originalPost) return;

        const saveUpdate = (mediaBase64, type) => {
            const updatedPost = {
                ...originalPost,
                title: title,
                content: content,
                tags: tags, // Actualizar etiquetas
                // Si hay nueva imagen/video, úsala. Si no, mantén la anterior.
                image: mediaBase64 || originalPost.image,
                type: type || originalPost.type
            };
            
            DB.updatePost(updatedPost);
            closeModal(modalEditPost);
            renderPosts();
            alert('Nota actualizada correctamente.');
        };

        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                const fileType = fileInput.files[0].type.startsWith('video') ? 'video' : 'image';
                saveUpdate(evt.target.result, fileType);
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            saveUpdate(null, null); // Mantener imagen/video anterior
        }
    });

    // --- BUSCADOR ---
    // Optimización: Función Debounce para evitar renderizar en cada tecla pulsada
    const debounce = (fn, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    };

    searchInput.addEventListener('input', debounce((e) => {
        renderPosts(e.target.value);
    }, 300));

    // --- CHAT GLOBAL ---
    
    // Abrir Chat (Vista)
    btnNavChat.addEventListener('click', () => {
        if (!DB.getSession()) return alert('Inicia sesión para ver los mensajes.');
        chatView.classList.remove('hidden');
        renderChatMessages();
    });

    // Cerrar Chat (Volver a Inicio)
    btnCloseChat.addEventListener('click', () => {
        chatView.classList.add('hidden');
    });
    
    btnToggleStickers.addEventListener('click', () => {
        document.getElementById('sticker-picker').classList.toggle('hidden');
    });

    // Función global para insertar emoji
    window.insertEmoji = (emoji) => {
        chatInput.value += emoji;
        document.getElementById('sticker-picker').classList.add('hidden');
        chatInput.focus();
    };

    // Función global para ver perfil desde el chat
    window.viewUserProfile = (username) => {
        const user = DB.getUsers().find(u => u.name === username);
        if (user) {
            document.getElementById('profile-view-name').textContent = user.name;
            document.getElementById('profile-view-avatar').src = user.avatar || 'https://via.placeholder.com/100?text=U';
            
            // Renderizar Skills
            const skillsContainer = document.getElementById('profile-view-skills');
            if (user.skills) {
                skillsContainer.innerHTML = user.skills.split(',').map(s => `<span class="skill-tag">${s.trim()}</span>`).join('');
            } else {
                skillsContainer.innerHTML = '';
            }
            openModal(modalUserProfile);
        }
    };

    // Subir Sticker Propio
    inputUploadSticker.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                sendChatMessage(null, evt.target.result); // Enviar imagen como mensaje
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    function sendChatMessage(text, image = null, author = null) {
        const user = author || DB.getSession(); // Usar autor proporcionado o el de la sesión
        if (!user) {
            alert('Inicia sesión para chatear');
            return;
        }
    
        const msg = {
            author: user.name,
            text: text,
            image: image,
            date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };

        DB.saveChatMessage(msg);
        renderChatMessages();
    
        // El bot solo responde a mensajes de usuarios reales (cuando no se pasa un autor)
        if (text && !author && typeof handleBotResponse === 'function') {
            handleBotResponse(text, sendChatMessage);
        }
    }

    function renderChatMessages() {
        const msgs = DB.getChatMessages();
        const currentUser = DB.getSession();
        const users = DB.getUsers();

        chatMessagesArea.innerHTML = msgs.map(m => {
            const isMine = currentUser && m.author === currentUser.name;
            // Añadir caso especial para el bot
            const authorUser = (typeof BOT_USER !== 'undefined' && m.author === BOT_USER.name) ? BOT_USER : users.find(u => u.name === m.author);
            const avatar = authorUser && authorUser.avatar ? authorUser.avatar : 'https://via.placeholder.com/30?text=U';
            const content = m.image ? `<img src="${m.image}" class="chat-msg-img" alt="Imagen enviada" loading="lazy">` : m.text;
            
            return `<div class="chat-msg ${isMine ? 'mine' : 'theirs'}">
                ${!isMine ? `<img src="${avatar}" class="chat-msg-avatar" onclick="viewUserProfile('${m.author}')" title="Ver perfil"> <b style="font-size:0.7rem">${m.author}</b><br>` : ''}
                ${content}
            </div>`;
        }).join('');
        
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }

    btnSendChat.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (text) {
            sendChatMessage(text);
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnSendChat.click();
    });

    // --- ARRANQUE DE LA PÁGINA ---
    checkSession();
    renderPosts();

});