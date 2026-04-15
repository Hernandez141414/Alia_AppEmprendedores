import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

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
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "alia-auth-api",
    timestamp: new Date().toISOString(),
  });
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

