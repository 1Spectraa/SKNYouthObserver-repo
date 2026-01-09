import {login} from "./auth.js";

document.querySelector("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = document.passwordInput.value;

    try {
        await login(email, password);
        window.location.href = "/dashboard.html"; // Redirect to dashboard on successful login
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed: " + error.message);
    }
});