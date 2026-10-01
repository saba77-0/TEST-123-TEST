
//  * ტვირთავს ყველა სასტუმროსა და ოთახს API-დან და findAnswer()-ში ამოწმებს კითხვაში
//  * სასტუმროს სახელს, ქალაქს, ფასს (იაფი/ძვირი/საშუალო) ან სერვისს (აუზი, სპა, დარბაზი)

document.addEventListener("DOMContentLoaded", () => {
  
  // navbar-ის ავატარის განახლება: ლოკალურად შენახული სურათი ან ინიციალები
  function syncGlobalNavAvatar() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const navAvatar = document.querySelector("#navAvatarTop, .user-avatar-btn, .nav-avatar, a[href*='profile']");
    if (!navAvatar) return;

    const savedAvatar = localStorage.getItem("user_profile_avatar");
    const savedInitials = localStorage.getItem("user_initials") || "GG";

    if (savedAvatar && savedAvatar.trim().length > 5) {
      if (!navAvatar.querySelector("img") || navAvatar.querySelector("img").src !== savedAvatar.trim()) {
        navAvatar.innerHTML = `<img src="${savedAvatar.trim()}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
        navAvatar.style.padding = "0";
        navAvatar.style.overflow = "hidden";
      }
    } else {
      if (navAvatar.textContent.trim() !== savedInitials) {
        navAvatar.textContent = savedInitials;
      }
    }
  }

  syncGlobalNavAvatar();
  setTimeout(syncGlobalNavAvatar, 300);
  setTimeout(syncGlobalNavAvatar, 1000);

  // navbar-ის ცვლილებისას ავატარი თავიდან სინქრონდება (რადგან სხვა JS-ები navbar-ს თავიდან ხატავენ)
  const observer = new MutationObserver(() => syncGlobalNavAvatar());
  const navContainer = document.querySelector(".navbar, header, #navAuth");
  if (navContainer) {
    observer.observe(navContainer, { childList: true, subtree: true });
  }

  // ჩატის DOM ელემენტები
  const aiLauncher = document.getElementById("aiLauncher");
  const aiChatWindow = document.getElementById("aiChatWindow");
  const closeAiChat = document.getElementById("closeAiChat");
  const aiChatForm = document.getElementById("aiChatForm");
  const aiInputText = document.getElementById("aiInputText");
  const aiChatMessages = document.getElementById("aiChatMessages");

  if (!aiLauncher || !aiChatWindow) return;

  // ჩატის ღილაკი: ფანჯრის გახსნა/დახურვა
  aiLauncher.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = aiChatWindow.classList.contains("hidden");
    if (isHidden) {
      aiChatWindow.classList.remove("hidden");
      aiChatWindow.style.display = "flex";
      if (aiInputText) setTimeout(() => aiInputText.focus(), 60);
    } else {
      aiChatWindow.classList.add("hidden");
      aiChatWindow.style.display = "none";
    }
  });

  if (closeAiChat) {
    closeAiChat.addEventListener("click", (e) => {
      e.stopPropagation();
      aiChatWindow.classList.add("hidden");
      aiChatWindow.style.display = "none";
    });
  }

  // ახალი შეტყობინების დამატება ჩატში (user ან bot)
  function appendMessageUI(content, sender, isHtml = false) {
    if (!aiChatMessages) return null;
    const msgEl = document.createElement("div");
    msgEl.className = `ai-msg ${sender}`;
    if (isHtml) {
      msgEl.innerHTML = content;
    } else {
      msgEl.textContent = content;
    }
    aiChatMessages.appendChild(msgEl);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    return msgEl;
  }

  // API-დან წამოღებული სასტუმროები და ოთახები (ქეში)
  let hotelsDataCache = [];
  let roomsDataCache = [];
  let isDataLoaded = false;

  // ყველა სასტუმროს, მათი სერვისებისა და ოთახების წამოღება (roomsDataCache-ში ემატება)
  async function initHotels() {
    // ეს ხაზი ადრე დაემატა: ქეშს ასუფთავებს, რომ initHotels ორჯერ გაშვებისას ოთახები არ გაორმაგდეს
    roomsDataCache.length = 0; 
    try {
      const res = await fetch("https://bookingapi.stepacademy.ge/api/hotels?Take=50&Page=1", {
        headers: { "accept": "application/json" }
      });

      if (res.ok) {
        const data = await res.json();
        hotelsDataCache = data.data?.items || data.items || [];

        const detailPromises = hotelsDataCache.map(async (hotel) => {
          try {
            const [detailsRes, roomsRes] = await Promise.all([
              fetch(`https://bookingapi.stepacademy.ge/api/hotels/${hotel.id}`, { headers: { "accept": "application/json" } }),
              fetch(`https://bookingapi.stepacademy.ge/api/rooms/${hotel.id}?Take=50&Page=1`, { headers: { "accept": "application/json" } })
            ]);

            if (detailsRes.ok) {
              const dJson = await detailsRes.json();
              hotel.specifications = dJson.data?.specifications || {};
            }

            if (roomsRes.ok) {
              const rJson = await roomsRes.json();
              const rooms = rJson.data?.items || [];
              rooms.forEach(room => {
                room.hotelName = hotel.name;
                room.hotelId = hotel.id;
                room.city = hotel.address?.city || "";
                roomsDataCache.push(room);
              });
            }
          } catch (err) {}
        });

        await Promise.all(detailPromises);
        isDataLoaded = true;
      }
    } catch (e) {}
  }

  // მონაცემების წინასწარ ჩატვირთვა
  initHotels();

  // კითხვის ანალიზი და პასუხის შერჩევა
  function findAnswer(query) {
    const q = query.toLowerCase().trim();

    // მისალმება
    const greetings = ["გამარჯობა", "სალამი", "მოგესალმებით", "hello", "hi"];
    if (greetings.includes(q)) {
      return {
        text: "გამარჯობა! მე ვარ Step Booking-ის AI ასისტენტი. მკითხეთ ნებისმიერ სასტუმროზე, ფასებზე, ოთახებსა თუ სერვისებზე (აუზი, სპა, დარბაზი და ა.შ.)."
      };
    }

    const safeHotels = Array.isArray(hotelsDataCache) ? hotelsDataCache : [];

    let matchedHotel = null;
    // სასტუმროს სახელის ამოცნობა (ქართულად და ინგლისურად)
    const hotelKeywordsMap = [
      { keys: ["radisson", "radison", "radiosn", "რადისონ"], namePart: "radisson" },
      { keys: ["sheraton", "შერატონ"], namePart: "sheraton" },
      { keys: ["biltmore", "biltmor", "ბილტმორ"], namePart: "biltmore" },
      { keys: ["kabadoni", "kabadon", "ყაბადონ", "კაბადონ"], namePart: "kabadoni" },
      { keys: ["lopota", "ლოპოტა"], namePart: "lopota" },
      { keys: ["stamba", "სტამბა"], namePart: "stamba" },
      { keys: ["rooms", "რუმს"], namePart: "rooms" },
      { keys: ["crowne", "plaza", "ქრაუნ"], namePart: "crowne" },
      { keys: ["fabrika", "ფაბრიკა"], namePart: "fabrika" }
    ];

    for (const item of hotelKeywordsMap) {
      if (item.keys.some(k => q.includes(k))) {
        matchedHotel = safeHotels.find(h => h.name.toLowerCase().includes(item.namePart));
        if (matchedHotel) break;
      }
    }

    if (!matchedHotel) {
      matchedHotel = safeHotels.find(h => {
        const clean = h.name.toLowerCase().replace(/hotel|resort|spa|grand|palace|suites|hostel/g, "").trim();
        return clean && q.includes(clean);
      });
    }

    if (matchedHotel) {
      const hotelRooms = roomsDataCache.filter(r => r.hotelId === matchedHotel.id);
      const specs = matchedHotel.specifications || {};

      const hasPool = specs.Pool ? "კი, აქვს აუზი 🏊" : "არა, აუზი არ არის ❌";
      const hasGym = specs.FitnessCenter ? "კი, აქვს სავარჯიშო დარბაზი 🏋️" : "დარბაზი არ აქვს ❌";
      const hasFood = specs.Restaurant ? "კი, რესტორანი/კვება ხელმისაწვდომია 🍽️" : "კვება/რესტორანი არ არის ❌";

      hotelRooms.sort((a, b) => a.pricePerNight - b.pricePerNight);

      // ფასის ტიპი: საშუალო / ძვირი / იაფი ნომერი კონკრეტულ სასტუმროში
      const isMediumReq = q.includes("საშუალო") || q.includes("შუაში") || q.includes("არც ძვირი") || q.includes("არცძვირი") || q.includes("ნორმალურ");

      if (isMediumReq && hotelRooms.length > 0) {
        const midIndex = Math.floor(hotelRooms.length / 2);
        const midRoom = hotelRooms[midIndex];

        let replyText = `სასტუმრო <strong>${matchedHotel.name}</strong>-ის საშუალო ფასის ნომერია <strong>${midRoom.roomType} (#${midRoom.roomNumber})</strong>.<br><br>`;
        replyText += `• <strong>ფასი:</strong> $${midRoom.pricePerNight} ღამეში<br>`;
        replyText += `• <strong>ტევადობა:</strong> ${midRoom.capacity} სტუმარზე (${midRoom.bedCount} საწოლი)<br>`;
        replyText += `• <strong>აუზი (ბასეინი):</strong> ${hasPool}<br>`;
        replyText += `• <strong>სავარჯიშო დარბაზი:</strong> ${hasGym}<br>`;
        replyText += `• <strong>კვება / რესტორანი:</strong> ${hasFood}`;

        return {
          text: replyText,
          rooms: [midRoom]
        };
      }

      if (q.includes("ძვირ") || q.includes("ლუქს")) {
        const topRoom = hotelRooms[hotelRooms.length - 1];
        return {
          text: `სასტუმრო <strong>${matchedHotel.name}</strong>-ის ყველაზე მდიდრული ნომერია <strong>${topRoom.roomType} (#${topRoom.roomNumber})</strong> — $${topRoom.pricePerNight}/ღამე (${topRoom.capacity} სტუმარზე).<br>სერვისები: აუზი: ${hasPool}, დარბაზი: ${hasGym}, კვება: ${hasFood}.`,
          rooms: [topRoom]
        };
      }

      if (q.includes("იაფ") || q.includes("ხელმისაწვდომ")) {
        const cheapRoom = hotelRooms[0];
        return {
          text: `სასტუმრო <strong>${matchedHotel.name}</strong>-ის ყველაზე ბიუჯეტური ნომერია <strong>${cheapRoom.roomType} (#${cheapRoom.roomNumber})</strong> — $${cheapRoom.pricePerNight}/ღამე (${cheapRoom.capacity} სტუმარზე).<br>სერვისები: აუზი: ${hasPool}, დარბაზი: ${hasGym}, კვება: ${hasFood}.`,
          rooms: [cheapRoom]
        };
      }

      let generalText = `სასტუმრო <strong>${matchedHotel.name}</strong> (${matchedHotel.address?.city || ''}):<br>`;
      generalText += `• <strong>ფასების დიაპაზონი:</strong> $${hotelRooms[0]?.pricePerNight || 0} - $${hotelRooms[hotelRooms.length - 1]?.pricePerNight || 0} / ღამე<br>`;
      generalText += `• <strong>აუზი:</strong> ${hasPool}<br>`;
      generalText += `• <strong>დარბაზი:</strong> ${hasGym}<br>`;
      generalText += `• <strong>კვება/რესტორანი:</strong> ${hasFood}`;

      return {
        text: generalText,
        rooms: hotelRooms.slice(0, 2)
      };
    }

    // სერვისით ძებნა: აუზი, სპა, დარბაზი, ცხოველები
    const wantPool = q.includes("აუზ") || q.includes("ბასეინ") || q.includes("pool");
    const wantSpa = q.includes("სპა") || q.includes("spa");
    const wantGym = q.includes("დარბაზ") || q.includes("სავარჯიშო") || q.includes("fitness") || q.includes("gym");
    const wantPets = q.includes("ცხოველ") || q.includes("ძაღლ") || q.includes("pet");

    if (wantPool || wantSpa || wantGym || wantPets) {
      const filtered = safeHotels.filter(h => {
        const sp = h.specifications || {};
        if (wantPool && !sp.Pool) return false;
        if (wantSpa && !sp.Spa) return false;
        if (wantGym && !sp.FitnessCenter) return false;
        if (wantPets && !sp.PetsAllowed) return false;
        return true;
      });

      if (filtered.length > 0) {
        return {
          text: `აი სასტუმროები თქვენთვის სასურველი სერვისებით:`,
          hotels: filtered.slice(0, 3)
        };
      }
    }

    // ბიუჯეტით ძებნა (მაგ. '100$-მდე')
    const priceMatch = q.match(/(\d+)\s*(\$|დოლარ|usd|-მდე|მდე)?/);
    if ((q.includes("მდე") || q.includes("$") || q.includes("იაფ")) && priceMatch) {
      const maxPrice = parseInt(priceMatch[1], 10);
      const cheapRooms = roomsDataCache
        .filter(r => r.pricePerNight <= maxPrice)
        .sort((a, b) => a.pricePerNight - b.pricePerNight);

      if (cheapRooms.length > 0) {
        return {
          text: `ოთახები <strong>$${maxPrice}</strong>-მდე ბიუჯეტში:`,
          rooms: cheapRooms.slice(0, 2)
        };
      }
    }

    // ქალაქით ძებნა
    const cityKeywords = {
      "თბილის": "Tbilisi", "tbilisi": "Tbilisi",
      "ბათუმ": "Batumi", "batumi": "Batumi",
      "ბორჯომ": "Borjomi", "borjomi": "Borjomi",
      "ყვარელ": "Kvareli", "kvareli": "Kvareli", "ლოპოტა": "Kvareli",
      "სიღნაღ": "Sighnaghi", "sighnaghi": "Sighnaghi"
    };

    for (const [key, cName] of Object.entries(cityKeywords)) {
      if (q.includes(key)) {
        const cHotels = safeHotels.filter(h => h.address?.city?.toLowerCase() === cName.toLowerCase());
        if (cHotels.length > 0) {
          return {
            text: `ქალაქ <strong>${cName}</strong>-ის სასტუმროები:`,
            hotels: cHotels.slice(0, 3)
          };
        }
      }
    }

    return {
      text: "შემიძლია მოგიძებნოთ სასტუმროები ქალაქის მიხედვით, გაჩვენოთ კონკრეტული სასტუმროს ნომრები (იაფი, ძვირი ან საშუალო), ასევე ინფორმაცია აუზზე, კვებასა და სავარჯიშო დარბაზზე."
    };
  }

  // ოთახებისა და სასტუმროების ბარათები ჩატში (.ai-room-card)
  function renderCardsHtml(result) {
    if (result.rooms) {
      return `<div class="ai-cards-wrap">` + result.rooms.map(r => `
        <div class="ai-room-card">
          <img src="${r.thumbnail || ''}" alt="${r.roomType}" class="ai-room-img" />
          <div class="ai-room-body">
            <p class="ai-room-hotel">${r.hotelName}</p>
            <h4 class="ai-room-title">${r.roomType} (#${r.roomNumber})</h4>
            <div class="ai-room-meta">
              <div class="ai-room-specs">
                <span><i class="fa-solid fa-users"></i> ${r.capacity} სტუმარი</span>
                <span><i class="fa-solid fa-bed"></i> ${r.bedCount} საწოლი</span>
              </div>
              <div class="ai-room-price">$${r.pricePerNight} <span>/ღამე</span></div>
            </div>
            <a href="room.html?id=${r.id}" class="ai-room-btn">Book Room Now</a>
          </div>
        </div>
      `).join("") + `</div>`;
    }

    if (result.hotels) {
      return `<div class="ai-cards-wrap">` + result.hotels.map(h => `
        <div class="ai-room-card">
          <img src="${h.thumbnail || ''}" alt="${h.name}" class="ai-room-img" />
          <div class="ai-room-body">
            <h4 class="ai-room-title">${h.name}</h4>
            <p class="ai-room-hotel"><i class="fa-solid fa-location-dot"></i> ${h.address?.city || ''}</p>
            <div class="ai-room-meta">
              <span style="color:#f59e0b; font-size: 0.8rem; font-weight:600;">★ ${h.starRating} Stars</span>
              <span style="font-size: 0.8rem; color:#64748b;">${h.roomCount || 6} ოთახი</span>
            </div>
            <a href="hotel.html?id=${h.id}" class="ai-room-btn">Explore Hotel</a>
          </div>
        </div>
      `).join("") + `</div>`;
    }

    return "";
  }

  // შეტყობინების გაგზავნა: პასუხის ძებნა და ჩატში გამოჩენა
  if (aiChatForm) {
    aiChatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const query = aiInputText.value.trim();
      if (!query) return;

      appendMessageUI(query, "user");
      aiInputText.value = "";

      const loadingEl = appendMessageUI("ვეძებ ბაზაში...", "bot");

      if (!isDataLoaded) {
        await initHotels();
      }

      setTimeout(() => {
        const res = findAnswer(query);
        const cardsHtml = renderCardsHtml(res);
        loadingEl.innerHTML = res.text + cardsHtml;
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
      }, 300);
    });
  }
});

