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
  doc,
  query,
  where,
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
      worker.role === "admin" ||
      worker.role ==="ega"
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

    )

  }
)

const adminState = {};


bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id;

  const workerSnap = await getDocs(collection(db, "workers"));

  const worker = workerSnap.docs
  .map(d => d.data())
  .find(w => w.telegramId == chatId);

  if (!worker || worker.role !== "ega") {
    return bot.sendMessage(chatId, "⛔️ Sizda ruxsat yo'q.");
  }

  bot.sendMessage(chatId, "Admin panel", {
    reply_markup: {
      keyboard: [
        ["📢 Yangilanish yuborish"]
      ],
      resize_keyboard: true
    }
  });
});


bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "📢 Yangilanish yuborish") {
    adminState[chatId] = {
      step: "version"
    };

    return bot.sendMessage(
      chatId,
      "🆕 Versiyani kiriting.\n\nMasalan: v1.2.0"
    );
  }

  if (adminState[chatId]?.step === "version") {
    adminState[chatId].version = text;
    adminState[chatId].step = "message";

    return bot.sendMessage(
      chatId,
        "📝 Endi yangilanish matnini yuboring."
    );
  }

  if (adminState[chatId]?.step === "message") {
    adminState[chatId].message = text;
    adminState[chatId].step = "confirm";

    return bot.sendMessage(
      chatId,
      `📢 Tasdiqlang

🆕 Versiya: ${adminState[chatId].version}

${adminState[chatId].message}`,
      {
        reply_markup: {
          keyboard: [
            ["✅ Yuborish", "❌ Bekor qilish"]
          ],
          resize_keyboard: true
        }
      }
    );
  }

  if (text === "❌ Bekor qilish") {
    delete adminState[chatId];

    return bot.sendMessage(chatId, "❌ Bekor qilindi.", {
      reply_markup: {
        remove_keyboard: true,
      },
    });
  }

  if (text === "✅ Yuborish") {
    const state = adminState[chatId];

    if (!state || state.step !== "confirm") {
      return;
    }

    const workersSnapshot = await getDocs(collection(db, "workers"));

    let count = 0;

    for (const workerDoc of workersSnapshot.docs) {
      const worker = workerDoc.data();

      if (!worker.telegramId) continue;

      try {
        await bot.sendMessage(
          worker.telegramId,
          `📢  Sayt yangilandi!

🆕 Versiya: Sakura ${state.version}

Yangilanish haqida:

${state.message}

🔄 Yangilanishni ko'rish uchun saytni qayta yuklang.`
        );

        count++;
      } catch (err) {
        console.log(worker.name, err.message);
      }
    }

    delete adminState[chatId];

    return bot.sendMessage(
      chatId,
      `✅ ${count} ta workerga yuborildi.`,
      {
        reply_markup: {
          remove_keyboard: true,
        },
      }
    );
  }

});


setInterval(async () => {

  const ordersSnapshot = await getDocs(

    query(
      collection(db, "orders"),
      where("status", "==", "Yangi"),
      where("driverNotified", "==", false)
    )

  )

  for (const orderDoc of ordersSnapshot.docs) {

    const order = orderDoc.data()

    const workersSnapshot = await getDocs(
      collection(db, "workers")
    )

    const drivers = workersSnapshot.docs.filter((d) => {

      const worker = d.data()

      return (
        worker.telegramId &&
        (worker.role === "driver" ||
          worker.role === "admin" ||
          worker.role === "ega"
        )
      )

    })

    for (const driver of drivers) {

      await bot.sendMessage(

        driver.data().telegramId,

        `🚚 Yangi buyurtma

📞 ${order.phone}
    
📍 ${order.address}
    
📦 Tarif: ${order.tarif}`

      )

    }

    await updateDoc(
      doc(db, "orders", orderDoc.id),
      {
        driverNotified: true
      }
    )

  }

}, 5000)

setInterval(async () => {

  const ordersSnapshot = await getDocs(

    query(
      collection(db, "orders"),
      where("status", "==", "Olindi"),
      where("washerNotified", "==", false)
    )

  )

  for (const orderDoc of ordersSnapshot.docs) {

    const order = orderDoc.data()

    const workersSnapshot = await getDocs(
      collection(db, "workers")
    )

    const washers = workersSnapshot.docs.filter((d) => {

      const worker = d.data()

      return (
        worker.telegramId &&
        worker.role === "washer"
      )

    })

    for (const washer of washers) {

      try {

        let details = ""

        if (order.carpetCount) {details += `🧵 Gilam: ${order.carpetCount}\n`}
        if (order.kvm) {details += `📐 Kv.m: ${order.kvm}\n`}
        if (order.blanket) {details += `🛏 Adyol: ${order.blanket}\n`}
        if (order.yakandoz) {details += `🪑 Yakandoz: ${order.yakandoz}\n`}
        if (order.curtainCount) {details += `🪟 Parda: ${order.curtainCount}\n`}
        if (order.curtainMeter) {details += `📏 Metri: ${order.curtainMeter}\n`}
        
        await bot.sendMessage(
          washer.data().telegramId,
`🧺 Yangi buyurtma keldi

📞 ${order.phone}
📍 ${order.address}

${details}
📦 Tarif: ${order.tarif}`
        )

      } catch (err) {

        console.log(
          "Washer xabari xatosi:",
          err.message
        )

      }

    }

    await updateDoc(
      doc(db, "orders", orderDoc.id),
      {
        washerNotified: true
      }
    )

  }

}, 5000)

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
  "bot yangilandi"
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

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT ERROR:", err)
})

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION:", err)
})