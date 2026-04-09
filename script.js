const form = document.getElementById("login-form");
const passwordInput = document.getElementById("password");
const emailInput = document.getElementById("email");
const toggleButton = document.getElementById("toggle-password");
const message = document.getElementById("form-message");

toggleButton.addEventListener("click", () => {
  const isVisible = passwordInput.type === "text";
  passwordInput.type = isVisible ? "password" : "text";
  toggleButton.dataset.visible = String(!isVisible);
  toggleButton.setAttribute(
    "aria-label",
    isVisible ? "Mostrar contraseña" : "Ocultar contraseña"
  );
  toggleButton.title = isVisible ? "Mostrar contraseña" : "Ocultar contraseña";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setMessage("Completa correo y contraseña para continuar.", true);
    return;
  }

  if (password.length < 8) {
    setMessage("Tu contraseña debe tener al menos 8 caracteres.", true);
    return;
  }

  setMessage("Login listo. Siguiente paso: conectar con tu API de autenticación.");
});

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

