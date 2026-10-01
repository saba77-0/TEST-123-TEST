document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("burgerBtn");
  const menu = document.getElementById("navLinks");
  const navbar = document.querySelector(".navbar");
  if (!btn || !menu) return;

  // ---------- მენიუს შიგთავსი (login სტატუსის მიხედვით) ----------
  function buildMenu() {
    const loggedIn = !!localStorage.getItem("token");
    menu.innerHTML = loggedIn
      ? `<a class="nav-item" href="index.html">Home</a>
         <div class="nav-divider"></div>
         <a class="nav-item" href="profile.html">My Profile</a>
         <a class="nav-item" href="profile.html" data-open-reservations>My Bookings</a>
         <button type="button" class="nav-item danger" id="navLogoutBtn">Log out</button>`
      : `<a class="nav-item" href="index.html">Home</a>
         <div class="nav-divider"></div>
         <a class="nav-item" href="login.html">Sign In</a>
         <a class="nav-item" href="register.html">Register</a>`;

    const current = location.pathname.split("/").pop() || "index.html";
    menu.querySelectorAll("a.nav-item").forEach((a) => {
      if (a.getAttribute("href") === current && !a.hasAttribute("data-open-reservations")) a.classList.add("active");
      a.addEventListener("click", () => {
        if (a.hasAttribute("data-open-reservations")) sessionStorage.setItem("activeProfileTab", "reservationsTab");
        setOpen(false);
      });
    });

    const logout = document.getElementById("navLogoutBtn");
    if (logout) {
      logout.addEventListener("click", () => {
        ["token", "refreshToken", "user_profile_avatar", "user_first_name", "user_last_name", "user_initials"]
          .forEach((k) => localStorage.removeItem(k));
        sessionStorage.clear();
        window.location.replace("index.html");
      });
    }
  }

  // ---------- გახსნა / დახურვა ----------
  function setOpen(open) {
    menu.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
    const icon = btn.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", !open);
      icon.classList.toggle("fa-xmark", open);
    }
  }

  function syncNavHeight() {
    if (navbar) document.documentElement.style.setProperty("--nav-h", navbar.offsetHeight + "px");
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    syncNavHeight();
    setOpen(!menu.classList.contains("open"));
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  window.addEventListener("resize", () => {
    syncNavHeight();
    if (window.innerWidth > 768) setOpen(false);
  });

  buildMenu();
  syncNavHeight();
});
