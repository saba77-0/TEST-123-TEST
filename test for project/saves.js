
// API-ს ძირითადი მისამართი
const API_BASE = "https://bookingapi.stepacademy.ge/api";

// შენახული სასტუმროები და ოთახები: id -> saveId
export const savedHotelsMap = new Map();
export const savedRoomsMap = new Map();


// შესული მომხმარებლის შენახული სასტუმროებისა და ოთახების წამოღება
export async function loadUserSaves() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const headers = {
      "accept": "application/json",
      "Authorization": `Bearer ${token}`
    };

   
    const resHotels = await fetch(`${API_BASE}/saves/hotels`, { headers });
    if (resHotels.ok) {
      const data = await resHotels.json();
      const items = data.items || data.data || [];
      savedHotelsMap.clear();
      items.forEach(h => {
      
        savedHotelsMap.set(h.id, h.saveId || h.id);
      });
    }

    
    const resRooms = await fetch(`${API_BASE}/saves/rooms?Take=50&Page=1`, { headers });
    if (resRooms.ok) {
      const data = await resRooms.json();
      const items = data.items || data.data || [];
      savedRoomsMap.clear();
      items.forEach(r => {
        savedRoomsMap.set(r.id, r.saveId || r.id);
      });
    }
  } catch (err) {
    console.error("Failed to load user saves:", err);
  }
}

// სასტუმროს შენახვა/წაშლა (POST /saves/hotel/{id} ან DELETE /saves/{saveId})
export async function toggleSaveHotel(hotelId, btnElement) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("გთხოვთ გაიაროთ ავტორიზაცია სასტუმროს შესანახად!");
    window.location.href = "login.html";
    return;
  }

  const icon = btnElement.querySelector("i");
  const isSaved = savedHotelsMap.has(Number(hotelId));

  try {
    if (isSaved) {
    
      const saveId = savedHotelsMap.get(Number(hotelId));
      const res = await fetch(`${API_BASE}/saves/${saveId}`, {
        method: "DELETE",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        savedHotelsMap.delete(Number(hotelId));
        icon.className = "fa-regular fa-heart";
        btnElement.classList.remove("active");
      }
    } else {
   
      const res = await fetch(`${API_BASE}/saves/hotel/${hotelId}`, {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const result = await res.json();
        const saveId = result.data; 
        savedHotelsMap.set(Number(hotelId), saveId);
        icon.className = "fa-solid fa-heart";
        btnElement.classList.add("active");
      }
    }
  } catch (err) {
    console.error("Save error:", err);
  }
}


// ოთახის შენახვა/წაშლა (POST /saves/room/{id} ან DELETE /saves/{saveId})
export async function toggleSaveRoom(roomId, btnElement) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("გთხოვთ გაიაროთ ავტორიზაცია ოთახის შესანახად!");
    window.location.href = "login.html";
    return;
  }

  const icon = btnElement.querySelector("i");
  const isSaved = savedRoomsMap.has(Number(roomId));

  try {
    if (isSaved) {
      const saveId = savedRoomsMap.get(Number(roomId));
      const res = await fetch(`${API_BASE}/saves/${saveId}`, {
        method: "DELETE",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        savedRoomsMap.delete(Number(roomId));
        icon.className = "fa-regular fa-heart";
        btnElement.classList.remove("active");
      }
    } else {
      const res = await fetch(`${API_BASE}/saves/room/${roomId}`, {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const result = await res.json();
        const saveId = result.data;
        savedRoomsMap.set(Number(roomId), saveId);
        icon.className = "fa-solid fa-heart";
        btnElement.classList.add("active");
      }
    }
  } catch (err) {
    console.error("Save room error:", err);
  }
}
