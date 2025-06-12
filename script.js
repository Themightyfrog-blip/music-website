// Theme Toggle Functionality
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        const themeText = document.getElementById('themeText');
        const body = document.body;

        let isDarkMode = false;

        themeToggle.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            
            if (isDarkMode) {
                body.setAttribute('data-theme', 'dark');
                themeIcon.textContent = '☀️';
                themeText.textContent = 'Light';
            } else {
                body.setAttribute('data-theme', 'light');
                themeIcon.textContent = '🌙';
                themeText.textContent = 'Dark';
            }
        });

        // Scroll Progress Indicator
        window.addEventListener('scroll', () => {
            const scrollProgress = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            document.querySelector('.scroll-indicator').style.width = scrollProgress + '%';
        });

        // Intersection Observer for Animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.content-section').forEach(section => {
            observer.observe(section);
        });

        // ...existing code...

// Spotify API Integration
const CLIENT_ID = '9534dae236294bddae45ca7fe0f6bff8';
const REDIRECT_URI = 'https://music-website-theta-beryl.vercel.app/';
const SCOPES = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const CLIENT_SECRET = '90e33f8938ff42b7a842943edc02f815'; // Get this from Spotify Dashboard

let accessToken = null;
let currentTrack = null;

// Initial Spotify Connect
document.getElementById('connectSpotify').addEventListener('click', () => {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        show_dialog: true
    });
    
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
});

// Token Exchange Function
async function getAccessToken(code) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

// Handle Authorization Response
window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        try {
            const data = await getAccessToken(code);
            accessToken = data.access_token;
            // Remove the code from URL
            window.history.replaceState({}, document.title, '/');
            console.log('Successfully authenticated with Spotify!');
        } catch (error) {
            console.error('Error exchanging code for token:', error);
        }
    }
});

        // Extract access token from URL (after Spotify redirect)
        function getAccessTokenFromUrl() {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            return params.get('access_token');
        }

        // Initialize Spotify connection
        function initializeSpotify() {
            accessToken = getAccessTokenFromUrl();
            if (accessToken) {
                // Clear the hash from URL
                window.location.hash = '';
                
                // Show player
                document.getElementById('playerContainer').classList.add('active');
                
                // Start fetching current track
                getCurrentTrack();
                setInterval(getCurrentTrack, 5000); // Update every 5 seconds
            }
        }

        // Fetch current playing track
        async function getCurrentTrack() {
            if (!accessToken) return;

            try {
                const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.item) {
                        updatePlayerUI(data);
                    }
                }
            } catch (error) {
                console.error('Error fetching current track:', error);
            }
        }

        // Update player UI
        function updatePlayerUI(trackData) {
            const trackTitle = document.getElementById('trackTitle');
            const trackArtist = document.getElementById('trackArtist');
            const playBtn = document.getElementById('playBtn');

            trackTitle.textContent = trackData.item.name;
            trackArtist.textContent = trackData.item.artists.map(artist => artist.name).join(', ');
            
            // Update play/pause button
            playBtn.textContent = trackData.is_playing ? '⏸' : '▶';
        }

        // Player Controls
        document.getElementById('playBtn').addEventListener('click', async () => {
            if (!accessToken) return;

            try {
                const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    const endpoint = data && data.is_playing ? 'pause' : 'play';
                    
                    await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    
                    // Immediately update UI
                    setTimeout(getCurrentTrack, 100);
                }
            } catch (error) {
                console.error('Error controlling playback:', error);
            }
        });

        document.getElementById('nextBtn').addEventListener('click', async () => {
            if (!accessToken) return;

            try {
                await fetch('https://api.spotify.com/v1/me/player/next', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                
                setTimeout(getCurrentTrack, 1000);
            } catch (error) {
                console.error('Error skipping track:', error);
            }
        });

        document.getElementById('prevBtn').addEventListener('click', async () => {
            if (!accessToken) return;

            try {
                await fetch('https://api.spotify.com/v1/me/player/previous', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                
                setTimeout(getCurrentTrack, 1000);
            } catch (error) {
                console.error('Error going to previous track:', error);
            }
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length > 2) {
                searchTimeout = setTimeout(() => searchTracks(query), 300);
            }
        });

        async function searchTracks(query) {
            if (!accessToken) {
                console.log('Please connect to Spotify first');
                return;
            }

            try {
                const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    displaySearchResults(data.tracks.items);
                }
            } catch (error) {
                console.error('Error searching tracks:', error);
            }
        }

        function displaySearchResults(tracks) {
            const musicCards = document.getElementById('musicCards');
            musicCards.innerHTML = '';

            tracks.forEach(track => {
                const card = document.createElement('div');
                card.className = 'card glass';
                card.innerHTML = `
                    <div class="card-content">
                        <img src="${track.album.images[0]?.url}" alt="${track.name}" style="width: 100%; border-radius: 8px;">
                        <h3 class="card-title">${track.name}</h3>
                        <p class="card-description">${track.artists[0].name}</p>
                        <div class="player-controls">
                            <button class="play-track-btn" data-uri="${track.uri}" data-state="play">Play</button>
                            <button class="pause-track-btn" data-uri="${track.uri}" data-state="pause">Pause</button>
                        </div>
                    </div>
                `;
                musicCards.appendChild(card);

                // Add click handlers for both buttons
                const playBtn = card.querySelector('.play-track-btn');
                const pauseBtn = card.querySelector('.pause-track-btn');
                
                playBtn.addEventListener('click', () => {
                    playTrack(track.uri);
                    card.classList.add('playing');
                });
                
                pauseBtn.addEventListener('click', () => {
                    pauseTrack(track.uri);
                    card.classList.remove('playing');
                });
            });
        }

        async function playTrack(trackUri) {
            if (!accessToken) return;

            try {
                await fetch('https://api.spotify.com/v1/me/player/play', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        uris: [trackUri]
                    })
                });
                
                setTimeout(getCurrentTrack, 1000);
            } catch (error) {
                console.error('Error playing track:', error);
            }
        }

        // Add this pause function
        async function pauseTrack(uri) {
            if (!accessToken) return;

            try {
                await fetch('https://api.spotify.com/v1/me/player/pause', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                // Update UI after pausing
                setTimeout(getCurrentTrack, 100);
            } catch (error) {
                console.error('Error pausing track:', error);
                alert('Please make sure Spotify is open and active on your device');
            }
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Card hover effects with sound visualization
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                // Subtle hover effect without animation conflicts
                card.style.transition = 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transition = 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)';
            });
        });

        // Initialize app
        document.addEventListener('DOMContentLoaded', () => {
            initializeSpotify();
            
            // Add entrance animations
            setTimeout(() => {
                document.querySelector('.hero').style.opacity = '1';
                document.querySelector('.hero').style.transform = 'translateY(0)';
            }, 500);
        });

        // Add floating particles effect - simplified
        function createParticle() {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 2px;
                height: 2px;
                background: var(--primary-magenta);
                border-radius: 50%;
                pointer-events: none;
                z-index: -1;
                opacity: 0.4;
                animation: gentleFloat 8s linear infinite;
            `;
            
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.animationDelay = Math.random() * 8 + 's';
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 8000);
        }

        // Add CSS for particle animation
        const particleStyle = document.createElement('style');
        particleStyle.textContent = `
            @keyframes gentleFloat {
                0% {
                    transform: translateY(100vh) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 0.4;
                }
                90% {
                    opacity: 0.4;
                }
                100% {
                    transform: translateY(-10px) rotate(180deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(particleStyle);

        // Create particles less frequently
        setInterval(createParticle, 4000);

        // Enhanced button interactions
        document.querySelectorAll('button, .card, .nav-link').forEach(element => {
            element.addEventListener('mousedown', (e) => {
                const ripple = document.createElement('span');
                const rect = element.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(233, 30, 99, 0.3);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                `;
                
                element.style.position = 'relative';
                element.style.overflow = 'hidden';
                element.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });

        // Add ripple animation CSS
        const rippleStyle = document.createElement('style');
        rippleStyle.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(rippleStyle);

        // Enhanced search with loading state
        let isSearching = false;

        async function searchTracks(query) {
            if (!accessToken) {
                updateSearchResults('Please connect to Spotify first to search for music');
                return;
            }

            if (isSearching) return;
            isSearching = true;

            // Show loading state
            updateSearchResults('<div class="loading"></div> Searching...');

            try {
                const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album&limit=12`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    displaySearchResults(data);
                } else {
                    updateSearchResults('Search failed. Please try again.');
                }
            } catch (error) {
                console.error('Error searching:', error);
                updateSearchResults('Search error. Please check your connection.');
            } finally {
                isSearching = false;
            }
        }

        function updateSearchResults(message) {
            const musicCards = document.getElementById('musicCards');
            if (typeof message === 'string') {
                musicCards.innerHTML = `<div class="card glass"><div class="card-content"><p>${message}</p></div></div>`;
            }
        }

        function displaySearchResults(data) {
            const musicCards = document.getElementById('musicCards');
            musicCards.innerHTML = '';

            // Combine and display results
            const allResults = [];
            
            if (data.tracks?.items) {
                data.tracks.items.forEach(track => {
                    allResults.push({
                        type: 'track',
                        id: track.id,
                        name: track.name,
                        artist: track.artists.map(a => a.name).join(', '),
                        album: track.album.name,
                        uri: track.uri,
                        image: track.album.images[0]?.url
                    });
                });
            }

            if (data.artists?.items) {
                data.artists.items.slice(0, 3).forEach(artist => {
                    allResults.push({
                        type: 'artist',
                        id: artist.id,
                        name: artist.name,
                        followers: artist.followers.total,
                        genres: artist.genres.slice(0, 2).join(', '),
                        image: artist.images[0]?.url
                    });
                });
            }

            allResults.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card glass';
                
                if (item.type === 'track') {
                    card.innerHTML = `
                        <div class="card-content">
                            <h3 class="card-title">🎵 ${item.name}</h3>
                            <p class="card-description">
                                <strong>Artist:</strong> ${item.artist}<br>
                                <strong>Album:</strong> ${item.album}
                            </p>
                        </div>
                    `;
                    card.addEventListener('click', () => playTrack(item.uri));
                } else if (item.type === 'artist') {
                    card.innerHTML = `
                        <div class="card-content">
                            <h3 class="card-title">🎤 ${item.name}</h3>
                            <p class="card-description">
                                <strong>Followers:</strong> ${item.followers.toLocaleString()}<br>
                                <strong>Genres:</strong> ${item.genres || 'Various'}
                            </p>
                        </div>
                    `;
                }
                
                musicCards.appendChild(card);
            });

            if (allResults.length === 0) {
                updateSearchResults('No results found. Try a different search term.');
            }
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!accessToken) return;
            
            // Space bar to play/pause
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                document.getElementById('playBtn').click();
            }
            
            // Arrow keys for next/previous
            if (e.code === 'ArrowRight' && e.ctrlKey) {
                e.preventDefault();
                document.getElementById('nextBtn').click();
            }
            
            if (e.code === 'ArrowLeft' && e.ctrlKey) {
                e.preventDefault();
                document.getElementById('prevBtn').click();
            }
            
            // Focus search with Ctrl+K
            if (e.code === 'KeyK' && e.ctrlKey) {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
        });

        // Add visual feedback for keyboard shortcuts
        const shortcutHints = document.createElement('div');
        shortcutHints.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-glass);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 1rem;
            font-size: 0.8rem;
            color: var(--text-secondary);
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 1000;
        `;
        shortcutHints.innerHTML = `
            <div><strong>Keyboard Shortcuts:</strong></div>
            <div>Space - Play/Pause</div>
            <div>Ctrl + → - Next Track</div>
            <div>Ctrl + ← - Previous Track</div>
            <div>Ctrl + K - Search</div>
        `;
        document.body.appendChild(shortcutHints);

        // Show shortcuts on first visit
        setTimeout(() => {
            shortcutHints.style.opacity = '1';
            setTimeout(() => {
                shortcutHints.style.opacity = '0';
            }, 5000);
        }, 3000);

        console.log('🎵 SoundWave Music Streaming App Loaded');
        console.log('🔗 To use Spotify features, you need to:');
        console.log('1. Create a Spotify app at https://developer.spotify.com/');
        console.log('2. Replace CLIENT_ID in the code with your app\'s Client ID');
        console.log('3. Add your domain to the Redirect URIs in Spotify app settings');

        // Add these functions after your existing Spotify authentication code

        // Search functionality
        async function searchTracks(query) {
            if (!accessToken) return;

            try {
                const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                const data = await response.json();
                displaySearchResults(data.tracks.items);
            } catch (error) {
                console.error('Error searching tracks:', error);
            }
        }

        // Display search results
        function displaySearchResults(tracks) {
            const musicCards = document.getElementById('musicCards');
            musicCards.innerHTML = ''; // Clear existing content

            tracks.forEach(track => {
                const card = document.createElement('div');
                card.className = 'card glass';
                card.innerHTML = `
                    <div class="card-content">
                        <img src="${track.album.images[0]?.url}" alt="${track.name}" style="width: 100%; border-radius: 8px;">
                        <h3 class="card-title">${track.name}</h3>
                        <p class="card-description">${track.artists[0].name}</p>
                        <div class="player-controls">
                            <button class="play-track-btn" data-uri="${track.uri}" data-state="play">Play</button>
                            <button class="pause-track-btn" data-uri="${track.uri}" data-state="pause">Pause</button>
                        </div>
                    </div>
                `;
                musicCards.appendChild(card);

                // Add click handlers for both buttons
                const playBtn = card.querySelector('.play-track-btn');
                const pauseBtn = card.querySelector('.pause-track-btn');
                
                playBtn.addEventListener('click', () => {
                    playTrack(track.uri);
                    card.classList.add('playing');
                });
                
                pauseBtn.addEventListener('click', () => {
                    pauseTrack(track.uri);
                    card.classList.remove('playing');
                });
            });
        }

        // Play track function
        async function playTrack(uri) {
            if (!accessToken) return;

            try {
                // First get available devices
                const devicesResponse = await fetch('https://api.spotify.com/v1/me/player/devices', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                const devices = await devicesResponse.json();
                
                if (devices.devices.length === 0) {
                    alert('No active Spotify devices found. Please open Spotify on any device.');
                    return;
                }

                // Play the track
                await fetch('https://api.spotify.com/v1/me/player/play', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        uris: [uri]
                    })
                });

                // Update UI after successful playback
                getCurrentTrack();
            } catch (error) {
                console.error('Error playing track:', error);
                alert('Please make sure Spotify is open and active on your device');
            }
        }

        // Add search input event listener
        document.getElementById('searchInput').addEventListener('input', debounce((e) => {
            if (e.target.value) {
                searchTracks(e.target.value);
            }
        }, 500));

        // Debounce helper function
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }