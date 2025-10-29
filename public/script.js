let map = L.map('map').setView([40, -95], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let currentUser = null;
const api = (url, data) => fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
}).then(r => r.json());

function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}
window.addEventListener('load', () => {
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
});

function showLogin() {
  const ua = document.getElementById("userArea");
  if (currentUser)
    ua.innerHTML = `<img src="${currentUser.profile_pic || '/uploads/default.png'}" class="pfp"> ${currentUser.username} (${currentUser.role}) <button onclick="logout()">Logout</button>`;
  else
    ua.innerHTML = `<button onclick="promptLogin()">Login / Register</button>`;
}
showLogin();

async function promptLogin() {
  const username = prompt("Username:");
  const password = prompt("Password:");
  const register = confirm("Register new account?");
  const route = register ? "/api/register" : "/api/login";
  const res = await api(route, { username, password });
  if (res.error) return alert(res.error);
  if (register) alert("Registered! Now login again.");
  else {
    currentUser = res;
    showLogin();
    loadHouses();
  }
}
function logout() { currentUser = null; showLogin(); }

async function loadHouses() {
  const res = await fetch("/api/houses");
  const houses = await res.json();
  houses.forEach(h => {
    const marker = L.marker([h.lat, h.lng]).addTo(map);
    marker.bindPopup(`<b>${h.rating}</b><br>${h.description}<br><img src="${h.image || ''}" width=100>`);
  });
}
loadHouses();

map.on("click", async e => {
  if (!currentUser) return alert("Login first!");
  const rating = prompt("Candy rating (healthy/small/medium/king/queen/bag/decor):");
  const description = prompt("Describe this house:");
  const body = new FormData();
  body.append("lat", e.latlng.lat);
  body.append("lng", e.latlng.lng);
  body.append("rating", rating);
  body.append("description", description);
  body.append("user_id", currentUser.id);
  const res = await fetch("/api/houses", { method: "POST", body });
  alert("House added!");
});
