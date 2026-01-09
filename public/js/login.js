import { login } from "./auth.js";

const form = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await login(emailInput.value, passwordInput.value);
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed: " + error.message);
  }
});
