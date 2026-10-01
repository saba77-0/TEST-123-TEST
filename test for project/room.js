
//  * გვერდი მთლიანად JS-ით შენდება (#roomMainContent-ში), ამიტომ ბევრ ადგილას inline style-ია.

// ოთახის ნომრით ლამაზი.
const customRoomNames = {
  "VIP01": "Presidential Royal Villa",
  "V20": "Panoramic Lake Penthouse",
  "V11": "Family Lake Suite",
  "V10": "Family Garden Suite",
  "V02": "Deluxe King Terrace Room",
  "V01": "Deluxe Twin Resort Room",

  "207": "Kabadoni Family Superior Suite",
  "206": "Alazani Valley Family Suite",
  "205": "Comfort Family Suite",
  "104": "Deluxe King Wine-View Room",
  "103": "Deluxe City View Room",
  "102": "Panoramic Corner Deluxe Room",

  "302": "Presidential Forest Suite",
  "301": "Royal Borjomi Panorama Suite",
  "202": "Borjomi Park Family Suite",
  "201": "Executive Family Studio",
  "102": "Deluxe King Park View",
  "101": "Deluxe Spa & Bath Room",

  "1003": "Presidential Seafront Suite",
  "901": "Panoramic Black Sea Penthouse",
  "703": "Executive Family Studio",
  "702": "Family Suite with Sea Terrace",
  "502": "Deluxe King Sea Breeze",
  "501": "Business Deluxe Room",

  "1501": "Royal Presidential Suite",
  "1401": "Skyline Panorama Penthouse",
  "1202": "Seaside Family Suite with Balcony",
  "1201": "Modern Minimalist Family Suite",
  "302": "Deluxe Room with Lounge Nook",
  "301": "Deluxe Studio & Living Area",

  "SC7": "Fabrika Urban Family Suite",
  "SC6": "Artistic Loft Family Suite",
  "SD5": "Cozy Timber Family Room",
  "DD3": "Industrial Loft Deluxe Room",
  "DD2": "Vintage Studio Deluxe Room",
  "DD1": "Deluxe Apartment with Kitchenette",

  "601": "Grand Presidential Suite",
  "501": "Skyline View Penthouse",
  "307": "Metechi Royal Family Suite",
  "306": "Contemporary Family Suite",
  "106": "Executive Deluxe Living Room",
  "105": "Deluxe Suite with Dining Space",

  "901": "Biltmore Royal Presidential Suite",
  "801": "Grand Tower Panorama Penthouse",
  "206": "Executive High-Floor Family Suite",
  "205": "Family Suite with Private Dining",
  "102": "Deluxe Modern King Room",
  "101": "Deluxe City View Living Suite",

  "302": "Rooms Skyline Signature Penthouse",
  "301": "Urban Terrace Loft Penthouse",
  "202": "Bohemian Family Suite",
  "201": "Industrial Chic Family Suite",
  "102": "Signature King Deluxe",
  "101": "Urban Twin Deluxe Room"
};

// ოთახის სახელი: ჯერ customRoomNames, თუ არ არის - roomType-ის გალამაზებული ვერსია
function formatRoomName(room) {
  if (!room) return "Standard Room";

  const num = (room.roomNumber || "").replace("#", "").trim();
  if (customRoomNames[num]) return customRoomNames[num];
  if (customRoomNames[room.id]) return customRoomNames[room.id];

  const rawType = (room.roomType || room.name || "").trim();
  const nameMap = {
    "Deluxe": "Deluxe Room",
    "FamilySuite": "Family Suite",
    "Penthouse": "Luxury Penthouse",
    "Accessible": "Accessible Room",
    "Standard": "Standard Room",
    "Suite": "Executive Suite",
    "Single": "Single Room",
    "Double": "Double Room"
  };

  return nameMap[rawType] || rawType.replace(/([a-z])([A-Z])/g, '$1 $2').trim() || "Standard Room";
}

// მიმდინარე ოთახის ID, შესაფასებლად რედაქტირებული ინდექსი და არჩეული ვარსკვლავები
let currentActiveRoomId = null;
let editingReviewIndex = null;
let selectedRating = 0;

// გვერდის ჩატვირთვისას: navbar, ოთახის წამოღება, გვერდის აგება
document.addEventListener("DOMContentLoaded", async () => {
  renderNavbarAuth();

  const content = document.getElementById("roomMainContent");
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("id");
  currentActiveRoomId = roomId;

  if (!roomId) {
    content.innerHTML = "<p style='text-align: center; color: red;'>ოთახის ID ვერ მოიძებნა!</p>";
    return;
  }

  const token = localStorage.getItem("token");

  try {
    // ოთახის დეტალები (GET /rooms/details/{id})
    const roomRes = await fetch(`https://bookingapi.stepacademy.ge/api/rooms/details/${roomId}`, {
      headers: { "accept": "application/json" }
    });

    if (!roomRes.ok) throw new Error("Room not found");

    const result = await roomRes.json();
    const room = result.data;
    const hotel = room.hotel;
    const cleanRoomName = formatRoomName(room);

    // გალერეის გვერდითი სურათები
    const galleryHtml = (room.gallery || [])
      .map(img => `<img src="${img}" alt="${cleanRoomName}" class="gallery-side-img">`)
      .join("");

    let starsHtml = "";
    for (let i = 0; i < 5; i++) {
      starsHtml += i < Math.floor(room.averageRating || 0)
        ? '<i class="fa-solid fa-star"></i>'
        : '<i class="fa-regular fa-star"></i>';
    }

    // სპეციფიკაციების ცხრილი (გასაღები: მნიშვნელობა)
    const specs = room.specifications || {};
    let specsHtml = "";
    for (const [key, value] of Object.entries(specs)) {
      specsHtml += `
        <div class="spec-row">
          <span class="spec-key">${key}:</span>
          <span class="spec-val">${value}</span>
        </div>
      `;
    }

    // მარჯვენა ბარათის ღილაკი: ლოგინით - Book this room, ლოგინის გარეშე - Login to book
    const bookingActionHtml = token
      ? `<button class="btn btn-primary btn-book-action" style="width: 100%; padding: 14px; font-size: 1rem; font-weight: 600; border-radius: 8px;" onclick="handleBookAction(${room.id})">Book this room</button>`
      : `<a href="login.html" class="btn btn-primary btn-book-action" style="display: block; text-align: center; width: 100%; padding: 14px; font-size: 1rem; font-weight: 600; border-radius: 8px; text-decoration: none;">Login to book</a>`;

    // 'Write a Review' ღილაკი (ლოგინის გარეშე -> login.html)
    const reviewActionHtml = token
      ? `<button class="btn btn-primary btn-sm" onclick="openReviewModal()">Write a Review</button>`
      : `<button class="btn btn-primary btn-sm" onclick="handleReviewLoginRedirect()">Login to Write a Review</button>`;

    // მთელი გვერდის HTML: გალერეა, სათაური, მეტრიკები, სპეციფიკაციები, შეფასებები, booking ბარათი (.room-sidebar)
    content.innerHTML = `
      <section class="hotel-gallery-grid">
        <div class="main-image-wrapper">
          <img src="${room.thumbnail}" alt="${cleanRoomName}" class="main-hotel-img">
        </div>
        <div class="side-images-wrapper">
          ${galleryHtml}
        </div>
      </section>

      <div class="room-details-layout">
        <div class="room-main-info">
          <div class="room-back-link">
            <a href="hotel.html?id=${hotel.id}">← ${hotel.name}</a>
          </div>

          <div class="room-title-row">
            <h1 class="room-heading">${cleanRoomName}</h1>
            ${room.isAvailable ? '<span class="badge-available-pill">Available</span>' : ''}
          </div>

          <div class="room-sub-id">Room #${room.roomNumber}</div>

          <div class="room-metrics-bar">
            <div class="metric-item">
              <span class="metric-label">CAPACITY</span>
              <span class="metric-value">${room.capacity} guests</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">BEDS</span>
              <span class="metric-value">${room.bedCount}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">RATING</span>
              <span class="metric-value">
                <span class="stars-gold">${starsHtml}</span>
                <span class="metric-num">${Number(room.averageRating).toFixed(1)}</span>
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">REVIEWS</span>
              <span class="metric-value" id="roomReviewsCountDisplay">${room.reviewCount}</span>
            </div>
          </div>

          <div class="specs-section">
            <h2 class="specs-heading">Specifications</h2>
            <div class="specs-table">
              ${specsHtml}
            </div>
          </div>

          <div class="reviews-section">
            <div class="reviews-header">
              <h2 class="specs-heading">Guest Reviews</h2>
              ${reviewActionHtml}
            </div>
            <div id="roomReviewsList">
              <p class="no-reviews-text">No reviews yet — be the first to share your experience!</p>
            </div>
          </div>
        </div>

        <div class="room-sidebar">
          <div class="booking-card" style="padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
            <div class="price-header" style="margin-bottom: 20px;">
              <span class="price-amount" style="font-size: 1.8rem; font-weight: 800; color: #0f172a;">$${room.pricePerNight}</span>
              <span class="price-sub" style="color: #64748b; font-size: 0.95rem;"> / night</span>
            </div>

            ${bookingActionHtml}
          </div>
        </div>
      </div>
    `;

    // შენახული შეფასებების ჩვენება და მოდალის ლოგიკის ჩართვა
    renderSavedReviews(roomId);
    initModalLogic(roomId);
  } catch (error) {
    console.error(error);
    content.innerHTML = "<p style='text-align: center; color: red;'>ოთახის მონაცემების წამოღება ვერ მოხერხდა.</p>";
  }
});

// ---------- შეფასებები localStorage-ში ----------
function getStoredReviews(roomId) {
  try {
    const all = JSON.parse(localStorage.getItem("room_user_reviews") || "{}");
    return all[roomId] || [];
  } catch (e) {
    return [];
  }
}

// შეფასების დამატება ან არსებულის განახლება (indexToEdit)
function saveUserReview(roomId, reviewObj, indexToEdit = null) {
  try {
    const all = JSON.parse(localStorage.getItem("room_user_reviews") || "{}");
    if (!all[roomId]) all[roomId] = [];

    if (indexToEdit !== null && indexToEdit >= 0) {
      all[roomId][indexToEdit] = reviewObj;
    } else {
      all[roomId].unshift(reviewObj);
    }

    localStorage.setItem("room_user_reviews", JSON.stringify(all));
  } catch (e) {}
}

// შეფასების წაშლა
function deleteUserReview(roomId, index) {
  try {
    const all = JSON.parse(localStorage.getItem("room_user_reviews") || "{}");
    if (all[roomId] && all[roomId][index] !== undefined) {
      all[roomId].splice(index, 1);
      localStorage.setItem("room_user_reviews", JSON.stringify(all));
    }
  } catch (e) {}
}

// შეფასებების ბარათების აგება, რედაქტირება/წაშლის ღილაკებით
function renderSavedReviews(roomId) {
  const container = document.getElementById("roomReviewsList");
  if (!container) return;

  const reviews = getStoredReviews(roomId);
  if (!reviews || reviews.length === 0) {
    container.innerHTML = '<p class="no-reviews-text">No reviews yet — be the first to share your experience!</p>';
    const countDisplay = document.getElementById("roomReviewsCountDisplay");
    if (countDisplay) countDisplay.textContent = "0";
    return;
  }

  container.innerHTML = reviews.map((rev, index) => {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      stars += i <= rev.rating
        ? '<i class="fa-solid fa-star" style="color: #f59e0b; margin-right: 2px;"></i>'
        : '<i class="fa-regular fa-star" style="color: #cbd5e1; margin-right: 2px;"></i>';
    }

    let avatarHtml = `<div style="width: 44px; height: 44px; border-radius: 50%; background: #0066ff; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px;">${rev.initials || "GG"}</div>`;
    if (rev.avatar && rev.avatar.trim().length > 5) {
      avatarHtml = `<img src="${rev.avatar}" alt="Avatar" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;">`;
    }

    return `
      <div class="review-item-card" style="display: flex; gap: 14px; background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <div>${avatarHtml}</div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #0f172a;">${rev.author}</h4>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 0.78rem; color: #64748b;">${rev.date}</span>
              <button onclick="editReviewAction(${index})" title="Edit review" style="background: none; border: none; color: #0066ff; cursor: pointer; font-size: 14px; padding: 0;">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button onclick="deleteReviewAction(${index})" title="Delete review" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; padding: 0;">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          <div style="margin-bottom: 6px;">${stars}</div>
          <p style="margin: 0; font-size: 0.88rem; color: #334155; line-height: 1.4;">${rev.text}</p>
        </div>
      </div>
    `;
  }).join("");

  const countDisplay = document.getElementById("roomReviewsCountDisplay");
  if (countDisplay) {
    countDisplay.textContent = reviews.length;
  }
}

// ფანქრის ღილაკი: მოდალი გაიხსნება არსებული ქულით
window.editReviewAction = function(index) {
  const reviews = getStoredReviews(currentActiveRoomId);
  const targetReview = reviews[index];
  if (!targetReview) return;

  editingReviewIndex = index;
  openReviewModal(targetReview.rating);
};

// კალათის ღილაკი: შეფასების წაშლა
window.deleteReviewAction = function(index) {
  deleteUserReview(currentActiveRoomId, index);
  renderSavedReviews(currentActiveRoomId);
  showToast("Review deleted successfully.");
};

// Book this room -> booking.html...
function handleBookAction(roomId) {
  window.location.href = `booking.html?id=${roomId}`;
}

// ლოგინის გარეშე: მისამართი ინახება და გადადის login.html-ზე
function handleReviewLoginRedirect() {
  localStorage.setItem("redirectAfterLogin", window.location.href);
  window.location.href = "login.html";
}

// შეფასების მოდალის გახსნა (ახალი ან რედაქტირება)
function openReviewModal(initialRate = 0) {
  const token = localStorage.getItem("token");
  if (!token) {
    handleReviewLoginRedirect();
    return;
  }

  const reviewModal = document.getElementById("reviewModal");
  const submitModalReviewBtn = document.getElementById("submitModalReviewBtn");
  const modalTitle = reviewModal ? reviewModal.querySelector(".modal-header h3") : null;
  const stars = document.querySelectorAll(".star-btn");

  if (initialRate > 0) {
    selectedRating = initialRate;
    stars.forEach(s => s.classList.toggle("active", Number(s.dataset.rate) <= initialRate));
    if (submitModalReviewBtn) {
      submitModalReviewBtn.disabled = false;
      submitModalReviewBtn.textContent = "Update Review";
    }
    if (modalTitle) modalTitle.textContent = "Edit Your Review";
  } else {
    editingReviewIndex = null;
    selectedRating = 0;
    stars.forEach(s => s.classList.remove("active", "hovered"));
    if (submitModalReviewBtn) {
      submitModalReviewBtn.disabled = true;
      submitModalReviewBtn.textContent = "Submit Review";
    }
    if (modalTitle) modalTitle.textContent = "Write a Review";
  }

  if (reviewModal) reviewModal.classList.remove("hidden");
}

// მოდალის დახურვა
function closeReviewModalWindow() {
  const reviewModal = document.getElementById("reviewModal");
  if (reviewModal) reviewModal.classList.add("hidden");
  editingReviewIndex = null;
}

// მოდალის ვარსკვლავები (hover/click) და Submit: POST /reviews/room + ლოკალური შენახვა
function initModalLogic(roomId) {
  const closeBtn = document.getElementById("closeReviewModal");
  const cancelBtn = document.getElementById("cancelReviewBtn");
  const submitBtn = document.getElementById("submitModalReviewBtn");
  const stars = document.querySelectorAll(".star-btn");

  if (closeBtn) closeBtn.onclick = closeReviewModalWindow;
  if (cancelBtn) cancelBtn.onclick = closeReviewModalWindow;

  stars.forEach(star => {
    star.onmouseenter = () => {
      const rate = Number(star.dataset.rate);
      stars.forEach(s => s.classList.toggle("hovered", Number(s.dataset.rate) <= rate));
    };

    star.onmouseleave = () => {
      stars.forEach(s => s.classList.remove("hovered"));
    };

    star.onclick = () => {
      selectedRating = Number(star.dataset.rate);
      stars.forEach(s => s.classList.toggle("active", Number(s.dataset.rate) <= selectedRating));
      if (submitBtn) submitBtn.disabled = false;
    };
  });

  if (submitBtn) {
    submitBtn.onclick = async () => {
      if (!selectedRating) return;

      submitBtn.disabled = true;
      submitBtn.textContent = editingReviewIndex !== null ? "Updating..." : "Submitting...";

      try {
        await fetch("https://bookingapi.stepacademy.ge/api/reviews/room", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ roomId: Number(roomId), rate: selectedRating })
        });
      } catch (err) {}

      const firstName = localStorage.getItem("user_first_name") || "Guest";
      const lastName = localStorage.getItem("user_last_name") || "User";
      const author = `${firstName} ${lastName}`.trim();
      const initials = localStorage.getItem("user_initials") || "GG";
      const avatar = localStorage.getItem("user_profile_avatar") || "";
      const today = new Date().toISOString().split("T")[0];

      const reviewItem = {
        author: author,
        initials: initials,
        avatar: avatar,
        rating: selectedRating,
        date: today,
        text: `Rated ${selectedRating} out of 5 stars.`
      };

      saveUserReview(roomId, reviewItem, editingReviewIndex);
      renderSavedReviews(roomId);

      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Review";
      closeReviewModalWindow();
      showToast(editingReviewIndex !== null ? "Review updated successfully." : "Review added successfully.");
    };
  }
}

// navbar-ის მარჯვენა მხარე: Sign In ან ავატარი
function renderNavbarAuth() {
  const navAuth = document.getElementById("navAuth");
  if (!navAuth) return;

  const token = localStorage.getItem("token");

  if (!token) {
    navAuth.innerHTML = '<a href="login.html" class="btn btn-primary btn-sm">Sign In</a>';
    return;
  }

  const savedAvatar = localStorage.getItem("user_profile_avatar");
  const savedInitials = localStorage.getItem("user_initials");
  const savedFirstName = localStorage.getItem("user_first_name");
  const savedLastName = localStorage.getItem("user_last_name");

  let initials = savedInitials;

  if (!initials && (savedFirstName || savedLastName)) {
    const f = (savedFirstName || "").trim();
    const l = (savedLastName || "").trim();
    if (f && l) initials = (f[0] + l[0]).toUpperCase();
    else if (f) initials = f.substring(0, 2).toUpperCase();
  }

  if (!initials) initials = "GG";

  let innerContent = initials;
  if (savedAvatar && savedAvatar.trim().length > 5) {
    innerContent = `<img src="${savedAvatar.trim()}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
  }

  navAuth.innerHTML = `
    <a href="profile.html" class="user-avatar-btn" style="overflow:hidden; display:flex; align-items:center; justify-content:center; padding:0;">${innerContent}</a>
  `;
}

// მწვანე შეტყობინება (toast) ეკრანის კუთხეში
function showToast(message) {
  let toast = document.getElementById("toastSuccessBox");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastSuccessBox";
    toast.className = "toast-success-box";
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <i class="fa-regular fa-circle-check toast-icon"></i>
    <span class="toast-text">${message}</span>
    <button type="button" class="toast-close" onclick="this.parentElement.classList.remove('show')">&times;</button>
  `;

  setTimeout(() => toast.classList.add("show"), 10);

  clearTimeout(toast.hideTimeout);
  toast.hideTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}


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