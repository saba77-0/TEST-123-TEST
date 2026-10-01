
// გვერდის ჩატვირთვისას ეშვება მთელი ლოგიკა
document.addEventListener("DOMContentLoaded", async () => {
  renderNavbarAuth();

  // ლოგინის გარეშე -> login.html (ლოგინის შემდეგ ამავე გვერდზე დაბრუნდება)
  const token = localStorage.getItem("token");
  if (!token) {
    localStorage.setItem("redirectAfterLogin", window.location.href);
    window.location.replace("login.html");
    return;
  }

  // URL-იდან: ?id=ოთახის ID (არასავალდებულო: &checkIn=...&checkOut=...)
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("id");
  const checkInParam = params.get("checkIn");
  const checkOutParam = params.get("checkOut");

  if (!roomId) {
    alert("Room ID not found!");
    window.location.href = "index.html";
    return;
  }

  // 'Back to room' ბმული ამ ოთახის გვერდზე
  const backToRoomLink = document.getElementById("backToRoomLink");
  if (backToRoomLink) backToRoomLink.href = `room.html?id=${roomId}`;

  // DOM ელემენტები (booking.html-იდან)
  const checkInInput = document.getElementById("bookingCheckIn");
  const checkOutInput = document.getElementById("bookingCheckOut");
  const guestsInput = document.getElementById("bookingGuests");
  const nightsBadge = document.getElementById("nightsBadge");
  const maxCapacityText = document.getElementById("maxCapacityText");

  const summaryRoomImg = document.getElementById("summaryRoomImg");
  const summaryRoomName = document.getElementById("summaryRoomName");
  const summaryHotelName = document.getElementById("summaryHotelName");
  const summaryStars = document.getElementById("summaryStars");
  const summaryPricePerNight = document.getElementById("summaryPricePerNight");
  const summaryNightsCount = document.getElementById("summaryNightsCount");
  const summaryGuestsCount = document.getElementById("summaryGuestsCount");
  const summaryTotalPrice = document.getElementById("summaryTotalPrice");
  const confirmBookingBtn = document.getElementById("confirmBookingBtn");

  // roomPrice და maxCapacity API-დან შეივსება
  let roomPrice = 0;
  let maxCapacity = 2;

  // ნაგულისხმევი თარიღები: ხვალ -> ზეგ. min: დღევანდელზე ადრე ვერ აირჩევა
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const formatD = (d) => d.toISOString().split("T")[0];

  checkInInput.value = checkInParam || formatD(tomorrow);
  checkOutInput.value = checkOutParam || formatD(dayAfterTomorrow);

  checkInInput.min = formatD(new Date());
  checkOutInput.min = formatD(tomorrow);

  // ოთახის დეტალების წამოღება და summary ბლოკის შევსება (სურათი, სახელი, სასტუმრო, ფასი, max სტუმრები)
  try {
    const res = await fetch(`https://bookingapi.stepacademy.ge/api/rooms/details/${roomId}`, {
      headers: { "accept": "application/json" }
    });

    if (!res.ok) throw new Error("Room not found");
    const json = await res.json();
    const room = json.data;

    roomPrice = room.pricePerNight || 0;
    maxCapacity = room.capacity || 2;

    summaryRoomImg.src = room.thumbnail || "https://via.placeholder.com/90";
    summaryRoomName.textContent = room.roomType || `Room #${room.roomNumber}`;
    summaryHotelName.textContent = room.hotel?.name || "Hotel";
    summaryPricePerNight.textContent = `$${roomPrice}`;

    if (maxCapacityText) {
      maxCapacityText.innerHTML = `<i class="fa-solid fa-circle-info"></i> Max capacity: ${maxCapacity} guests`;
    }
    guestsInput.max = maxCapacity;

    let starsHtml = "";
    for (let i = 0; i < 5; i++) {
      starsHtml += '<i class="fa-solid fa-star" style="color: #f59e0b; margin-right: 2px;"></i>';
    }
    summaryStars.innerHTML = starsHtml;

    recalculateSummary();
  } catch (err) {
    console.error(err);
    alert("ოთახის მონაცემების წამოღება ვერ მოხერხდა.");
  }

  // ღამეების რაოდენობა და ჯამი (ფასი x ღამე). განახლდება nights ბეჯი და summary
  function recalculateSummary() {
    const inDate = new Date(checkInInput.value);
    const outDate = new Date(checkOutInput.value);

    let diffDays = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) diffDays = 1;

    nightsBadge.innerHTML = `<i class="fa-solid fa-moon"></i> ${diffDays} night${diffDays > 1 ? 's' : ''}`;
    summaryNightsCount.textContent = diffDays;
    summaryGuestsCount.textContent = guestsInput.value || 1;

    const total = roomPrice * diffDays;
    summaryTotalPrice.textContent = `$${total}`;
  }

  // თარიღების/სტუმრების შეცვლისას summary თავიდან ითვლება. check-out ყოველთვის check-in-ზე გვიან უნდა იყოს
  checkInInput.addEventListener("change", () => {
    if (new Date(checkOutInput.value) <= new Date(checkInInput.value)) {
      const nextD = new Date(checkInInput.value);
      nextD.setDate(nextD.getDate() + 1);
      checkOutInput.value = formatD(nextD);
    }
    recalculateSummary();
  });

  checkOutInput.addEventListener("change", recalculateSummary);
  guestsInput.addEventListener("input", recalculateSummary);

  // Confirm Booking ღილაკი
  if (confirmBookingBtn) {
    confirmBookingBtn.addEventListener("click", async () => {
      confirmBookingBtn.disabled = true;
      confirmBookingBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Booking...`;

      const checkInVal = checkInInput.value;
      const checkOutVal = checkOutInput.value;

      if (!checkInVal || !checkOutVal) {
        alert("გთხოვთ აირჩიოთ Check-in და Check-out თარიღები!");
        confirmBookingBtn.disabled = false;
        confirmBookingBtn.innerHTML = `<i class="fa-solid fa-check"></i> Confirm Booking`;
        return;
      }

      // API-სთვის თარიღები ISO ფორმატში (check-in 14:00, check-out 12:00 UTC)
      const checkInISO = new Date(`${checkInVal}T14:00:00Z`).toISOString();
      const checkOutISO = new Date(`${checkOutVal}T12:00:00Z`).toISOString();

      const payload = {
        roomId: Number(roomId),
        checkInDate: checkInISO,
        checkOutDate: checkOutISO,
        guestCount: Number(guestsInput.value) || 1
      };

      // POST /bookings. თუ API წარუმატებელია, ჯავშანი მაინც ინახება ლოკალურად (fallback)
      let apiBookingId = null;

      try {
        const res = await fetch("https://bookingapi.stepacademy.ge/api/bookings", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const resData = await res.json().catch(() => ({}));
          apiBookingId = resData.data || resData.id;
        }
      } catch (err) {
        console.warn("API request fallback triggered:", err);
      }

      const inDate = new Date(checkInVal);
      const outDate = new Date(checkOutVal);
      let diffDays = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) diffDays = 1;

      const calcTotal = roomPrice * diffDays;

      // ჯავშნის ობიექტი, რომელსაც profile.js აჩვენებს Reservations ტაბში
      const newBooking = {
        id: apiBookingId || Date.now(),
        hotelName: summaryHotelName.textContent || "Hotel Stay",
        roomName: summaryRoomName.textContent || "Room",
        roomThumbnail: summaryRoomImg.src,
        checkInDate: checkInVal,
        checkOutDate: checkOutVal,
        totalPrice: calcTotal,
        guestCount: Number(guestsInput.value) || 1,
        status: "Pending"
      };

      const localList = JSON.parse(localStorage.getItem("user_custom_bookings") || "[]");
      localList.unshift(newBooking);
      localStorage.setItem("user_custom_bookings", JSON.stringify(localList));

      sessionStorage.setItem("activeProfileTab", "reservationsTab");
      window.location.href = "profile.html";
    });
  }
});

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