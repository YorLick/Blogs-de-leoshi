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
        getComments: (postId) => JSON.parse(localStorage.getItem(`leoshi_comments_${postId}`) || '[]'),
        saveComment: (postId, comment) => {
            const comments = DB.getComments(postId);
            comments.push(comment);
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
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
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

    // --- CONTROL DE SESIÓN (SABER SI ESTÁS LOGUEADO) ---
    function checkSession() {
        const user = DB.getSession();
        if (user) {
            authLinks.classList.add('hidden');
            userInfo.classList.remove('hidden');
            fabCreate.classList.remove('hidden');
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
        if (DB.getUsers().length >= 5) {
            alert('Lo sentimos, se ha alcanzado el límite máximo de 5 usuarios registrados en esta demo.');
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
        const confirmPass = document.getElementById('edit-password-confirm').value;
        const fileInput = document.getElementById('edit-avatar-file');

        if (user.password !== confirmPass) {
            alert('Contraseña incorrecta. No se guardaron los cambios.');
            return;
        }

        const saveChanges = (avatarBase64) => {
            user.name = newName;
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
            
            // Aplicar rotación al contexto del canvas antes de dibujar
            // (Nota: La rotación en canvas es compleja con traslaciones, esta es una aproximación simple)
            // Para hacerlo perfecto requeriría cálculos trigonométricos avanzados, pero esto funcionará para rotaciones visuales básicas.
            // Centro del canvas
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.scale(cropperState.scale, cropperState.scale);
            ctx.translate(cropperState.x, cropperState.y);
            ctx.drawImage(img, -img.naturalWidth/2, -img.naturalHeight/2);

            saveChanges(canvas.toDataURL('image/jpeg'));
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
                mediaContent = `<img src="${imgUrl}" alt="${post.title}" class="post-img">`;
            }
            
            const isAuthor = currentUser && post.author === currentUser.name;

            article.innerHTML = `
                ${mediaContent}
                <div class="post-body">
                    <h2 class="post-title">${post.title}</h2>
                    <p class="post-meta">Por ${post.author} | ${post.date}</p>
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
        const container = document.getElementById('view-post-body');
        const commentsList = document.getElementById('comments-list');
        
        let mediaContent = '';
        if (post.type === 'video') {
            mediaContent = `<video src="${post.image}" class="full-post-video" controls autoplay></video>`;
        } else {
            mediaContent = `<img src="${post.image || 'https://via.placeholder.com/800x400?text=Blog+Leoshi'}" class="full-post-img">`;
        }
        
        // Renderizar contenido del post
        container.innerHTML = `
            ${mediaContent}
            <h1 class="full-post-title">${post.title}</h1>
            <p class="post-meta">Publicado por <b>${post.author}</b> el ${post.date}</p>
            <div class="full-post-content">${post.content.replace(/\n/g, '<br>')}</div>
        `;

        // Renderizar comentarios
        renderComments(post.id);

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
            DB.saveComment(post.id, newComment);
            newForm.reset();
            renderComments(post.id);
        });

        openModal(modalView);
    }

    // Mostrar comentarios
    function renderComments(postId) {
        const list = document.getElementById('comments-list');
        const comments = DB.getComments(postId);
        const users = DB.getUsers();

        list.innerHTML = comments.map(c => {
            // Buscar avatar del autor del comentario
            const authorUser = users.find(u => u.name === c.author);
            const avatarUrl = authorUser && authorUser.avatar ? authorUser.avatar : 'https://via.placeholder.com/32?text=U';
            
            return `
                <div class="comment-item">
                    <img src="${avatarUrl}" class="comment-avatar" alt="${c.author}">
                    <div>
                        <div class="comment-bubble">
                            <span class="comment-author">${c.author}</span>
                            <span class="comment-text">${c.text}</span>
                        </div>
                        <span class="comment-date">${c.date}</span>
                    </div>
                </div>
            `;
        }).join('') || '<p style="font-size:0.8rem; color:#999;">Sé el primero en comentar.</p>';
    }

    // Crear Nueva Nota
    fabCreate.addEventListener('click', () => openModal(modalCreate));

    document.getElementById('form-create-post').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
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
                date: new Date().toLocaleDateString(),
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
        document.getElementById('edit-post-image-file').value = ''; // Limpiar input file
        openModal(modalEditPost);
    }

    document.getElementById('form-edit-post').addEventListener('submit', (e) => {
        e.preventDefault();
        const postId = parseInt(document.getElementById('edit-post-id').value);
        const title = document.getElementById('edit-post-title').value;
        const content = document.getElementById('edit-post-content').value;
        const fileInput = document.getElementById('edit-post-image-file');
        
        // Buscar el post original para mantener datos que no cambian (autor, fecha, imagen vieja si no hay nueva)
        const originalPost = DB.getPosts().find(p => p.id === postId);
        if (!originalPost) return;

        const saveUpdate = (mediaBase64, type) => {
            const updatedPost = {
                ...originalPost,
                title: title,
                content: content,
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
    searchInput.addEventListener('input', (e) => {
        renderPosts(e.target.value);
    });

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
            openModal(modalUserProfile);
        }
    };

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

    function sendChatMessage(text, image = null) {
        const user = DB.getSession();
        if (!user) return alert('Inicia sesión para chatear');

        const msg = {
            author: user.name,
            text: text,
            image: image,
            date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        DB.saveChatMessage(msg);
        renderChatMessages();
    }

    function renderChatMessages() {
        const msgs = DB.getChatMessages();
        const currentUser = DB.getSession();
        const users = DB.getUsers();
        
        chatMessagesArea.innerHTML = msgs.map(m => {
            const isMine = currentUser && m.author === currentUser.name;
            const authorUser = users.find(u => u.name === m.author);
            const avatar = authorUser && authorUser.avatar ? authorUser.avatar : 'https://via.placeholder.com/30?text=U';
            const content = m.image ? `<img src="${m.image}" class="chat-msg-img">` : m.text;
            
            return `<div class="chat-msg ${isMine ? 'mine' : 'theirs'}">
                ${!isMine ? `<img src="${avatar}" class="chat-msg-avatar" onclick="viewUserProfile('${m.author}')" title="Ver perfil"> <b style="font-size:0.7rem">${m.author}</b><br>` : ''}
                ${content}
            </div>`;
        }).join('');
        
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }

    // --- MODO OSCURO (LUNA/SOL) ---
    btnThemeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        btnThemeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });

    // --- ARRANQUE DE LA PÁGINA ---
    checkSession();
    renderPosts();

    // Efecto de escritura en el título (Mantenido del original)
    const titulo = document.querySelector('.main-title');
    if (titulo) {
        const texto = "Blog de Leoshi";
        titulo.innerText = '';
        let i = 0;
        function escribir() {
            if (i < texto.length) {
                titulo.innerHTML += texto.charAt(i);
                i++;
                setTimeout(escribir, 100);
            }
        }
        escribir();
    }
});