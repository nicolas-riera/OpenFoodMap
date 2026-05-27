// Database init
const SUPABASE_URL = 'https://xkgdwqfldzqzsahyvicf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T2lUSzY9d5N1PWMt0cveEg_uJIdoJoO';

const session = JSON.parse(localStorage.getItem('off_user_session'));
const username = session ? session.username : 'guest';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
        headers: {
            'x-user-name': username
        }
    }
});

const authContainer = document.getElementById('auth-buttons');
const storedSession = localStorage.getItem('off_user_session');

if (!session || !session.isLoggedIn) {
    authContainer.innerHTML = '<a href="login.html"><button>Se connecter</button></a>';
} else {
    authContainer.innerHTML = `
        <button id="open-popup-btn">Mon marqueur</button>
        <button id="logout-btn">Se déconnecter</button>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('off_user_session');
        location.reload();
    });
}

// Map preparation 
const maxBounds = L.latLngBounds(
    L.latLng(-90, -180),
    L.latLng(90, 180)
);

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

// Marker Popup system
const openBtn = document.getElementById('open-popup-btn');
const closeBtn = document.getElementById('close-popup-btn');
const popup = document.getElementById('custom-popup');
const popupContentContainer = document.querySelector('.popup-content');

let miniMap = null;
let miniMapMarker = null;
let selectedLat = null;
let selectedLng = null;

if (openBtn && closeBtn && popup) {
    openBtn.addEventListener('click', async () => {
        popupContentContainer.querySelectorAll('.dynamic-content').forEach(el => el.remove());

        const { data: userData, error } = await supabaseClient
            .from('User')
            .select('latitude, longitude, description')
            .eq('name', session.username)
            .maybeSingle();

        const div = document.createElement('div');
        div.className = 'dynamic-content';

        const hasMarker = userData && userData.latitude && userData.longitude;

        selectedLat = hasMarker ? parseFloat(userData.latitude) : null;
        selectedLng = hasMarker ? parseFloat(userData.longitude) : null;

        div.innerHTML = `
    <div style="font-family: -apple-system, system-ui, sans-serif; color: #111111; padding: 5px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; letter-spacing: -0.5px;">
            ${hasMarker ? 'Modifier mon marqueur' : 'Placer un marqueur'}
        </h3>
        
        <div id="mini-map" style="width: 100%; height: 200px; margin-bottom: 16px; border-radius: 8px; border: 1px solid #e5e7eb; cursor: crosshair;"></div>
        
        <div style="margin-bottom: 16px;">
            <button id="popup-gps-btn" type="button" style="width: 100%; padding: 10px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                Utiliser ma position GPS
            </button>
        </div>

        <textarea id="marker-desc" placeholder="Description (facultatif)" style="width: 100%; height: 80px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; font-family: inherit; box-sizing: border-box; resize: none; outline: none; transition: border-color 0.2s;">${hasMarker ? (userData.description || '') : ''}</textarea>
        
        <div class="popup-actions" style="margin-top: 20px; display: flex; justify-content: space-between; gap: 10px;">
            ${hasMarker ? '<button id="delete-marker-btn" style="padding: 12px 16px; background-color: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;">Supprimer</button>' : ''}
            <button id="save-marker-btn" style="flex-grow: 1; padding: 12px; background-color: #111111; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;">Enregistrer</button>
        </div>
    </div>
`;

        popupContentContainer.insertBefore(div, closeBtn);
        popup.classList.add('active');

        miniMap = L.map('mini-map').setView([selectedLat || 47, selectedLng || 7], hasMarker ? 12 : 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            minZoom: 1,
            maxZoom: 19,
            noWrap: true
        }).addTo(miniMap);

        if (hasMarker) {
            miniMapMarker = L.marker([selectedLat, selectedLng]).addTo(miniMap);
        }

        miniMap.on('click', (e) => {
            selectedLat = e.latlng.lat;
            selectedLng = e.latlng.lng;

            if (miniMapMarker) {
                miniMapMarker.setLatLng(e.latlng);
            } else {
                miniMapMarker = L.marker(e.latlng).addTo(miniMap);
            }
        });

        // GPS button
        document.getElementById('popup-gps-btn').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const originalText = btn.textContent;

            btn.style.width = `${btn.offsetWidth}px`;
            btn.textContent = '...';
            btn.disabled = true;

            navigator.geolocation.getCurrentPosition((position) => {
                selectedLat = position.coords.latitude;
                selectedLng = position.coords.longitude;

                miniMap.setView([selectedLat, selectedLng], 14);
                if (miniMapMarker) {
                    miniMapMarker.setLatLng([selectedLat, selectedLng]);
                } else {
                    miniMapMarker = L.marker([selectedLat, selectedLng]).addTo(miniMap);
                }

                btn.textContent = originalText;
                btn.style.width = '100%'; 
                btn.disabled = false;
            }, () => {
                alert("Impossible d'obtenir votre position GPS.");
                btn.textContent = originalText;
                btn.style.width = '100%'; 
                btn.disabled = false;
            });
        });

        // Save button
        document.getElementById('save-marker-btn').addEventListener('click', async () => {
            if (selectedLat === null || selectedLng === null) {
                alert("Veuillez sélectionner un emplacement sur la carte ou utiliser le GPS avant d'enregistrer.");
                return;
            }

            const desc = document.getElementById('marker-desc').value;

            try {
                const { error } = await supabaseClient
                    .from('User')
                    .upsert({
                        name: session.username,
                        latitude: selectedLat,
                        longitude: selectedLng,
                        description: desc
                    }, { onConflict: 'name' });

                if (error) throw error;
                location.reload();
            } catch (err) {
                console.error("Erreur d'enregistrement Supabase :", err);
                alert("Échec de l'enregistrement. Vérifiez la console et vos règles RLS.");
            }
        });

        // Delete button (if marker exists)
        if (hasMarker) {
            document.getElementById('delete-marker-btn').addEventListener('click', async () => {
                try {
                    const { error } = await supabaseClient
                        .from('User')
                        .update({ latitude: null, longitude: null, description: null })
                        .eq('name', session.username);

                    if (error) throw error;
                    location.reload();
                } catch (err) {
                    console.error("Erreur de suppression Supabase :", err);
                    alert("Échec de la suppression.");
                }
            });
        }

        setTimeout(() => {
            miniMap.invalidateSize();
        }, 200);
    });

    // Close button
    closeBtn.addEventListener('click', () => {
        popup.classList.remove('active');
        if (miniMap) {
            miniMap.remove();
            miniMap = null;
            miniMapMarker = null;
        }
    });

    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.classList.remove('active');
            if (miniMap) {
                miniMap.remove();
                miniMap = null;
                miniMapMarker = null;
            }
        }
    });
}