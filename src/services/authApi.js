const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function registerUser(payload) {
  return postJson("/api/auth/register", payload);
}

export async function loginUser(payload) {
  return postJson("/api/auth/login", payload);
}

async function postJson(path, payload) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || "No se pudo completar la solicitud.");
  }

  return body;
}

