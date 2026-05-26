document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const errorDiv = document.getElementById('error');
    const submitBtn = document.getElementById('submitBtn');
    const username = document.getElementById('username').value;
    
    errorDiv.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerText = "Connexion...";

    const payload = new URLSearchParams(new FormData(this));

    try {
        const response = await fetch('login_proxy.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: payload
        });

        const resultText = await response.text();

        if (response.ok && !resultText.includes("Incorrect user name")) {
            const sessionData = {
                username: username,
                loginTime: new Date().getTime(),
                isLoggedIn: true
            };
            localStorage.setItem('off_user_session', JSON.stringify(sessionData));

            window.location.href = 'index.html';
        } else {
            errorDiv.innerText = "Nom d'utilisateur ou mot de passe incorrect.";
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.innerText = "Erreur de connexion au serveur.";
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Se connecter";
    }
});