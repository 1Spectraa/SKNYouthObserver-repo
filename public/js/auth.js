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

// Get user's role from Firestore

export async function getUserRole(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
        return userDoc.data().role;
    } else {
        throw new Error("No user record found");
    }
}

// Protect admin/editor pages | allowedRoles = ['admin', 'editor']

export function protectPage(allowedRoles) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const role = await getUserRole(user.uid);
                if (!allowedRoles.includes(role)) {
                    window.location.href = "/unauthorized.html";
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
                window.location.href = "/login.html";
            }
        } else {
            window.location.href = "/login.html";
        }
    });
}