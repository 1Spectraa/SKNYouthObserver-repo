import { signInWithEmailAndPassword, signOut, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js"
import { doc, getDoc} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js"
import { auth, db } from "./firebase"

// User Login

export async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
}

// User Logout

export async function logout(){
    await signOut(auth);
}

// Get Logged-In User

export function getCurrentUser() {
    return auth.getCurrentUser;
}
