// firebase-config.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, remove } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCTra71Vq4b0nPZ8hdfgY_Sxxr-REk9-9E",
    authDomain: "topup-2c5db.firebaseapp.com",
    databaseURL: "https://topup-2c5db-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "topup-2c5db",
    storageBucket: "topup-2c5db.firebasestorage.app",
    messagingSenderId: "384342388781",
    appId: "1:384342388781:web:230ec4dc05ede15d7588a4",
    measurementId: "G-QJY9J2Y6QZ"
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, update, remove };