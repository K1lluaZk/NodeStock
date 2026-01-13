import admin from "firebase-admin"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const serviceAccountPath = path.join(
  __dirname,
  "nodestock-81f9a-firebase-adminsdk-fbsvc-0ff288052e.json"
)

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

export const db = admin.firestore()
