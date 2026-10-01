

// ლოგინის გარეშე -> login.html
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.replace("login.html");
    return;
  }

  // DOM ელემენტები (profile.html-იდან)
  const sidebarAvatar = document.getElementById("sidebarAvatar");
  const sidebarName = document.getElementById("sidebarName");
  const sidebarEmail = document.getElementById("sidebarEmail");
  const navAvatarTop = document.getElementById("navAvatarTop");

  const avatarPreviewBox = document.getElementById("avatarPreviewBox");
  const picUrlInput = document.getElementById("picUrlInput");
  const unsavedBadge = document.getElementById("unsavedBadge");

  const profFirstName = document.getElementById("profFirstName");
  const profLastName = document.getElementById("profLastName");
  const profEmail = document.getElementById("profEmail");
  const profDob = document.getElementById("profDob");
  const profPhone = document.getElementById("profPhone");
  const profAddress = document.getElementById("profAddress");

  const profileForm = document.getElementById("profileForm");
  const profileMsg = document.getElementById("profileMsg");
  const discardProfileBtn = document.getElementById("discardProfileBtn");

  const changePasswordForm = document.getElementById("changePasswordForm");
  const passMsg = document.getElementById("passMsg");
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const deleteModal = document.getElementById("deleteModal");
  const closeDeleteModalBtn = document.getElementById("closeDeleteModalBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  const statTotal = document.getElementById("statTotal");
  const statUpcoming = document.getElementById("statUpcoming");
  const statCompleted = document.getElementById("statCompleted");
  const statSpent = document.getElementById("statSpent");
  const emptyReservations = document.getElementById("emptyReservations");
  const reservationsList = document.getElementById("reservationsList");
  const reservationDetailsView = document.getElementById("reservationDetailsView");

  // initialUserData - სერვერიდან მოსული მონაცემები (Discard ღილაკისთვის); userBookings - ჯავშნების სია
  let initialUserData = null;
  let userBookings = [];

  // ინიციალები სახელიდან და გვარიდან (მაგ. 'სჩ')
  function getCalculatedInitials(firstName, lastName) {
    const f = (firstName || "").trim();
    const l = (lastName || "").trim();
    if (f && l) return (f[0] + l[0]).toUpperCase();
    if (f) return f.substring(0, 2).toUpperCase();
    return "GG";
  }

  // ავატარის გამოსახვა 3 ადგილას: პროფილის სურათი, sidebar, navbar. სურათი ან ინიციალები
  function renderAvatar(url, initials) {
    const finalUrl = (url && url.trim().length > 5) ? url.trim() : localStorage.getItem("user_profile_avatar");

    if (avatarPreviewBox) {
      if (finalUrl && finalUrl.trim().length > 5) {
        avatarPreviewBox.innerHTML = `<img src="${finalUrl.trim()}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
      } else {
        avatarPreviewBox.textContent = initials;
      }
    }

    if (sidebarAvatar) {
      if (finalUrl && finalUrl.trim().length > 5) {
        sidebarAvatar.innerHTML = `<img src="${finalUrl.trim()}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        sidebarAvatar.textContent = initials;
      }
    }

    if (navAvatarTop) {
      if (finalUrl && finalUrl.trim().length > 5) {
        navAvatarTop.innerHTML = `<img src="${finalUrl.trim()}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        navAvatarTop.textContent = initials;
      }
    }
  }

  // მომხმარებლის მონაცემებით ფორმის და sidebar-ის შევსება; ინიციალები ინახება localStorage-ში
  function populateUserUI(user) {
    if (!user) return;

    const fName = user.firstName || "";
    const lName = user.lastName || "";
    const fullName = `${fName} ${lName}`.trim() || "User";
    const email = user.email || "";

    const initials = getCalculatedInitials(fName, lName);

    localStorage.setItem("user_first_name", fName);
    localStorage.setItem("user_last_name", lName);
    localStorage.setItem("user_initials", initials);

    if (sidebarName) sidebarName.textContent = fullName;
    if (sidebarEmail) sidebarEmail.textContent = email;

    if (profFirstName) profFirstName.value = fName;
    if (profLastName) profLastName.value = lName;
    if (profEmail) profEmail.value = email;

    const details = user.details || {};
    if (profDob) profDob.value = details.dob ? details.dob.split("T")[0] : "";
    if (profPhone) profPhone.value = details.phoneNumber || "";
    if (profAddress) profAddress.value = details.address || "";

    const savedAvatar = localStorage.getItem("user_profile_avatar");
    const activePhoto = (details.pictureUrl && details.pictureUrl.trim().length > 5) ? details.pictureUrl : (savedAvatar || "");

    // სურათის URL-ის ცვლილებისას ავატარის პირდაპირ გადახედვა
    if (picUrlInput) picUrlInput.value = activePhoto;

    renderAvatar(activePhoto, initials);

    if (unsavedBadge) unsavedBadge.classList.add("hidden");
  }

  // GET /users/me. 401-ზე ტოკენი იშლება და login.html-ზე გადადის
  async function loadUserProfile() {
    try {
      const res = await fetch("https://bookingapi.stepacademy.ge/api/users/me", {
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          window.location.replace("login.html");
        }
        return;
      }

      const json = await res.json();
      const user = json.data || json;
      initialUserData = user;
      populateUserUI(user);
    } catch (err) {
      console.error("Profile load error:", err);
    }
  }

  loadUserProfile();

  if (picUrlInput) {
    picUrlInput.addEventListener("input", (e) => {
      const initials = getCalculatedInitials(profFirstName.value, profLastName.value);
      renderAvatar(e.target.value, initials);
      if (unsavedBadge) unsavedBadge.classList.remove("hidden");
    });
  }

  // ფორმაში ნებისმიერი ცვლილებისას ჩანს 'Unsaved changes' ბეჯი
  if (profileForm) {
    profileForm.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", () => {
        if (unsavedBadge) unsavedBadge.classList.remove("hidden");
      });
    });
  }

  // Save Changes: ინახება localStorage-შიც და იგზავნება API-ზე (PUT /users)
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (profileMsg) profileMsg.classList.add("hidden");

      const fName = profFirstName.value.trim();
      const lName = profLastName.value.trim();
      const photoVal = picUrlInput ? picUrlInput.value.trim() : "";
      const initials = getCalculatedInitials(fName, lName);

      localStorage.setItem("user_first_name", fName);
      localStorage.setItem("user_last_name", lName);
      localStorage.setItem("user_initials", initials);

      if (photoVal) {
        localStorage.setItem("user_profile_avatar", photoVal);
      } else {
        localStorage.removeItem("user_profile_avatar");
      }

      renderAvatar(photoVal, initials);

      const payload = {
        firstName: fName,
        lastName: lName,
        details: {
          phoneNumber: profPhone.value.trim() || null,
          address: profAddress.value.trim() || null,
          dob: profDob.value ? new Date(profDob.value).toISOString() : null,
          pictureUrl: photoVal || null
        }
      };

      try {
        const res = await fetch("https://bookingapi.stepacademy.ge/api/users", {
          method: "PUT",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const resData = await res.json();

        if (res.ok) {
          if (unsavedBadge) unsavedBadge.classList.add("hidden");
          if (profileMsg) {
            profileMsg.textContent = "Profile updated successfully!";
            profileMsg.className = "form-message success";
            profileMsg.classList.remove("hidden");

            setTimeout(() => {
              profileMsg.classList.add("hidden");
            }, 3000);
          }
          await loadUserProfile();
        } else {
          if (profileMsg) {
            profileMsg.textContent = resData.detail || resData.message || "Failed to update profile.";
            profileMsg.className = "form-message error";
            profileMsg.classList.remove("hidden");
          }
        }
      } catch (err) {
        if (profileMsg) {
          profileMsg.textContent = "Network error. Please try again.";
          profileMsg.className = "form-message error";
          profileMsg.classList.remove("hidden");
        }
      }
    });
  }

  // Discard: ფორმა უბრუნდება სერვერიდან მოსულ მონაცემებს
  if (discardProfileBtn) {
    discardProfileBtn.addEventListener("click", () => {
      if (initialUserData) {
        populateUserUI(initialUserData);
      }
    });
  }

  // ჯავშნები: API (GET /bookings) და localStorage (user_custom_bookings)
  async function loadUserBookings() {
    let apiBookings = [];
    try {
      const res = await fetch("https://bookingapi.stepacademy.ge/api/bookings", {
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          apiBookings = json;
        } else if (json && Array.isArray(json.data)) {
          apiBookings = json.data;
        } else if (json && json.data && Array.isArray(json.data.items)) {
          apiBookings = json.data.items;
        }
      }
    } catch (err) {}

    const localBookings = JSON.parse(localStorage.getItem("user_custom_bookings") || "[]");
    const combined = [...localBookings];

    apiBookings.forEach(apiItem => {
      if (!combined.some(c => String(c.id) === String(apiItem.id))) {
        combined.push(apiItem);
      }
    });

    userBookings = combined;

    renderBookingsStats(userBookings);
    renderBookingsList();
  }

  // სტატისტიკა: სულ, მომავალი (upcoming), დასრულებული, დახარჯული თანხა
  function renderBookingsStats(bookings) {
    if (!statTotal) return;
    const total = bookings.length;
    let upcoming = 0;
    let completed = 0;
    let spent = 0;

    const now = new Date();

    bookings.forEach(b => {
      spent += (b.totalPrice || b.price || 0);
      const end = b.checkOutDate || b.endDate ? new Date(b.checkOutDate || b.endDate) : null;
      if (b.status === "Cancelled") return;
      if (end && end < now) {
        completed++;
      } else {
        upcoming++;
      }
    });

    if (statTotal) statTotal.textContent = total;
    if (statUpcoming) statUpcoming.textContent = upcoming;
    if (statCompleted) statCompleted.textContent = completed;
    if (statSpent) statSpent.textContent = `$${spent.toFixed(2)}`;
  }

  // თარიღი ლამაზად (მაგ. 'Oct 1, 2026')
  function formatDateFriendly(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // თარიღი input type=date-ისთვის (YYYY-MM-DD)
  function formatDateInput(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
  }

  // ჯავშნების ბარათების აგება (.res-card-modern); თუ ჯავშნები არ არის - 'No reservations found'
  function renderBookingsList() {
    if (!reservationsList || !emptyReservations) return;

    if (userBookings.length === 0) {
      emptyReservations.classList.remove("hidden");
      reservationsList.classList.add("hidden");
      reservationsList.innerHTML = "";
    } else {
      emptyReservations.classList.add("hidden");
      reservationsList.classList.remove("hidden");
      reservationsList.style.display = "block";

      reservationsList.innerHTML = userBookings.map(b => {
        const inDate = formatDateFriendly(b.checkInDate || b.startDate);
        const outDate = formatDateFriendly(b.checkOutDate || b.endDate);
        const status = (b.status || "Pending").toUpperCase();
        const statusClass = (b.status || "Pending").toLowerCase();

        return `
          <div class="res-card-modern">
            <div class="res-card-top">
              <div>
                <h3 class="res-hotel-title">${b.hotelName || 'Hotel Stay'}</h3>
                <p class="res-room-sub">${b.roomName || 'Room'} &bull; #${b.roomNumber || b.id || 'V11'}</p>
              </div>
              <span class="res-status-badge ${statusClass}">${status}</span>
            </div>

            <div class="res-dates-strip">
              <div class="res-date-box">
                <i class="fa-regular fa-calendar res-date-icon"></i>
                <div>
                  <div class="res-date-lbl">CHECK-IN</div>
                  <div class="res-date-val">${inDate}</div>
                </div>
              </div>

              <div style="color: #94a3b8; font-size: 1.1rem;">&rarr;</div>

              <div class="res-date-box">
                <i class="fa-regular fa-calendar res-date-icon"></i>
                <div>
                  <div class="res-date-lbl">CHECK-OUT</div>
                  <div class="res-date-val">${outDate}</div>
                </div>
              </div>
            </div>

            <div class="res-meta-line">
              <span><i class="fa-solid fa-user"></i> ${b.guestCount || 1} Guest</span>
              <span><i class="fa-regular fa-clock"></i> 1 Night</span>
            </div>

            <div class="res-card-footer">
              <div style="font-size: 0.95rem; color: #64748b;">
                Total <span class="res-total-val">$${Number(b.totalPrice || b.price || 0).toFixed(2)}</span>
              </div>
              <div style="display: flex; gap: 10px;">
                <button type="button" class="res-btn-details" onclick="viewBookingDetails('${b.id}')">
                  <i class="fa-regular fa-eye"></i> Details
                </button>
                <button type="button" class="res-btn-cancel" onclick="cancelBookingAction('${b.id}')">
                  <i class="fa-solid fa-xmark"></i> Cancel
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
  }


  // ჯავშნის დეტალების გვერდი (სია და სტატისტიკა იმალება)
  window.viewBookingDetails = function(bookingId) {
    const booking = userBookings.find(b => String(b.id) === String(bookingId));
    if (!booking) return;

    const reservationDetailsView = document.getElementById("reservationDetailsView");
    const statsGrid = document.querySelector(".stats-grid");
    const paneHeader = document.querySelector("#tab-reservations .pane-header");
    const reservationsList = document.getElementById("reservationsList");

    if (!reservationDetailsView) return;

    const inDate = formatDateFriendly(booking.checkInDate || booking.startDate);
    const outDate = formatDateFriendly(booking.checkOutDate || booking.endDate);
    const status = (booking.status || "Pending").toUpperCase();
    const statusClass = (booking.status || "Pending").toLowerCase();
    const total = Number(booking.totalPrice || booking.price || 0).toFixed(2);

    reservationDetailsView.innerHTML = `
      <div style="margin-bottom: 20px;">
        <button type="button" onclick="closeBookingDetails()" style="background: none; border: none; color: #64748b; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-arrow-left"></i> Back to Bookings
        </button>
      </div>

      <div class="res-detail-header-row" style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
        <h1 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #0f172a;">${booking.hotelName || 'Hotel Stay'}</h1>
        <span class="res-status-badge ${statusClass}">${status}</span>
      </div>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 0.9rem;">
        Booking #${booking.id} &bull; ${booking.roomName || 'Room'} &bull; #${booking.roomNumber || 'V11'}
      </p>

      <div class="res-table-card">
        <h3><i class="fa-regular fa-calendar" style="color: #0066ff;"></i> Stay Details</h3>
        <div class="res-detail-grid-stats">
          <div class="res-stat-card">
            <div class="res-stat-icon-wrap"><i class="fa-solid fa-arrow-right-to-bracket"></i></div>
            <div>
              <div class="res-date-lbl">CHECK-IN</div>
              <div class="res-date-val">${inDate}</div>
            </div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-icon-wrap"><i class="fa-solid fa-arrow-right-from-bracket"></i></div>
            <div>
              <div class="res-date-lbl">CHECK-OUT</div>
              <div class="res-date-val">${outDate}</div>
            </div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-icon-wrap"><i class="fa-solid fa-moon"></i></div>
            <div>
              <div class="res-date-lbl">DURATION</div>
              <div class="res-date-val">1 Night</div>
            </div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-icon-wrap"><i class="fa-solid fa-user-group"></i></div>
            <div>
              <div class="res-date-lbl">GUESTS</div>
              <div class="res-date-val">${booking.guestCount || 1} Guest</div>
            </div>
          </div>
        </div>
      </div>

      <div class="res-table-card">
        <h3><i class="fa-solid fa-hotel" style="color: #0066ff;"></i> Room & Hotel Information</h3>
        <div class="res-info-row">
          <span class="res-info-key">Hotel</span>
          <span class="res-info-val">${booking.hotelName || 'Lopota Lake Resort & Spa'}</span>
        </div>
        <div class="res-info-row">
          <span class="res-info-key">Room Type</span>
          <span class="res-info-val">${booking.roomName || 'FamilySuite'}</span>
        </div>
        <div class="res-info-row">
          <span class="res-info-key">Room Number</span>
          <span class="res-info-val">#${booking.roomNumber || 'V11'}</span>
        </div>
        <div class="res-info-row">
          <span class="res-info-key">Room ID</span>
          <span class="res-info-val">${booking.roomId || booking.id || '58'}</span>
        </div>
      </div>

      <div class="res-table-card">
        <h3><i class="fa-solid fa-dollar-sign" style="color: #0066ff;"></i> Pricing Summary</h3>
        <div class="res-info-row">
          <span class="res-info-key">$${total} &times; 1 night</span>
          <span class="res-info-val">$${total}</span>
        </div>
        <div class="res-info-row" style="border-top: 1px solid #e2e8f0; margin-top: 10px; padding-top: 14px;">
          <span style="font-size: 1.15rem; font-weight: 800; color: #0f172a;">Total</span>
          <span style="font-size: 1.35rem; font-weight: 800; color: #0066ff;">$${total}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 14px; margin-top: 20px;">
        <button type="button" class="res-btn-details" onclick="openEditReservation('${booking.id}')">
          <i class="fa-solid fa-pen-to-square"></i> Edit Reservation
        </button>
        <button type="button" class="res-btn-cancel" style="background: #ef4444; color: #fff; border: none;" onclick="cancelBookingAction('${booking.id}')">
          <i class="fa-solid fa-xmark"></i> Cancel Reservation
        </button>
      </div>
    `;

    if (paneHeader) paneHeader.style.display = "none";
    if (statsGrid) statsGrid.style.display = "none";
    if (reservationsList) reservationsList.style.display = "none";

    reservationDetailsView.classList.remove("hidden");
    reservationDetailsView.style.display = "block";
  };

 
  // ჯავშნის რედაქტირების ფორმა (თარიღები, სტუმრები, სპეც. მოთხოვნები)
  window.openEditReservation = function(bookingId) {
    const booking = userBookings.find(b => String(b.id) === String(bookingId));
    if (!booking) return;

    const reservationDetailsView = document.getElementById("reservationDetailsView");
    const statsGrid = document.querySelector(".stats-grid");
    const paneHeader = document.querySelector("#tab-reservations .pane-header");
    const reservationsList = document.getElementById("reservationsList");

    if (!reservationDetailsView) return;

    if (paneHeader) paneHeader.style.display = "none";
    if (statsGrid) statsGrid.style.display = "none";
    if (reservationsList) reservationsList.style.display = "none";

    const status = (booking.status || "Pending").toUpperCase();
    const statusClass = (booking.status || "Pending").toLowerCase();

    const inVal = formatDateInput(booking.checkInDate || booking.startDate);
    const outVal = formatDateInput(booking.checkOutDate || booking.endDate);

    reservationDetailsView.innerHTML = `
      <div style="margin-bottom: 20px;">
        <button type="button" onclick="viewBookingDetails('${booking.id}')" style="background: none; border: none; color: #64748b; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-arrow-left"></i> Back to Bookings
        </button>
      </div>

      <div class="res-detail-header-row" style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
        <h1 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #0f172a;">${booking.hotelName || 'Hotel Stay'}</h1>
        <span class="res-status-badge ${statusClass}">${status}</span>
      </div>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 0.9rem;">
        Booking #${booking.id} &bull; ${booking.roomName || 'Room'} &bull; #${booking.roomNumber || 'V11'}
      </p>

      <div class="res-edit-card">
        <h3><i class="fa-regular fa-pen-to-square" style="color: #0066ff;"></i> Edit Reservation</h3>

        <div class="res-edit-grid">
          <div class="res-edit-field">
            <label>Check-in Date</label>
            <input type="date" id="editCheckIn" value="${inVal}">
          </div>
          <div class="res-edit-field">
            <label>Check-out Date</label>
            <input type="date" id="editCheckOut" value="${outVal}">
          </div>
        </div>

        <div class="res-edit-field" style="margin-bottom: 20px;">
          <label>Number of Guests</label>
          <input type="number" id="editGuests" value="${booking.guestCount || 1}" min="1" max="10">
        </div>

        <div class="res-edit-field">
          <label>Special Requests</label>
          <textarea id="editRequests" rows="3" placeholder="Any special requirements for your stay...">${booking.specialRequests || ""}</textarea>
        </div>

        <div class="res-edit-actions">
          <button type="button" class="res-btn-discard" onclick="viewBookingDetails('${booking.id}')">
            <i class="fa-solid fa-xmark"></i> Discard
          </button>
          <button type="button" class="res-btn-save active" id="saveEditBtn" onclick="saveBookingChanges('${booking.id}')">
            <i class="fa-solid fa-check"></i> Save Changes
          </button>
        </div>
      </div>
    `;

    reservationDetailsView.classList.remove("hidden");
    reservationDetailsView.style.display = "block";
  };

  // ცვლილებების შენახვა: ლოკალურად + PUT /bookings
  window.saveBookingChanges = async function(bookingId) {
    const booking = userBookings.find(b => String(b.id) === String(bookingId));
    if (!booking) return;

    const newIn = document.getElementById("editCheckIn").value;
    const newOut = document.getElementById("editCheckOut").value;
    const newGuests = Number(document.getElementById("editGuests").value) || 1;
    const newReqs = document.getElementById("editRequests").value;

    if (!newIn || !newOut) {
      alert("გთხოვთ აირჩიოთ თარიღები!");
      return;
    }

    const saveBtn = document.getElementById("saveEditBtn");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
    }

    booking.checkInDate = newIn;
    booking.checkOutDate = newOut;
    booking.guestCount = newGuests;
    booking.specialRequests = newReqs;

    let localBookings = JSON.parse(localStorage.getItem("user_custom_bookings") || "[]");
    const localIdx = localBookings.findIndex(b => String(b.id) === String(bookingId));
    if (localIdx >= 0) {
      localBookings[localIdx] = { ...localBookings[localIdx], ...booking };
      localStorage.setItem("user_custom_bookings", JSON.stringify(localBookings));
    }

    try {
      await fetch(`https://bookingapi.stepacademy.ge/api/bookings`, {
        method: "PUT",
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: Number(bookingId),
          checkInDate: `${newIn}T14:00:00Z`,
          checkOutDate: `${newOut}T12:00:00Z`,
          guestCount: newGuests
        })
      });
    } catch (e) {}

    renderBookingsStats(userBookings);
    viewBookingDetails(bookingId);
  };

  // დეტალებიდან უკან, ჯავშნების სიაში დაბრუნება
  window.closeBookingDetails = function() {
    const reservationDetailsView = document.getElementById("reservationDetailsView");
    const statsGrid = document.querySelector(".stats-grid");
    const paneHeader = document.querySelector("#tab-reservations .pane-header");
    const reservationsList = document.getElementById("reservationsList");

    if (reservationDetailsView) {
      reservationDetailsView.classList.add("hidden");
      reservationDetailsView.style.display = "none";
    }

    if (paneHeader) paneHeader.style.display = "block";
    if (statsGrid) statsGrid.style.display = "grid";
    if (reservationsList) reservationsList.style.display = "block";
  };

  // ჯავშნის გაუქმება: DELETE /bookings/{id} და ლოკალური სიიდან წაშლა
  window.cancelBookingAction = async function(bookingId) {
    if (!confirm("ნამდვილად გსურთ ჯავშნის გაუქმება?")) return;

    try {
      await fetch(`https://bookingapi.stepacademy.ge/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (e) {}

    let localBookings = JSON.parse(localStorage.getItem("user_custom_bookings") || "[]");
    localBookings = localBookings.filter(b => String(b.id) !== String(bookingId));
    localStorage.setItem("user_custom_bookings", JSON.stringify(localBookings));

    userBookings = userBookings.filter(b => String(b.id) !== String(bookingId));
    renderBookingsStats(userBookings);
    closeBookingDetails();
    renderBookingsList();
  };

  // ჯავშნების პირველადი ჩატვირთვა
  loadUserBookings();

  // პაროლის შეცვლა (Settings): ახალი პაროლები უნდა ემთხვეოდეს; PUT /users/change-password
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (passMsg) passMsg.classList.add("hidden");

      const currentPassword = document.getElementById("curPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (newPassword !== confirmPassword) {
        if (passMsg) {
          passMsg.textContent = "New passwords do not match!";
          passMsg.className = "form-message error";
          passMsg.classList.remove("hidden");
        }
        return;
      }

      try {
        const res = await fetch("https://bookingapi.stepacademy.ge/api/users/change-password", {
          method: "PUT",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword
          })
        });

        const resData = await res.json();

        if (res.ok) {
          if (passMsg) {
            passMsg.textContent = "Password changed successfully!";
            passMsg.className = "form-message success";
            passMsg.classList.remove("hidden");
          }
          changePasswordForm.reset();
        } else {
          if (passMsg) {
            passMsg.textContent = resData.detail || resData.message || "Failed to change password.";
            passMsg.className = "form-message error";
            passMsg.classList.remove("hidden");
          }
        }
      } catch (err) {
        if (passMsg) {
          passMsg.textContent = "Network error. Please try again.";
          passMsg.className = "form-message error";
          passMsg.classList.remove("hidden");
        }
      }
    });
  }

  // ანგარიშის წაშლის დადასტურების მოდალი
  function openDeleteModal() {
    if (deleteModal) deleteModal.classList.remove("hidden");
  }

  function closeDeleteModal() {
    if (deleteModal) deleteModal.classList.add("hidden");
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openDeleteModal();
    });
  }

  if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener("click", closeDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);

  // ანგარიშის წაშლა: DELETE /users/delete-profile, შემდეგ ლოკალური მონაცემების გასუფთავება
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = "Deleting...";

      try {
        const res = await fetch("https://bookingapi.stepacademy.ge/api/users/delete-profile", {
          method: "DELETE",
          headers: {
            "accept": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user_profile_avatar");
          localStorage.removeItem("user_first_name");
          localStorage.removeItem("user_last_name");
          localStorage.removeItem("user_initials");
          sessionStorage.clear();
          window.location.replace("index.html");
        } else {
          alert("Failed to delete account.");
          confirmDeleteBtn.disabled = false;
          confirmDeleteBtn.textContent = "Yes, Delete My Account";
          closeDeleteModal();
        }
      } catch (err) {
        alert("Network error.");
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = "Yes, Delete My Account";
        closeDeleteModal();
      }
    });
  }

  // ტაბების გადართვა (My Profile / Reservations / Settings) data-tab ატრიბუტით
  const tabs = document.querySelectorAll(".nav-tab[data-tab]");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.getAttribute("data-tab");
      if (!targetId) return;

      closeBookingDetails();
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // თუ სხვა გვერდმა (booking.js ან nav.js) აირჩია activeProfileTab, Reservations ტაბი ავტომატურად იხსნება
  const activeTabParam = sessionStorage.getItem("activeProfileTab");
  if (activeTabParam) {
    sessionStorage.removeItem("activeProfileTab");
    const targetTabBtn = Array.from(tabs).find(t => 
      t.getAttribute("data-tab")?.toLowerCase().includes("reservation") || 
      t.textContent.toLowerCase().includes("reservation")
    );
    if (targetTabBtn) targetTabBtn.click();
  }

  // პაროლის ველებში თვალის ღილაკი: გამოჩენა/დამალვა
  document.querySelectorAll(".eye-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      const icon = btn.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.className = "fa-regular fa-eye-slash";
      } else {
        input.type = "password";
        icon.className = "fa-regular fa-eye";
      }
    });
  });

  // Logout: ლოკალური მონაცემების გასუფთავება და index.html
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user_profile_avatar");
      localStorage.removeItem("user_first_name");
      localStorage.removeItem("user_last_name");
      localStorage.removeItem("user_initials");
      sessionStorage.clear();
      window.location.replace("index.html");
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