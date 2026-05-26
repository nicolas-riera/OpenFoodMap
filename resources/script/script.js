const SUPABASE_URL = 'https://xkgdwqfldzqzsahyvicf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T2lUSzY9d5N1PWMt0cveEg_uJIdoJoO'; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const maxBounds = L.latLngBounds(
    L.latLng(-90, -180), 
    L.latLng(90, 180)    
);

const session = JSON.parse(localStorage.getItem('off_user_session'));

if (!session || !session.isLoggedIn) {
    window.location.href = 'login.html';
}

const map = L.map('map', {
    maxBounds: maxBounds,
    maxBoundsViscosity: 1.0
}).setView([47, 7], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 2,
    maxZoom: 19,
    noWrap: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

async function loadUsersMarkers() {
    const { data: users, error } = await supabaseClient
        .from('User') 
        .select('name, latitude, longitude, description, language');

    if (error) {
        console.error('Error loading users :', error);
        return;
    }

    users.forEach(user => {
        if (user.latitude && user.longitude) {
            const lat = parseFloat(user.latitude);
            const lng = parseFloat(user.longitude);

            const marker = L.marker([lat, lng]).addTo(map);

            const langValue = user.language && user.language !== "null" ? user.language.trim() : "";
            const langContent = langValue ? `<br>Langue : ${langValue}` : "";   

            const popupContent = `<b>${user.name}</b><br>${user.description || "Pas de description."}${langContent}`;
            marker.bindPopup(popupContent);
        }
    });
}

loadUsersMarkers();