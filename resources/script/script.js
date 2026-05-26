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

const example_marker = L.marker([43.2965,  5.3698]).addTo(map);

example_marker.bindPopup("<b>Nom du contributeur</b><br>Description du contributeur.");