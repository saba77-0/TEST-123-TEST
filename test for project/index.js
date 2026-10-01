
const savedHotelsMap = new Map();

// გვერდის ჩატვირთვისას: navbar-ის ავტორიზაცია, სასტუმროების წამოღება, ფილტრების მოსმენა
document.addEventListener("DOMContentLoaded", async () => {
  renderNavbarAuth();

  // allHotels - API-დან წამოღებული ყველა სასტუმრო. ფილტრები ყოველთვის ამ სიიდან ითვლება
  let allHotels = [];
  // DOM ელემენტები (index.html-იდან)
  const hotelsGrid = document.getElementById("hotelsGrid");
  const filterToggleBtn = document.getElementById("filterToggleBtn");
  const filterPanel = document.getElementById("filterPanel");
  const filterCountBadge = document.getElementById("filterCountBadge");
  const activeTagsRow = document.getElementById("activeTagsRow");
  const tagsList = document.getElementById("tagsList");
  const clearAllBtn = document.getElementById("clearAllBtn");

  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  const countryFilter = document.getElementById("countryFilter");
  const cityFilter = document.getElementById("cityFilter");
  const starsFilter = document.getElementById("starsFilter");
  const ratingFilter = document.getElementById("ratingFilter");
  const sortBy = document.getElementById("sortBy");

  // შესული მომხმარებლის შენახული სასტუმროების წამოღება (GET /saves/hotels).
  // თუ ტოკენი ვადაგასულია (401) - ტოკენი იშლება და navbar განახლდება
  async function loadUserSaves() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("https://bookingapi.stepacademy.ge/api/saves/hotels", {
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        renderNavbarAuth();
        return;
      }

      if (res.ok) {
        const json = await res.json();
        const items = json.items || json.data || [];
        savedHotelsMap.clear();
        if (Array.isArray(items)) {
          items.forEach(h => {
            savedHotelsMap.set(Number(h.id), h.saveId || h.id);
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ყველა სასტუმროს წამოღება API-დან (GET /hotels) და ეკრანზე გამოტანა
  async function loadHotels() {
    try {
      await loadUserSaves();

      const res = await fetch("https://bookingapi.stepacademy.ge/api/hotels", {
        headers: { "accept": "application/json" }
      });

      if (!res.ok) throw new Error("HTTP Error " + res.status);

      const json = await res.json();

      if (json && json.data && Array.isArray(json.data.items)) {
        allHotels = json.data.items;
      } else if (json && Array.isArray(json.data)) {
        allHotels = json.data;
      } else if (Array.isArray(json)) {
        allHotels = json;
      } else {
        allHotels = [];
      }

      renderHotels(allHotels);
    } catch (err) {
      console.error(err);
      if (hotelsGrid) {
        hotelsGrid.innerHTML = "<p style='color: red;'>სასტუმროების ჩატვირთვა ვერ მოხერხდა.</p>";
      }
    }
  }

  // პირველადი ჩატვირთვა
  loadHotels();

  // Filters ღილაკი: ფილტრის პანელის გახსნა/დახურვა (.hidden კლასით)
  if (filterToggleBtn && filterPanel) {
    filterToggleBtn.addEventListener("click", () => {
      filterPanel.classList.toggle("hidden");
    });
  }

  // ძებნა: Search ღილაკზე დაჭერა ან Enter
  if (searchBtn) {
    searchBtn.addEventListener("click", applyFilters);
  }
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") applyFilters();
    });
  }

  // ფილტრის ნებისმიერი ველის ცვლილებისას სია თავიდან ითვლება (applyFilters)
  if (countryFilter) countryFilter.addEventListener("change", applyFilters);
  if (cityFilter) cityFilter.addEventListener("change", applyFilters);
  if (starsFilter) starsFilter.addEventListener("change", applyFilters);
  if (ratingFilter) ratingFilter.addEventListener("change", applyFilters);
  if (sortBy) sortBy.addEventListener("change", applyFilters);

  // Clear all: ყველა ფილტრისა და ძებნის გასუფთავება
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (countryFilter) countryFilter.value = "";
      if (cityFilter) cityFilter.value = "";
      if (starsFilter) starsFilter.value = "";
      if (ratingFilter) ratingFilter.value = "";
      if (sortBy) sortBy.value = "";
      applyFilters();
    });
  }

  // სასტუმროების ბარათების HTML-ის აგება (.hotel-card + გულის ღილაკი)
  function renderHotels(hotels) {
    if (!hotelsGrid) return;
    if (!Array.isArray(hotels) || hotels.length === 0) {
      hotelsGrid.innerHTML = "<p style='color: #64748b;'>სასტუმროები ვერ მოიძებნა.</p>";
      return;
    }

    hotelsGrid.innerHTML = hotels.map(hotel => {
      const isSaved = savedHotelsMap.has(Number(hotel.id));

      return `
        <div class="hotel-card-wrapper" style="position: relative;">
          <a href="hotel.html?id=${hotel.id}" class="hotel-card">
            <div class="card-img-wrapper">
              <img src="${hotel.thumbnail || hotel.mainImage || 'https://via.placeholder.com/400x250'}" alt="${hotel.name}" class="card-img">
              <div class="badge-stars">
                <i class="fa-solid fa-star"></i> ${hotel.starRating || 5}
              </div>
            </div>
            <div class="card-body">
              <h3 class="card-title">${hotel.name}</h3>
              <div class="card-footer-info">
                <div class="stars-rating">
                  ${renderStars(hotel.averageRating || hotel.rating || 0)}
                  <span class="review-count">(${hotel.reviewCount || 0})</span>
                </div>
                <div class="rooms-count">${hotel.roomCount || (hotel.rooms ? hotel.rooms.length : 0)} rooms</div>
              </div>
            </div>
          </a>
          <button class="btn-wishlist ${isSaved ? 'active' : ''}" onclick="toggleSaveHotel(${hotel.id}, this)">
            <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
        </div>
      `;
    }).join("");
  }

  // რეიტინგის ვარსკვლავები: სავსე და ცარიელი (სულ 5)
  function renderStars(rating) {
    let stars = "";
    const floor = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      stars += i < floor
        ? '<i class="fa-solid fa-star"></i>'
        : '<i class="fa-regular fa-star"></i>';
    }
    return stars;
  }

  // ძებნა (სახელი/ქალაქი) + ქვეყანა + ქალაქი + მინ. ვარსკვლავები + მინ. რეიტინგი,
  // შემდეგ დალაგება. ბოლოს განახლდება ტეგები და ბარათები
  function applyFilters() {
    let filtered = [...allHotels];
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selCountry = countryFilter ? countryFilter.value : "";
    const selCity = cityFilter ? cityFilter.value : "";
    const selStars = starsFilter ? starsFilter.value : "";
    const selRating = ratingFilter ? ratingFilter.value : "";
    const selSort = sortBy ? sortBy.value : "";

    if (searchTerm) {
      filtered = filtered.filter(h =>
        (h.name && h.name.toLowerCase().includes(searchTerm)) ||
        (h.city && h.city.toLowerCase().includes(searchTerm))
      );
    }

    if (selCountry) {
      filtered = filtered.filter(h => (h.country || (h.address && h.address.country)) === selCountry);
    }

    if (selCity) {
      filtered = filtered.filter(h => (h.city || (h.address && h.address.city)) === selCity);
    }

    if (selStars) {
      filtered = filtered.filter(h => (h.starRating || 0) >= parseInt(selStars));
    }

    if (selRating) {
      filtered = filtered.filter(h => (h.averageRating || h.rating || 0) >= parseFloat(selRating));
    }

    if (selSort) {
      if (selSort === "name") {
        filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      } else if (selSort === "starRating") {
        filtered.sort((a, b) => (b.starRating || 0) - (a.starRating || 0));
      } else if (selSort === "averageRating") {
        filtered.sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0));
      } else if (selSort === "reviewCount") {
        filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      }
    }

    updateActiveTags(selCountry, selCity, selStars, selRating, selSort);
    renderHotels(filtered);
  }

  // აქტიური ფილტრების 'ტეგების' ხაზი და Filters ღილაკზე რიცხვის ბეჯი
  function updateActiveTags(country, city, stars, rating, sort) {
    if (!tagsList || !filterCountBadge || !activeTagsRow) return;
    tagsList.innerHTML = "";
    let count = 0;

    if (country) {
      count++;
      tagsList.innerHTML += `<div class="filter-tag" onclick="clearFilterField('country')">Country: ${country} <i class="fa-solid fa-xmark"></i></div>`;
    }
    if (city) {
      count++;
      tagsList.innerHTML += `<div class="filter-tag" onclick="clearFilterField('city')">City: ${city} <i class="fa-solid fa-xmark"></i></div>`;
    }
    if (stars) {
      count++;
      tagsList.innerHTML += `<div class="filter-tag" onclick="clearFilterField('stars')">${stars}★ <i class="fa-solid fa-xmark"></i></div>`;
    }
    if (rating) {
      count++;
      tagsList.innerHTML += `<div class="filter-tag" onclick="clearFilterField('rating')">${rating}+ Rating <i class="fa-solid fa-xmark"></i></div>`;
    }
    if (sort) {
      count++;
      tagsList.innerHTML += `<div class="filter-tag" onclick="clearFilterField('sort')">Sort: ${sort} <i class="fa-solid fa-xmark"></i></div>`;
    }

    filterCountBadge.textContent = count;
    if (count > 0) {
      filterCountBadge.classList.remove("hidden");
      activeTagsRow.classList.remove("hidden");
    } else {
      filterCountBadge.classList.add("hidden");
      activeTagsRow.classList.add("hidden");
    }
  }

  // ტეგზე დაჭერით ერთი კონკრეტული ფილტრის მოხსნა
  window.clearFilterField = function(type) {
    if (type === "country" && countryFilter) countryFilter.value = "";
    if (type === "city" && cityFilter) cityFilter.value = "";
    if (type === "stars" && starsFilter) starsFilter.value = "";
    if (type === "rating" && ratingFilter) ratingFilter.value = "";
    if (type === "sort" && sortBy) sortBy.value = "";
    applyFilters();
  };
});

// გულის ღილაკი: თუ უკვე შენახულია - DELETE /saves/{id}, თუ არა - POST /saves/hotel/{id}.
// ლოგინის გარეშე გადადის login.html-ზე.
// შენიშვნა: style.css-ში გაქვს წესი, რომელიც ამ გულის ღილაკებს მალავს (button:has(.fa-heart))
window.toggleSaveHotel = async function(hotelId, btn) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("გთხოვთ გაიაროთ ავტორიზაცია სასტუმროს შესანახად!");
    window.location.href = "login.html";
    return;
  }

  const icon = btn.querySelector("i");
  const isSaved = savedHotelsMap.has(Number(hotelId));

  try {
    if (isSaved) {
      const saveId = savedHotelsMap.get(Number(hotelId));
      const res = await fetch(`https://bookingapi.stepacademy.ge/api/saves/${saveId}`, {
        method: "DELETE",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        savedHotelsMap.delete(Number(hotelId));
        icon.className = "fa-regular fa-heart";
        btn.classList.remove("active");
      }
    } else {
      const res = await fetch(`https://bookingapi.stepacademy.ge/api/saves/hotel/${hotelId}`, {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const json = await res.json();
        const saveId = json.data;
        savedHotelsMap.set(Number(hotelId), saveId);
        icon.className = "fa-solid fa-heart";
        btn.classList.add("active");
      }
    }
  } catch (err) {
    console.error(err);
  }
};

// navbar-ის მარჯვენა მხარე: ლოგინის გარეშე - 'Sign In' ღილაკი;
// ლოგინის შემდეგ - ავატარი (სურათი ან ინიციალები: localStorage-იდან ან ტოკენიდან)
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

  if (!initials) {
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
      initials = "GG";
    }
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



