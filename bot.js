import TelegramBot
from "node-telegram-bot-api"

import {
  initializeApp
}
from "firebase/app"

import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc
}
from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDsE61F0Ze7jJffA7XapF112oZmpmSTmBM",
  authDomain: "carpet-crm-1fc8a.firebaseapp.com",
  projectId: "carpet-crm-1fc8a",
  storageBucket: "carpet-crm-1fc8a.firebasestorage.app",
  messagingSenderId: "216085452494",
  appId: "1:216085452494:web:fc7751aead7a62d29ae29f"
};

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const token = "7843106853:AAGDXuNZPv0jY6LRyWtoTJl0ZXJ6gWfcgVc"
const ADMIN_ID = 5793538486

const bot = new TelegramBot(
  token,
  {
    polling: true
  }
)

console.log("Bot ishga tushdi")

bot.onText(
  /\/start/,
  async (msg) => {

    const workersSnapshot = await getDocs(
      collection(db, "workers")
    )

    const workerDoc = workersSnapshot.docs.find((d) => {
      const data = d.data()

      return (
        data.telegramId &&
        Number(data.telegramId) === Number(msg.chat.id)
      )

    })

    // worker topilmasa
    if (!workerDoc) {

      return bot.sendMessage(
        msg.chat.id,
        "Siz ro‘yxatdan o‘tmagansiz"
      )

    }

    const worker = workerDoc.data()

    // admin yoki ega bo‘lsa
    if (
      worker.roles?.includes("admin") ||
      worker.roles?.includes("ega")
    ) {

      return bot.sendMessage(
        msg.chat.id,
        "Gilam CRM"
      )

    }

    // oddiy worker bo‘lsa
    bot.sendMessage(

      msg.chat.id,

      "Gilam CRM",

      {

        reply_markup: {

          keyboard: [

            [
              {
                text:
                  "Ishni boshlash"
              }
            ],

          ],

          resize_keyboard: true

        }

      }

    )

  }
)

bot.on(
  "message",
  async (msg) => {

    if (
      msg.text ===
      "Ishni boshlash"
    ) {

      // workerni topish
      const workersSnapshot = await getDocs(
        collection(db, "workers")
      )

      const workerDoc = workersSnapshot.docs.find((d) => {
        const data = d.data()

        return (
          data.telegramId &&
          Number(data.telegramId) === Number(msg.chat.id)
        )

      })

      // worker topilmasa
      if (!workerDoc) {

        return bot.sendMessage(
          msg.chat.id,
          "Siz ro‘yxatdan o‘tmagansiz"
        )

      }

      const worker = workerDoc.data()

      // allaqachon ishlayotgan bo‘lsa
      if (worker.working) {

        return bot.sendMessage(
          msg.chat.id,
          "Siz allaqachon ish boshlagansiz ✅"
        )

      }

      await bot.sendMessage(
        msg.chat.id,
        "Admin tasdiqlashini kuting ⏳"
      )

      await bot.sendMessage(

        ADMIN_ID,

        `${msg.from.first_name} ish boshlamoqchi 👷`,

        {
          reply_markup: {

            inline_keyboard: [[

              {
                text: "Tasdiqlash ✅",
                callback_data:
                  `approve_${msg.chat.id}`
              },

              {
                text: "Rad ❌",
                callback_data:
                  `reject_${msg.chat.id}`
              }

            ]]

          }

        }

      )

    }

  }
)

bot.on(
  "callback_query",
  async (query) => {

    const data =
      query.data

    if (data.startsWith("approve_")) {

  const workerId = data.split("_")[1]

  const workersSnapshot = await getDocs(
    collection(db, "workers")
  )

  const workerDoc = workersSnapshot.docs.find(
    (d) => String(d.data().telegramId) === String(workerId)
  )

  if (!workerDoc) {

    return bot.sendMessage(
      query.message.chat.id,
      "Worker topilmadi ❌"
    )

  }

  await updateDoc(
    doc(db, "workers", workerDoc.id),
    {
      working: true,
      status: "faol",
      startedAt: new Date()
    }
  )

  await bot.sendMessage(
    workerId,
    "Tasdiqlandi ✅\n\nIshni boshlashingiz mumkin"
  )

  await bot.editMessageText(
    "Tasdiqlandi ✅",
    {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id
    }
  )

}

    if (
      data.startsWith(
        "reject_"
      )
    ) {

      const workerId = data.split("_")[1]

      await bot.sendMessage(
        workerId,
        "So‘rovingiz rad etildi ❌"
      )

      const workersSnapshot = await getDocs(collection(db, "workers"))
      const workerDoc = workersSnapshot.docs.find((d) => {

        const data = d.data()

        return (
          data.telegramId &&
          Number(data.telegramId) === Number(workerId)
        )

      })

      if (workerDoc) {

        await updateDoc(
          doc(
            db,
            "workers",
            workerDoc.id
          ),
          {working: false}
        )

      }

    }

  }
)

bot.onText(
  /\/id/,
  (msg) => {

    bot.sendMessage(
      msg.chat.id,
      `Sizning ID: ${msg.chat.id}`
    )

  }
)

bot.sendMessage(
  5793538486,
  "Test xabar 🚀"
)

import express from "express"

const server = express()

server.get("/", (req, res) => {
  res.send("Bot ishlayapti")
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log("Server started")
})