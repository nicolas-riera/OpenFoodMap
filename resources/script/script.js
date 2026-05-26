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
        .select('Name, Latitude, Longitude, Description');

    if (error) {
        console.error('Error loading users :', error);
        return;
    }

    users.forEach(user => {
        if (user.Latitude && user.Longitude) {
            const lat = parseFloat(user.Latitude);
            const lng = parseFloat(user.Longitude);

            const marker = L.marker([lat, lng]).addTo(map);

            const popupContent = `<b>${user.Name}</b><br>${user.Description || "Pas de description."}`;
            marker.bindPopup(popupContent);
        }
    });
}

loadUsersMarkers();