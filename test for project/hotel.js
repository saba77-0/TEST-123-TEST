
// გვერდის ჩატვირთვისას: სასტუმროს წამოღება და გვერდის აგება
document.addEventListener("DOMContentLoaded", async () => {
  const content = document.getElementById("hotelMainContent");

  // URL-იდან ?id=სასტუმროს ID
  const params = new URLSearchParams(window.location.search);
  const hotelId = params.get("id");

  if (!hotelId) {
    content.innerHTML = "<p style='text-align: center; color: red;'>სასტუმროს ID ვერ მოიძებნა!</p>";
    return;
  }

  // სასტუმროს დეტალები (GET /hotels/{id})
  try {
    const hotelRes = await fetch(`https://bookingapi.stepacademy.ge/api/hotels/${hotelId}`, {
      headers: { "accept": "application/json" }
    });

    if (!hotelRes.ok) throw new Error("Hotel not found");

    const hotelData = await hotelRes.json();
    const hotel = hotelData.data;

    // გალერეის გვერდითი სურათები (მაქს. 3)
    const galleryHtml = (hotel.gallery || [])
      .slice(0, 3)
      .map(img => `<img src="${img}" alt="${hotel.name}" class="gallery-side-img">`)
      .join("");

    // რეიტინგის ვარსკვლავები
    let starsHtml = "";
    for (let i = 0; i < 5; i++) {
      starsHtml += i < Math.floor(hotel.averageRating || 0)
        ? '<i class="fa-solid fa-star"></i>'
        : '<i class="fa-regular fa-star"></i>';
    }

    // მისამართის ტექსტი: ქალაქი, ქვეყანა, რეგიონი, ქუჩა, ინდექსი
    const addr = hotel.address;
    const addressText = `${addr.city || ''}, ${addr.country || ''}${addr.state ? ', ' + addr.state : ''}, ${addr.street || ''}, ${addr.zipCode || ''}`;

    // ღილაკის ტექსტი დამოკიდებულია ლოგინზე
    const token = localStorage.getItem("token");
    const reviewBtnText = token ? "შეფასების გაგზავნა" : "Login to Write a Review";

    // მთელი გვერდის HTML: გალერეა, ინფო, კონტაქტი, ტაბები (Rooms/Reviews), ოთახების ფილტრი, შეფასების ფორმა
    content.innerHTML = `
      <section class="hotel-gallery-grid">
        <div class="main-image-wrapper">
          <img src="${hotel.thumbnail}" alt="${hotel.name}" class="main-hotel-img">
        </div>
        <div class="side-images-wrapper">
          ${galleryHtml}
        </div>
      </section>

      <section class="hotel-info-section">
        <div class="hotel-details-left">
          <span class="hotel-tag">${hotel.starRating} ★ Hotel</span>
          <h1 class="hotel-page-title">${hotel.name}</h1>
          <p class="hotel-location-text">${addressText}</p>
          
          <div class="hotel-rating-row">
            <span class="stars-gold">${starsHtml}</span>
            <span class="rating-num">${Number(hotel.averageRating).toFixed(1)} (<span id="reviewsHeaderBadge">${hotel.reviewCount}</span> reviews)</span>
            <span class="room-count-badge">${hotel.roomCount} rooms</span>
          </div>

          <p class="hotel-description-text">${hotel.description}</p>
        </div>

        <div class="hotel-contact-card">
          <h3>Contact</h3>
          <p><i class="fa-solid fa-phone"></i> ${hotel.phoneNumber || "N/A"}</p>
          <p><i class="fa-solid fa-envelope"></i> ${hotel.email || "N/A"}</p>
        </div>
      </section>

      <section class="rooms-section">
        <div class="rooms-tabs-header">
          <button id="roomsTabBtn" class="rooms-tab-btn active">Rooms (<span id="roomsTotalBadge">${hotel.roomCount}</span>)</button>
          <button id="reviewsTabBtn" class="rooms-tab-btn">Reviews (<span id="reviewsTotalBadge">${hotel.reviewCount}</span>)</button>
        </div>

        <div id="roomsViewArea">
          <div class="rooms-controls-bar">
            <button id="roomFilterToggleBtn" class="room-filter-toggle">
              <i class="fa-solid fa-sliders"></i> Filters
            </button>
          </div>

          <div id="roomFilterPanel" class="room-filter-panel hidden">
            <div class="room-filter-grid">
              <div class="filter-field">
                <label>Room Type</label>
                <select id="roomTypeSelect">
                  <option value="">All Types</option>
                  <option value="0">Standard</option>
                  <option value="1">Deluxe</option>
                  <option value="2">Penthouse</option>
                  <option value="3">FamilySuite</option>
                  <option value="4">Accessible</option>
                </select>
              </div>

              <div class="filter-field">
                <label>Min Price ($)</label>
                <input type="number" id="minPriceInput" placeholder="Min">
              </div>

              <div class="filter-field">
                <label>Max Price ($)</label>
                <input type="number" id="maxPriceInput" placeholder="Max">
              </div>

              <div class="filter-field">
                <label>Capacity</label>
                <select id="capacitySelect">
                  <option value="">Any</option>
                  <option value="1">1 Person</option>
                  <option value="2">2 Persons</option>
                  <option value="3">3 Persons</option>
                  <option value="4">4+ Persons</option>
                </select>
              </div>

              <div class="filter-field">
                <label>Availability</label>
                <select id="availableSelect">
                  <option value="">All</option>
                  <option value="true">Available</option>
                  <option value="false">Booked</option>
                </select>
              </div>

              <div class="filter-field" style="justify-content: flex-end;">
                <button id="resetRoomFiltersBtn" class="btn-clear-rooms">Reset</button>
              </div>
            </div>
          </div>

          <div class="rooms-grid" id="roomsGridContainer"></div>
        </div>

        <div id="reviewsViewArea" style="display: none; padding-top: 24px;">
          <form id="reviewForm" style="display: flex; gap: 12px; align-items: center; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; flex-wrap: wrap;">
            <label for="ratingSelect" style="font-weight: 600; color: #475569;">შეაფასეთ სასტუმრო:</label>
            <select id="ratingSelect" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1;">
              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
              <option value="4">⭐⭐⭐⭐ (4)</option>
              <option value="3">⭐⭐⭐ (3)</option>
              <option value="2">⭐⭐ (2)</option>
              <option value="1">⭐ (1)</option>
            </select>
            <button type="submit" id="submitReviewBtn" class="btn btn-primary" style="padding: 8px 20px;">${reviewBtnText}</button>
          </form>

          <div id="reviewsList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;"></div>
        </div>
      </section>
    `;

    // DOM ელემენტები (გვერდის აგების შემდეგ უკვე არსებობს)
    const roomsContainer = document.getElementById("roomsGridContainer");
    const roomsTotalBadge = document.getElementById("roomsTotalBadge");
    const roomFilterToggleBtn = document.getElementById("roomFilterToggleBtn");
    const roomFilterPanel = document.getElementById("roomFilterPanel");

    const roomTypeSelect = document.getElementById("roomTypeSelect");
    const minPriceInput = document.getElementById("minPriceInput");
    const maxPriceInput = document.getElementById("maxPriceInput");
    const capacitySelect = document.getElementById("capacitySelect");
    const availableSelect = document.getElementById("availableSelect");
    const resetRoomFiltersBtn = document.getElementById("resetRoomFiltersBtn");

    const roomsTabBtn = document.getElementById("roomsTabBtn");
    const reviewsTabBtn = document.getElementById("reviewsTabBtn");
    const roomsViewArea = document.getElementById("roomsViewArea");
    const reviewsViewArea = document.getElementById("reviewsViewArea");

    // ტაბების გადართვა: Rooms <-> Reviews. Reviews-ზე გადასვლისას იტვირთება შეფასებები
    roomsTabBtn.addEventListener("click", () => {
      roomsTabBtn.classList.add("active");
      reviewsTabBtn.classList.remove("active");
      roomsViewArea.style.display = "block";
      reviewsViewArea.style.display = "none";
    });

    reviewsTabBtn.addEventListener("click", () => {
      reviewsTabBtn.classList.add("active");
      roomsTabBtn.classList.remove("active");
      roomsViewArea.style.display = "none";
      reviewsViewArea.style.display = "block";
      renderHotelReviews(hotelId);
    });

    // შეფასების გაგზავნა (1-5 ვარსკვლავი). ლოგინის გარეშე -> login.html
    const reviewForm = document.getElementById("reviewForm");
    reviewForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentToken = localStorage.getItem("token");

      if (!currentToken) {
        localStorage.setItem("redirectAfterLogin", window.location.href);
        window.location.href = "login.html";
        return;
      }

      const rating = Number(document.getElementById("ratingSelect").value);
      const res = await addHotelReview(hotelId, rating);
      if (res) {
        await renderHotelReviews(hotelId);

        const reviewsTotalBadge = document.getElementById("reviewsTotalBadge");
        const reviewsHeaderBadge = document.getElementById("reviewsHeaderBadge");
        if (reviewsTotalBadge) {
          reviewsTotalBadge.textContent = Number(reviewsTotalBadge.textContent || 0) + 1;
        }
        if (reviewsHeaderBadge) {
          reviewsHeaderBadge.textContent = Number(reviewsHeaderBadge.textContent || 0) + 1;
        }
      }
    });

    // ოთახების ფილტრის პანელის გახსნა/დახურვა
    roomFilterToggleBtn.addEventListener("click", () => {
      roomFilterPanel.classList.toggle("hidden");
    });

    // ოთახების ბარათების აგება (.room-card)
    function renderRoomsList(rooms) {
      roomsContainer.innerHTML = "";
      roomsTotalBadge.textContent = rooms.length;

      if (!rooms || rooms.length === 0) {
        roomsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">ოთახები ვერ მოიძებნა.</p>';
        return;
      }

      rooms.forEach(room => {
        let roomStars = "";
        for (let i = 0; i < 5; i++) {
          roomStars += i < Math.floor(room.averageRating || 0)
            ? '<i class="fa-solid fa-star"></i>'
            : '<i class="fa-regular fa-star"></i>';
        }

        const roomCard = document.createElement("div");
        roomCard.className = "room-card";
        roomCard.innerHTML = `
          <div class="room-img-wrapper">
            <img src="${room.thumbnail}" alt="${room.roomType}" class="room-img">
            ${room.isAvailable ? '<span class="badge-available">Available</span>' : ''}
          </div>
          <div class="room-body">
            <div class="room-header-row">
              <h3 class="room-type">${room.roomType}</h3>
              <span class="room-num">#${room.roomNumber}</span>
            </div>
            <div class="room-specs">
              <span><i class="fa-solid fa-user"></i> ${room.capacity}</span>
              <span><i class="fa-solid fa-bed"></i> ${room.bedCount}</span>
              <span class="room-stars">${roomStars}</span>
            </div>
            <div class="room-price-row">
              <span class="price-val">$${room.pricePerNight}</span>
              <span class="price-period">/ night</span>
            </div>
            <button class="btn btn-primary btn-book" onclick="bookRoom(${room.id})">Book Now</button>
          </div>
        `;
        roomsContainer.appendChild(roomCard);
      });
    }

    // GET /rooms/filter: HotelId, RoomType, MinPrice, MaxPrice, MinCapacity, IsAvailable (ერთდროულად 10 ოთახი)
    async function fetchFilteredRooms() {
      roomsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">იტვირთება ოთახები...</p>';

      const queryParams = new URLSearchParams();
      queryParams.append("HotelId", hotelId);
      queryParams.append("Take", "10");
      queryParams.append("Page", "1");

      if (roomTypeSelect.value !== "") queryParams.append("RoomType", roomTypeSelect.value);
      if (minPriceInput.value) queryParams.append("MinPrice", minPriceInput.value);
      if (maxPriceInput.value) queryParams.append("MaxPrice", maxPriceInput.value);
      if (capacitySelect.value) queryParams.append("MinCapacity", capacitySelect.value);
      if (availableSelect.value !== "") queryParams.append("IsAvailable", availableSelect.value);

      try {
        const res = await fetch(`https://bookingapi.stepacademy.ge/api/rooms/filter?${queryParams.toString()}`, {
          headers: { "accept": "application/json" }
        });
        const data = await res.json();
        renderRoomsList((data && data.data && data.data.items) ? data.data.items : []);
      } catch (err) {
        console.error(err);
        roomsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">შეცდომა ოთახების გაფილტვრისას.</p>';
      }
    }

    // ფილტრის ნებისმიერი ცვლილებისას ოთახები თავიდან იტვირთება
    roomTypeSelect.addEventListener("change", fetchFilteredRooms);
    minPriceInput.addEventListener("input", fetchFilteredRooms);
    maxPriceInput.addEventListener("input", fetchFilteredRooms);
    capacitySelect.addEventListener("change", fetchFilteredRooms);
    availableSelect.addEventListener("change", fetchFilteredRooms);

    // Reset: ფილტრების გასუფთავება
    resetRoomFiltersBtn.addEventListener("click", () => {
      roomTypeSelect.value = "";
      minPriceInput.value = "";
      maxPriceInput.value = "";
      capacitySelect.value = "";
      availableSelect.value = "";
      fetchFilteredRooms();
    });

    // ოთახების პირველადი ჩატვირთვა
    fetchFilteredRooms();
  } catch (error) {
    console.error(error);
    content.innerHTML = "<p style='text-align: center; color: red;'>სასტუმროს ჩატვირთვა ვერ მოხერხდა.</p>";
  }
});

// Book Now -> ოთახის გვერდი (room.html?id=...)
function bookRoom(roomId) {
  window.location.href = `room.html?id=${roomId}`;
}

// navbar-ის მარჯვენა მხარე: Sign In ან ინიციალები
function renderNavbarAuth() {
  const navAuth = document.getElementById("navAuth");
  if (!navAuth) return;

  const token = localStorage.getItem("token");

  if (!token) {
    navAuth.innerHTML = '<a href="login.html" class="btn btn-primary btn-sm">Sign In</a>';
    return;
  }

  let initials = "SS";

  try {
    const payloadBase64 = token.split(".")[1];
    const decodedJson = JSON.parse(atob(payloadBase64));
    const fullName = decodedJson.name || decodedJson["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "User";

    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].substring(0, 2).toUpperCase();
    }
  } catch (e) {
    initials = "SS";
  }

  navAuth.innerHTML = `
    <a href="profile.html" class="user-avatar-btn">${initials}</a>
  `;
}

renderNavbarAuth();

// ---------- შეფასებების (reviews) API ----------
const BASE_URL = 'https://bookingapi.stepacademy.ge/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// სასტუმროს შეფასებების წამოღება
async function getHotelReviews(hotelId, page = 1, take = 10) {
  try {
    const res = await fetch(`${BASE_URL}/reviews/hotel/${hotelId}?Page=${page}&Take=${take}`);
    if (!res.ok) throw new Error();
    const result = await res.json();
    return result.data;
  } catch (error) {
    console.error(error);
  }
}

// ახალი შეფასების დამატება (მოითხოვს ტოკენს)
async function addHotelReview(hotelId, rate) {
  try {
    const res = await fetch(`${BASE_URL}/reviews/hotel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ hotelId: Number(hotelId), rate })
    });
    if (!res.ok) throw new Error();
    const result = await res.json();
    return result.data;
  } catch (error) {
    console.error(error);
  }
}

// შეფასების განახლება (ამ გვერდზე ამჟამად არ გამოიყენება)
async function updateReview(reviewId, rate) {
  try {
    const res = await fetch(`${BASE_URL}/reviews`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reviewId, rate })
    });
    if (!res.ok) throw new Error();
    const result = await res.json();
    return result.data;
  } catch (error) {
    console.error(error);
  }
}

// შეფასების წაშლა (ამ გვერდზე ამჟამად არ გამოიყენება)
async function deleteReview(reviewId) {
  try {
    const res = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error();
    const result = await res.json();
    return result.data;
  } catch (error) {
    console.error(error);
  }
}

// შეფასებების ბარათების აგება (#reviewsList)
async function renderHotelReviews(hotelId) {
  const container = document.getElementById('reviewsList');
  if (!container) return;
  container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">იტვირთება შეფასებები...</p>';

  const data = await getHotelReviews(hotelId);

  if (!data || !data.items || data.items.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">შეფასებები ჯერ არ არის.</p>';
    return;
  }

  container.innerHTML = data.items.map(item => `
    <div class="review-card" data-id="${item.id}" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
      <p style="margin: 0 0 6px 0; font-weight: 600; color: #0f172a;">${item.user?.firstName || 'ანონიმი'} ${item.user?.lastName || ''}</p>
      <p style="margin: 0 0 8px 0; color: #eab308;">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)} <span style="color: #64748b; font-size: 13px;">(${item.rating}/5)</span></p>
      <small style="color: #94a3b8; font-size: 12px;">${new Date(item.createdAt).toLocaleDateString()}</small>
    </div>
  `).join('');
}