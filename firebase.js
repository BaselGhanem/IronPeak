import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, collection, query, where, orderBy, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCxuFGMSbDEOVjy1buAM4i6XeJ57FIGuiY",
  authDomain: "goldenpeak-f8a0d.firebaseapp.com",
  projectId: "goldenpeak-f8a0d",
  storageBucket: "goldenpeak-f8a0d.firebasestorage.app",
  messagingSenderId: "935788401204",
  appId: "1:935788401204:web:448b2521962ac533807061"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// تمرير كل الوظائف للـ window عشان app.js يشوفهم
window.firebaseDB = db;
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.getDocs = getDocs;
window.addDoc = addDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.collection = collection;
window.query = query;
window.orderBy = orderBy;
window.firebaseTimestamp = Timestamp;

console.log("Firebase Connected Successfully!");
