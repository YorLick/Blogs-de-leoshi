document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("edit-post-form");
  const titleInput = document.getElementById("title");
  const contentInput = document.getElementById("content");
  const feedbackMessage = document.getElementById("feedback-message");

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  if (!postId) {
    document.querySelector(".content").innerHTML =
      "<h1>Error: No se especificó un ID de post para editar.</h1>";
    return;
  }

  // 1. Cargar los datos actuales del post en el formulario
  fetch(`http://localhost:3000/api/posts/${postId}`)
    .then((response) => response.json())
    .then((post) => {
      titleInput.value = post.title;
      contentInput.value = post.content;
    })
    .catch((error) =>
      console.error("Error al cargar datos para editar:", error),
    );

  // 2. Manejar el envío del formulario para guardar los cambios
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    feedbackMessage.textContent = "Guardando...";
    feedbackMessage.style.color = "#333";

    const updatedPost = {
      title: titleInput.value,
      content: contentInput.value,
    };

    fetch(`http://localhost:3000/api/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPost),
    })
      .then((response) => {
        if (!response.ok) throw new Error("No se pudo guardar el post.");
        return response.json();
      })
      .then((data) => {
        feedbackMessage.textContent = "¡Cambios guardados con éxito!";
        feedbackMessage.style.color = "green";
        setTimeout(() => {
          window.location.href = `post.html?id=${postId}`;
        }, 2000);
      })
      .catch((error) => {
        feedbackMessage.textContent = `Error: ${error.message}`;
        feedbackMessage.style.color = "red";
      });
  });
});
