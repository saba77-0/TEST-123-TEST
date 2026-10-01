
document.addEventListener("DOMContentLoaded", () => {
  // ავტორიზაციის შემდეგ: თუ redirectAfterLogin შენახულია - იქ გადადის, თორემ index.html-ზე
  function redirectAfterAuth() {
    const redirectUrl = localStorage.getItem("redirectAfterLogin");
    if (redirectUrl) {
      localStorage.removeItem("redirectAfterLogin");
      window.location.href = redirectUrl;
    } else {
      window.location.href = "index.html";
    }
  }

  // REGISTER (register.html): POST /auth/register, წარმატებისას verify-email.html-ზე გადადის
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errEl = document.getElementById("registerError");
      errEl.classList.add("hidden");

      const firstName = document.getElementById("regFirstName").value.trim();
      const lastName = document.getElementById("regLastName").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const password = document.getElementById("regPassword").value;

      try {
        const res = await fetch("https://bookingapi.stepacademy.ge/api/auth/register", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password
          })
        });

        const resData = await res.json();

        if (res.ok) {
          sessionStorage.setItem("verify_email", email);
          window.location.href = "verify-email.html";
        } else {
          errEl.textContent = resData.detail || resData.message || "Registration failed";
          errEl.classList.remove("hidden");
        }
      } catch (err) {
        errEl.textContent = "Network error. Please try again.";
        errEl.classList.remove("hidden");
      }
    });
  }

  // EMAIL VERIFY (verify-email.html): PUT /auth/verify-email კოდით.
  // წარმატებისას ტოკენი ინახება localStorage-ში და ხდება redirect.
  // 'Resend Code' ღილაკი კოდს თავიდან აგზავნის
  const verifyForm = document.getElementById("verifyForm");
  if (verifyForm) {
    const emailToVerify = sessionStorage.getItem("verify_email") || "";
    const errEl = document.getElementById("verifyError");
    const successEl = document.getElementById("verifySuccess");
    const resendBtn = document.getElementById("resendCodeBtn");

    verifyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errEl.classList.add("hidden");
      successEl.classList.add("hidden");

      const code = document.getElementById("verifyCodeInput").value.trim();

      try {
        const res = await fetch("https://bookingapi.stepacademy.ge/api/auth/verify-email", {
          method: "PUT",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: emailToVerify,
            code: code
          })
        });

        const resData = await res.json();

        const token = (resData && resData.data && (resData.data.accessToken || resData.data.token)) || (resData && (resData.accessToken || resData.token)) || (typeof resData?.data === "string" ? resData.data : null);
        const refreshToken = (resData && resData.data && resData.data.refreshToken) || (resData && resData.refreshToken) || "";

        if (res.ok && token) {
          localStorage.setItem("token", token);
          if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
          sessionStorage.removeItem("verify_email");
          redirectAfterAuth();
        } else {
          errEl.textContent = resData.detail || resData.message || "Invalid verification code.";
          errEl.classList.remove("hidden");
        }
      } catch (err) {
        errEl.textContent = "Network error. Please try again.";
        errEl.classList.remove("hidden");
      }
    });

    if (resendBtn) {
      resendBtn.addEventListener("click", async () => {
        if (!emailToVerify) {
          errEl.textContent = "Email address not found.";
          errEl.classList.remove("hidden");
          return;
        }

        try {
          const res = await fetch(`https://bookingapi.stepacademy.ge/api/auth/resend-email-verification/${encodeURIComponent(emailToVerify)}`, {
            headers: { "accept": "application/json" }
          });

          if (res.ok) {
            successEl.textContent = "Verification code resent successfully!";
            successEl.classList.remove("hidden");
          } else {
            errEl.textContent = "Failed to resend code.";
            errEl.classList.remove("hidden");
          }
        } catch (err) {
          errEl.textContent = "Network error.";
          errEl.classList.remove("hidden");
        }
      });
    }
  }

  // LOGIN (login.html): POST /auth/login. ტოკენი (accessToken/token) ინახება localStorage-ში
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errEl = document.getElementById("loginError");
      errEl.classList.add("hidden");

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      try {
        const res = await fetch("https://bookingapi.stepacademy.ge/api/auth/login", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            password: password
          })
        });

        const resData = await res.json();

        const token = (resData && resData.data && (resData.data.accessToken || resData.data.token)) || (resData && (resData.accessToken || resData.token)) || (typeof resData?.data === "string" ? resData.data : null);
        const refreshToken = (resData && resData.data && resData.data.refreshToken) || (resData && resData.refreshToken) || "";

        if (res.ok && token) {
          localStorage.setItem("token", token);
          if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
          redirectAfterAuth();
        } else {
          errEl.textContent = resData.detail || resData.message || "Invalid email or password.";
          errEl.classList.remove("hidden");
        }
      } catch (err) {
        errEl.textContent = "Network error. Please try again.";
        errEl.classList.remove("hidden");
      }
    });
  }

  // FORGOT PASSWORD (forgot-password.html): GET /auth/forget-password/{email}
  const forgotForm = document.getElementById("forgotForm");
  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errEl = document.getElementById("forgotError");
      const successEl = document.getElementById("forgotSuccess");
      errEl.classList.add("hidden");
      successEl.classList.add("hidden");

      const email = document.getElementById("forgotEmail").value.trim();

      try {
        const res = await fetch(`https://bookingapi.stepacademy.ge/api/auth/forget-password/${encodeURIComponent(email)}`, {
          headers: { "accept": "application/json" }
        });

        if (res.ok) {
          successEl.textContent = "If the email exists, a reset link has been sent.";
          successEl.classList.remove("hidden");
        } else {
          errEl.textContent = "Unable to process request.";
          errEl.classList.remove("hidden");
        }
      } catch (err) {
        errEl.textContent = "Network error. Please try again.";
        errEl.classList.remove("hidden");
      }
    });
  }
});

// ⚠️ ძველი ბურგერ-მენიუს კოდი. HTML-ში #mobileMenuBtn / #navMenu აღარ არსებობს,
//    ამიტომ ეს ბლოკი არაფერს აკეთებს. ახლანდელი მენიუ არის nav.js-ში. ამის წაშლა უსაფრთხოა.
document.addEventListener("DOMContentLoaded", () => {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navMenu = document.getElementById("navMenu");

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      navMenu.classList.toggle("open");
      const icon = mobileMenuBtn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars");
        icon.classList.toggle("fa-xmark");
      }
    });
  }
});