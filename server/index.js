import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ override: true });

const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(
    `Faltan variables de entorno requeridas: ${missingEnvVars.join(", ")}`
  );
  console.error(
    "Crea un archivo .env usando .env.example y vuelve a iniciar el servidor."
  );
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT || 4000);
const creationDraftsTable = "creation_drafts";
const entrepreneurProfilesTable = "entrepreneur_profiles";
const geminiTextModel = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

const supabaseDb = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : supabase;

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          `Origen no permitido por CORS: ${origin}. Configura CLIENT_ORIGIN en .env.`
        )
      );
    },
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "alia-auth-api",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/ai/generate-description", upload.single("audio"), async (req, res) => {
  const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
  const audioFile = req.file;

  if (!notes && !audioFile) {
    res.status(400).json({
      message: "Envía texto o una nota de audio para generar la descripción.",
    });
    return;
  }

  if (!gemini) {
    res.status(500).json({
      message: "Falta GEMINI_API_KEY en el backend. Configúrala en .env.",
    });
    return;
  }

  const parts = [];
  let audioContext = null;

  if (audioFile) {
    parts.push({
      inlineData: {
        mimeType: audioFile.mimetype || "audio/webm",
        data: audioFile.buffer.toString("base64"),
      },
    });
    audioContext = `Audio recibido (${audioFile.originalname || "nota"}).`;
  }

  parts.push({
    text: buildDescriptionPrompt(notes),
  });

  try {
    const response = await gemini.models.generateContent({
      model: geminiTextModel,
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const parsed = parseDescriptionResponse(readResponseText(response));
    if (!parsed || !Array.isArray(parsed.options) || parsed.options.length === 0) {
      res.status(502).json({
        message: "No se pudo interpretar la respuesta de Gemini para la descripción.",
      });
      return;
    }

    res.json({
      message: "Opciones de descripción generadas.",
      source: "gemini",
      model: geminiTextModel,
      transcript: parsed.transcript || null,
      audioContext,
      options: parsed.options
        .filter((option) => option?.text)
        .map((option, index) => ({
          id: option.id || `option-${index + 1}`,
          label: option.label || `Opción ${index + 1}`,
          text: option.text.trim(),
        })),
    });
  } catch (error) {
    const mapped = mapGeminiError(error);
    res.status(mapped.status).json({ message: mapped.message, details: mapped.details });
  }
});

app.post("/api/ai/finalize", async (req, res) => {
  const {
    selectedDescription,
    notes = "",
    hasAudio = false,
    imageName = null,
  } = req.body ?? {};

  if (typeof selectedDescription !== "string" || !selectedDescription.trim()) {
    res.status(400).json({
      message: "Debes seleccionar o escribir una descripción final.",
    });
    return;
  }

  const insertPayload = {
    selected_description: selectedDescription.trim(),
    notes: typeof notes === "string" ? notes.trim() : "",
    image_mode: "original",
    has_audio: Boolean(hasAudio),
    image_name: typeof imageName === "string" ? imageName : null,
  };

  const { data, error } = await supabaseDb
    .from(creationDraftsTable)
    .insert(insertPayload)
    .select("id, selected_description, notes, image_mode, has_audio, image_name, created_at")
    .single();

  if (error) {
    res.status(mapDbErrorStatus(error)).json({
      message: mapDraftDbError(error, Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)),
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
    return;
  }

  res.status(201).json({
    message: "Borrador final guardado. Puedes publicarlo en el siguiente paso.",
    draft: toDraftResponse(data),
  });
});

app.get("/api/ai/finalize/:id", async (req, res) => {
  const { data, error } = await supabaseDb
    .from(creationDraftsTable)
    .select("id, selected_description, notes, image_mode, has_audio, image_name, created_at")
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) {
    res.status(mapDbErrorStatus(error)).json({
      message: mapDraftDbError(error, Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)),
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
    return;
  }

  if (!data) {
    res.status(404).json({ message: "No se encontró el borrador solicitado." });
    return;
  }

  res.json({ draft: toDraftResponse(data) });
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, fullName } = req.body ?? {};

  if (!isValidEmail(email)) {
    res.status(400).json({ message: "Correo inválido." });
    return;
  }

  if (!isValidPassword(password)) {
    res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres.",
    });
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password.trim(),
    options: {
      data: {
        full_name: typeof fullName === "string" ? fullName.trim() : null,
      },
    },
  });

  if (error) {
    res.status(400).json({ message: normalizeAuthError(error.message) });
    return;
  }

  const user = data.user
    ? {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name ?? null,
      }
    : null;

  const requiresEmailConfirmation = !data.session;

  res.status(201).json({
    message: requiresEmailConfirmation
      ? "Cuenta creada. Revisa tu correo para confirmar la cuenta."
      : "Cuenta creada correctamente.",
    user,
    session: toSessionResponse(data.session),
    requiresEmailConfirmation,
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!isValidEmail(email) || !isValidPassword(password)) {
    res.status(400).json({ message: "Credenciales inválidas." });
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  });

  if (error) {
    res.status(401).json({ message: normalizeAuthError(error.message) });
    return;
  }

  res.json({
    message: "Inicio de sesión exitoso.",
    user: {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name ?? null,
    },
    session: toSessionResponse(data.session),
  });
});

app.get("/api/auth/me", async (req, res) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ message: "Token no enviado." });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ message: "Token inválido o expirado." });
    return;
  }

  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name ?? null,
    },
  });
});

app.get("/api/profile/me", async (req, res) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ message: "Token no enviado." });
    return;
  }

  const authUser = await getAuthenticatedUser(token);
  if (!authUser) {
    res.status(401).json({ message: "Token inválido o expirado." });
    return;
  }

  const { data, error } = await supabaseDb
    .from(entrepreneurProfilesTable)
    .select("business_name, business_description, business_photo_url")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (error) {
    res.status(mapDbErrorStatus(error)).json({
      message: mapProfileDbError(error),
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
    return;
  }

  res.json({
    message: "Perfil cargado correctamente.",
    profile: toProfileResponse(data, authUser),
  });
});

app.put("/api/profile/me", async (req, res) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ message: "Token no enviado." });
    return;
  }

  const authUser = await getAuthenticatedUser(token);
  if (!authUser) {
    res.status(401).json({ message: "Token inválido o expirado." });
    return;
  }

  const businessName = sanitizeOptionalText(req.body?.businessName, 120);
  const businessDescription = sanitizeOptionalText(req.body?.businessDescription, 500);

  if (businessDescription.length > 500) {
    res.status(400).json({ message: "La descripción no puede superar 500 caracteres." });
    return;
  }

  const payload = {
    user_id: authUser.id,
    business_name: businessName,
    business_description: businessDescription,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseDb
    .from(entrepreneurProfilesTable)
    .upsert(payload, { onConflict: "user_id" })
    .select("business_name, business_description, business_photo_url")
    .single();

  if (error) {
    res.status(mapDbErrorStatus(error)).json({
      message: mapProfileDbError(error),
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
    return;
  }

  res.json({
    message: "Perfil actualizado correctamente.",
    profile: toProfileResponse(data, authUser),
  });
});

app.put("/api/profile/me/photo", upload.single("photo"), async (req, res) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ message: "Token no enviado." });
    return;
  }

  const authUser = await getAuthenticatedUser(token);
  if (!authUser) {
    res.status(401).json({ message: "Token inválido o expirado." });
    return;
  }

  const photoFile = req.file;
  if (!photoFile) {
    res.status(400).json({ message: "Debes enviar una foto para actualizar el perfil." });
    return;
  }

  const allowedMimes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedMimes.includes(photoFile.mimetype)) {
    res.status(400).json({ message: "Formato de imagen no permitido. Usa PNG, JPG o WebP." });
    return;
  }

  const encodedPhoto = `data:${photoFile.mimetype};base64,${photoFile.buffer.toString("base64")}`;
  const payload = {
    user_id: authUser.id,
    business_photo_url: encodedPhoto,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseDb
    .from(entrepreneurProfilesTable)
    .upsert(payload, { onConflict: "user_id" })
    .select("business_name, business_description, business_photo_url")
    .single();

  if (error) {
    res.status(mapDbErrorStatus(error)).json({
      message: mapProfileDbError(error),
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
    return;
  }

  res.json({
    message: "Foto actualizada correctamente.",
    profile: toProfileResponse(data, authUser),
  });
});

app.use((error, _req, res, _next) => {
  console.error("Unhandled API error:", error);
  res.status(500).json({ message: "Error interno del servidor." });
});

app.listen(port, () => {
  console.log(`API de autenticación corriendo en http://localhost:${port}`);
});

function isValidEmail(value) {
  return typeof value === "string" && /^\S+@\S+\.\S+$/.test(value.trim());
}

function isValidPassword(value) {
  return typeof value === "string" && value.trim().length >= 8;
}

function toSessionResponse(session) {
  if (!session) return null;

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in,
    tokenType: session.token_type,
  };
}

function getBearerToken(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

async function getAuthenticatedUser(token) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

function sanitizeOptionalText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function toProfileResponse(profileRow, user) {
  return {
    businessName: profileRow?.business_name ?? "",
    businessDescription: profileRow?.business_description ?? "",
    businessPhotoUrl: profileRow?.business_photo_url ?? "",
    accountEmail: user?.email ?? "",
    accountFullName: user?.user_metadata?.full_name ?? "",
  };
}

function normalizeAuthError(message = "") {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("email not confirmed")) {
    return "Debes confirmar tu correo antes de iniciar sesión.";
  }

  if (lowerMessage.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }

  if (lowerMessage.includes("user already registered")) {
    return "Este correo ya está registrado.";
  }

  return message || "Ocurrió un error de autenticación.";
}

function buildDescriptionPrompt(notes) {
  const notesLine = notes?.trim()
    ? `Texto de apoyo del usuario: "${notes.trim()}".`
    : "No hay texto adicional del usuario.";

  return `
Genera contenido comercial en español para un producto emprendedor.
${notesLine}

Si recibes audio, primero transcríbelo y úsalo como base principal.

Devuelve SOLO JSON válido con esta estructura:
{
  "transcript": "string o null",
  "options": [
    { "id": "impacto", "label": "Impacto comercial", "text": "..." },
    { "id": "emocional", "label": "Conexión emocional", "text": "..." },
    { "id": "redes", "label": "Estilo redes sociales", "text": "..." }
  ]
}

Cada texto debe ser persuasivo, claro y realista, sin exageraciones engañosas.
  `.trim();
}

function readResponseText(response) {
  if (typeof response?.text === "string") {
    return response.text;
  }

  if (typeof response?.text === "function") {
    return response.text();
  }

  const firstTextPart = response?.candidates?.[0]?.content?.parts?.find(
    (part) => typeof part?.text === "string"
  );
  return firstTextPart?.text || "";
}

function parseDescriptionResponse(rawText) {
  if (!rawText) return null;

  const cleanText = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleanText);
  } catch (_error) {
    return null;
  }
}

function mapGeminiError(error) {
  const rawMessage = error?.message || "Error desconocido de Gemini.";
  const status = Number(error?.status || error?.code) || 502;
  const lower = rawMessage.toLowerCase();

  if (lower.includes("api key")) {
    return {
      status: 401,
      message: "GEMINI_API_KEY inválida o no autorizada.",
      details: rawMessage,
    };
  }

  if (lower.includes("quota") || lower.includes("rate limit") || status === 429) {
    return {
      status: 429,
      message: "Se alcanzó el límite de uso de Gemini. Intenta más tarde o revisa tu cuota.",
      details: rawMessage,
    };
  }

  if (lower.includes("not found") || status === 404) {
    return {
      status: 404,
      message: "El modelo de Gemini no está disponible. Revisa GEMINI_TEXT_MODEL.",
      details: rawMessage,
    };
  }

  if (lower.includes("permission") || status === 403) {
    return {
      status: 403,
      message: "Tu cuenta/proyecto no tiene acceso a este modelo de Gemini.",
      details: rawMessage,
    };
  }

  return {
    status: status >= 400 && status < 600 ? status : 502,
    message: "Gemini devolvió un error durante el procesamiento.",
    details: rawMessage,
  };
}

function toDraftResponse(row) {
  return {
    id: row.id,
    selectedDescription: row.selected_description,
    notes: row.notes,
    imageMode: row.image_mode,
    hasAudio: row.has_audio,
    imageName: row.image_name,
    createdAt: row.created_at,
  };
}

function mapDbErrorStatus(error) {
  if (error?.code === "42P01") return 500;
  if (error?.code === "42501") return 403;
  return 400;
}

function mapDraftDbError(error, usingServiceRole) {
  if (error?.code === "42P01") {
    return `La tabla '${creationDraftsTable}' no existe en Supabase. Ejecuta el SQL de setup para crearla.`;
  }

  if (error?.code === "42501") {
    return usingServiceRole
      ? "No hay permisos suficientes para guardar el borrador. Revisa las políticas de la tabla."
      : "No hay permisos para guardar el borrador con la llave actual. Configura SUPABASE_SERVICE_ROLE_KEY en el backend.";
  }

  return error?.message || "No se pudo guardar el borrador en Supabase.";
}

function mapProfileDbError(error) {
  if (error?.code === "42P01") {
    return `La tabla '${entrepreneurProfilesTable}' no existe en Supabase. Ejecuta el SQL setup_entrepreneur_profiles.sql.`;
  }

  if (error?.code === "42501") {
    return "No hay permisos suficientes para gestionar el perfil del negocio.";
  }

  return error?.message || "No se pudo gestionar el perfil del negocio.";
}

