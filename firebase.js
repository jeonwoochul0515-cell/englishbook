import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js";

let app;
let auth;
let db;
let onLoginStateChangeCallback;

export function initFirebase(config, onLoginStateChange) {
    try {
        if (typeof config === 'string') {
            config = JSON.parse(config.trim());
        }
        app = initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app);
        onLoginStateChangeCallback = onLoginStateChange;

        onAuthStateChanged(auth, user => {
            onLoginStateChangeCallback(user);
        });
        return true;
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        return false;
    }
}

export function login() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
}

export function logout() {
    return signOut(auth);
}

export async function saveUserData(userId, data) {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    try {
        await setDoc(userRef, data, { merge: true });
    } catch (error) {
        console.error("Error saving user data:", error);
    }
}

export async function loadUserData(userId) {
    if (!db) return null;
    const userRef = doc(db, "users", userId);
    try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        return null;
    }
}
