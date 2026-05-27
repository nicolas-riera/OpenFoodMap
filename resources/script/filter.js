let allMarkersData = [];

document.addEventListener('usersLoaded', ({ detail: { markers } }) => {
    allMarkersData = markers;

    const list = document.getElementById('filter-countries');
    const countries = [...new Set(markers.map(({ user }) => user.country).filter(Boolean))].sort();
    countries.forEach(country => {
        list.insertAdjacentHTML('beforeend',
            `<li><input type="checkbox" name="${country}" checked> ${country}</li>`
        );
    });

    document.querySelector('.filters').addEventListener('change', applyFilters);
});

function applyFilters() {
    const checked = [...document.querySelectorAll('#filter-countries input:checked')].map(i => i.name);
    allMarkersData.forEach(({ marker, user }) => {
        const visible = !user.country || checked.includes(user.country);
        visible ? marker.addTo(map) : marker.remove();
    });
}
