// FIX: Reverted to Firebase v8 compat syntax to resolve module export error.
// FIX: Use v9 compat imports to support v8 syntax.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// --- هشدار مهم ---
// مقادیر زیر را با اطلاعات واقعی پروژه Firebase خود جایگزین کنید.
// این اطلاعات را می‌توانید از بخش تنظیمات پروژه (Project Settings) در کنسول Firebase پیدا کنید.
const firebaseConfig = {
  apiKey: "AIzaSyCmgDmGeSpf6eWKleTMR3srLA6WCeYo5ng",
  authDomain: "anbare-dd102.firebaseapp.com",
  projectId: "anbare-dd102",
  storageBucket: "anbare-dd102.firebasestorage.app",
  messagingSenderId: "244278980400",
  appId: "1:244278980400:web:633d05973f6da6ddca62f5"
};


// بررسی می‌کند که آیا پیکربندی با مقادیر واقعی پر شده است یا خیر
const isConfigured = firebaseConfig.projectId !== "YOUR_PROJECT_ID" && firebaseConfig.apiKey !== "YOUR_API_KEY";

let app;
// FIX: Explicitly typed `db` for Firebase v8 Firestore instance.
let db: firebase.firestore.Firestore | null = null;

if (isConfigured) {
    try {
        // FIX: Use v8 initialization syntax.
        app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
    } catch (e) {
        console.error("خطا در راه‌اندازی Firebase:", e);
        // db null باقی می‌ماند و برنامه پیام خطا نمایش می‌دهد
    }
} else {
    console.error("پیکربندی Firebase انجام نشده است. لطفاً فایل firebase.ts را با اطلاعات پروژه خود به‌روزرسانی کنید.");
}

// نمونه Firestore را برای استفاده در سایر بخش‌های برنامه صادر می‌کند
export { db };