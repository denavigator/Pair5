import fs from "fs"
import path from "path"

export async function createSessionString(dir) {
  const creds = fs.readFileSync(
    path.join(dir, "creds.json"),
    "utf8"
  )
  return Buffer.from(creds).toString("base64")
}
