const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function requestDescriptionGeneration({ notes, audioBlob }) {
  const formData = new FormData();

  if (typeof notes === "string" && notes.trim()) {
    formData.append("notes", notes.trim());
  }

  if (audioBlob) {
    formData.append("audio", audioBlob, "nota-audio.webm");
  }

  return postFormData("/api/ai/generate-description", formData);
}

export async function finalizeCreationDraft(payload) {
  return postJson("/api/ai/finalize", payload);
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

async function postFormData(path, formData) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    body: formData,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || "No se pudo completar la solicitud.");
  }

  return body;
}

