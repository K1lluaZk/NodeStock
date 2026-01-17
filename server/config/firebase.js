import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path'; // <--- ESTA ES LA LÍNEA QUE FALTA
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Construimos la ruta al JSON que ya moviste a esta carpeta
const serviceAccountPath = path.join(__dirname, 'nodestock-81f9a-firebase-adminsdk-fbsvc-0ff288052e.json');

try {
  const serviceAccount = JSON.parse(
    readFileSync(serviceAccountPath, 'utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✅ Firebase conectado correctamente");
} catch (error) {
  console.error("❌ Error al leer el archivo JSON de Firebase:", error.message);
}

export const db = admin.firestore();