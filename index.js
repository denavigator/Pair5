import express from "express"
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys"
import Pino from "pino"
import fs from "fs"
import { createSessionString } from "./session.js"

const app = express()
const PORT = process.env.PORT || 3000

let pairingCode = "WAITING..."
let sessionString = "NOT GENERATED"

async function startPair() {
  const sessionPath = "./auth/LUKTECH_MD_SESSION"
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

  const sock = makeWASocket({
    auth: state,
    logger: Pino({ level: "silent" }),
    printQRInTerminal: false
  })

  sock.ev.on("creds.update", async () => {
    await saveCreds()
    sessionString = await createSessionString(sessionPath)
  })

  if (!state.creds.registered) {
    const phone = process.env.PHONE_NUMBER
    if (!phone) return console.log("❌ PHONE_NUMBER missing")

    pairingCode = await sock.requestPairingCode(
      phone.replace(/[^0-9]/g, "")
    )

    console.log("🔢 LUKTECH MD PAIR CODE:", pairingCode)
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ LUKTECH MD SESSION CONNECTED")
    }
    if (
      connection === "close" &&
      lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut
    ) {
      startPair()
    }
  })
}

startPair()

app.get("/", (_, res) => {
  res.send(`
  <h2>LUKTECH MD SESSION GENERATOR 🇺🇬</h2>
  <h3>Pair Code</h3>
  <h1>${pairingCode}</h1>
  <h3>Session ID</h3>
  <textarea rows="6" cols="80">${sessionString}</textarea>
  <p>WhatsApp → Linked Devices → Link with phone number</p>
  `)
})

app.listen(PORT, () =>
  console.log(`🌐 Running on port ${PORT}`)
)
