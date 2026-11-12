
/* ----------------------------------------------------
   APPLICATION STATE
---------------------------------------------------- */

// Background music is optional. The page must work without it.
const musicController = window.backgroundMusic || null;

const appState = {
    userName: '',
    selectedAvatar: null,
    audioEnabled:
        typeof musicController?.isEnabled === 'function'
            ? Boolean(musicController.isEnabled())
            : false
};

let spaceTransitionStarted = false;


/* ----------------------------------------------------
   WEB AUDIO API SYNTHESIZER FOR SFX
---------------------------------------------------- */

let audioCtx = null;

function getAudioContext() {
    try {
        if (!audioCtx) {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }

        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }

        return audioCtx;
    } catch (error) {
        return null;
    }
}

function playSound(type) {
    // Sound effects are optional and must never interrupt the UI.
    if (!appState.audioEnabled) return;

    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

            osc.start(now);
            osc.stop(now + 0.08);

        } else if (type === 'select') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.start(now);
            osc.stop(now + 0.15);
        }

    } catch (error) {
        // Audio failures must not affect application functionality.
    }
}


/* ----------------------------------------------------
   AUDIO CONTROLS
---------------------------------------------------- */

function toggleAudio() {
    const controller = window.backgroundMusic;

    try {
        if (controller && typeof controller.toggle === 'function') {
            const result = controller.toggle();

            appState.audioEnabled =
                typeof result === 'boolean'
                    ? result
                    : typeof controller.isEnabled === 'function'
                        ? Boolean(controller.isEnabled())
                        : !appState.audioEnabled;

        } else {
            appState.audioEnabled = !appState.audioEnabled;
        }

        if (appState.audioEnabled) {
            playSound('click');
        }

    } catch (error) {
        console.warn('Audio controller unavailable:', error);
        appState.audioEnabled = false;
    }
}


/* ----------------------------------------------------
   NAVIGATION & STATE MANAGEMENT
---------------------------------------------------- */

function showScreen(activeScreenId) {
    playSound('click');

    ['screen1', 'screen2'].forEach(screenId => {
        const screen = document.getElementById(screenId);

        if (!screen) return;

        const isActive = screenId === activeScreenId;

        screen.classList.toggle('screen-active', isActive);
        screen.classList.toggle('screen-hidden', !isActive);
        screen.setAttribute('aria-hidden', String(!isActive));
    });
}


/* ----------------------------------------------------
   AVATAR SELECTION BUTTON
---------------------------------------------------- */

function updateCharacterSelectionButton() {
    const btn = document.getElementById('btnContinueToInvitation');

    if (!btn) return;

    btn.disabled =
        !appState.selectedAvatar ||
        appState.userName.length < 2;

    btn.classList.toggle('glow-gold', !btn.disabled);
}


/* ----------------------------------------------------
   NAME VALIDATION
---------------------------------------------------- */

function validateNameInput() {
    const input = document.getElementById('userNameInput');

    if (!input) return;

    appState.userName = input.value.trim();

    input.setCustomValidity(
        appState.userName.length < 2
            ? 'Enter at least 2 characters.'
            : ''
    );

    updateCharacterSelectionButton();
}


function handleNameKeydown(event) {
    if (
        event.key === 'Enter' &&
        appState.selectedAvatar &&
        appState.userName.length >= 2
    ) {
        goToInvitation();
    }
}


/* ----------------------------------------------------
   AVATAR SELECTION
---------------------------------------------------- */

function selectAvatar(avatarId) {

    // Validate the requested avatar.
    if (avatarId !== 'leo' && avatarId !== 'maya') {
        console.error('Invalid avatar:', avatarId);
        return;
    }

    const cardLeo = document.getElementById('avatarCardLeo');
    const cardMaya = document.getElementById('avatarCardMaya');

    if (!cardLeo || !cardMaya) {
        console.error('Avatar cards not found.');
        return;
    }

    const badgeLeo = cardLeo.querySelector('.active-badge');
    const badgeMaya = cardMaya.querySelector('.active-badge');

    // Update application state first.
    appState.selectedAvatar = avatarId;

    const isLeo = avatarId === 'leo';
    const isMaya = avatarId === 'maya';

    // Update selection appearance.
    cardLeo.classList.toggle('explorer-selected', isLeo);
    cardMaya.classList.toggle('explorer-selected', isMaya);

    // Update selection badges.
    badgeLeo?.classList.toggle('hidden', !isLeo);
    badgeMaya?.classList.toggle('hidden', !isMaya);

    // Accessibility state.
    cardLeo.setAttribute('aria-pressed', String(isLeo));
    cardMaya.setAttribute('aria-pressed', String(isMaya));

    // Update Continue button.
    updateCharacterSelectionButton();

    // Play sound only after successful selection.
    playSound('select');
}


function handleAvatarKeydown(event, avatarId) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectAvatar(avatarId);
    }
}


/* ----------------------------------------------------
   INVITATION SCREEN
---------------------------------------------------- */

function goToInvitation() {
    validateNameInput();

    if (!appState.selectedAvatar || appState.userName.length < 2) {
        document.getElementById('userNameInput')?.reportValidity();
        return;
    }

    const visitorName = appState.userName;

    const invitationMessage =
        document.getElementById('invitationMessage');

    if (!invitationMessage) {
        console.error('Invitation message element not found.');
        return;
    }

    invitationMessage.textContent =
        `Hi, ${visitorName}! I'm Marry. I'm so excited you're here! ` +
        `I've been waiting to explore the Space Museum. There are so many ` +
        `amazing things to discover! But what's an adventure without a friend? ` +
        `Come on! Let's explore the wonders of space together?`;

    showScreen('screen2');
}


/* ----------------------------------------------------
   SPACE LIBRARY TRANSITION
---------------------------------------------------- */

function goToSpaceLibrary() {

    if (spaceTransitionStarted) return;

    spaceTransitionStarted = true;

    playSound('click');

    try {
        if (appState.userName) {
            sessionStorage.setItem(
                'museumVisitorName',
                appState.userName
            );
        } else {
            sessionStorage.removeItem('museumVisitorName');
        }

        if (appState.selectedAvatar) {
            sessionStorage.setItem(
                'museumSelectedAvatar',
                appState.selectedAvatar
            );
        } else {
            sessionStorage.removeItem('museumSelectedAvatar');
        }

    } catch (error) {
        console.warn('Session storage unavailable:', error);
    }

    const transition =
        document.getElementById('space-entry-transition');

    if (!transition) {
        window.location.href = './Space/space.html';
        return;
    }

    const sparkles =
        transition.querySelector('.space-entry-sparkles');

    if (sparkles) {
        const fragment = document.createDocumentFragment();

        for (let index = 0; index < 36; index++) {
            const sparkle = document.createElement('span');

            const angle = Math.random() * Math.PI * 2;
            const distance = 28 + Math.random() * 62;

            sparkle.className = 'space-entry-sparkle';

            sparkle.style.setProperty(
                '--sparkle-x',
                `${Math.cos(angle) * distance}vw`
            );

            sparkle.style.setProperty(
                '--sparkle-y',
                `${Math.sin(angle) * distance}vh`
            );

            sparkle.style.setProperty(
                '--sparkle-delay',
                `${Math.random() * 220}ms`
            );

            sparkle.style.setProperty(
                '--sparkle-size',
                `${2 + Math.random() * 4}px`
            );

            fragment.appendChild(sparkle);
        }

        sparkles.replaceChildren(fragment);
    }

    transition.hidden = false;

    requestAnimationFrame(() => {
        transition.classList.add('is-active');
    });

    const reducedMotion =
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setTimeout(() => {
        window.location.href = './Space/space.html';
    }, reducedMotion ? 700 : 2100);
}


/* ----------------------------------------------------
   CANVAS STARFIELD BACKGROUND
---------------------------------------------------- */

const canvas = document.getElementById('spaceCanvas');
const ctx = canvas?.getContext('2d');

let width = 0;
let height = 0;

let stars = [];

const numStars = 180;

function resizeCanvas() {
    if (!canvas || !ctx) return;

    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    initStars();
}


function initStars() {
    stars = [];

    if (!width || !height) return;

    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: (Math.random() - 0.5) * width * 2,
            y: (Math.random() - 0.5) * height * 2,
            z: Math.random() * width,
            size: Math.random() * 2 + 0.5,

            color:
                Math.random() > 0.3
                    ? '#FFFDF0'
                    : Math.random() > 0.5
                        ? '#FFD700'
                        : '#4FD1C5',

            alpha: Math.random() * 0.8 + 0.2
        });
    }
}


/* ----------------------------------------------------
   STARFIELD ANIMATION
---------------------------------------------------- */

function animateSpace() {
    if (!ctx || !width || !height) return;

    // Dark navy background.
    ctx.fillStyle = '#070B19';
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient nebulae.
    const time = Date.now() * 0.0005;

    const grad1 = ctx.createRadialGradient(
        width * 0.3 + Math.sin(time) * 50,
        height * 0.4 + Math.cos(time) * 50,
        50,
        width * 0.3,
        height * 0.4,
        width * 0.6
    );

    grad1.addColorStop(0, 'rgba(20, 32, 66, 0.4)');
    grad1.addColorStop(0.5, 'rgba(12, 20, 42, 0.2)');
    grad1.addColorStop(1, 'rgba(7, 11, 25, 0)');

    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    const speed = 0.8;

    for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        s.z -= speed;

        if (s.z <= 0) {
            s.z = width;
            s.x = (Math.random() - 0.5) * width * 2;
            s.y = (Math.random() - 0.5) * height * 2;
        }

        const k = 256 / s.z;

        const px = s.x * k + cx;
        const py = s.y * k + cy;

        if (
            px >= 0 &&
            px <= width &&
            py >= 0 &&
            py <= height
        ) {
            const size = Math.max(
                0.1,
                (1 - s.z / width) * s.size
            );

            ctx.beginPath();
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.alpha;

            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
        }
    }

    requestAnimationFrame(animateSpace);
}


/* ----------------------------------------------------
   INITIALIZATION
---------------------------------------------------- */

function initializeApplication() {

    // Set initial canvas dimensions.
    resizeCanvas();

    // Start the starfield.
    if (ctx) {
        animateSpace();
    }

    // Initialize avatar accessibility states.
    const cardLeo = document.getElementById('avatarCardLeo');
    const cardMaya = document.getElementById('avatarCardMaya');

    cardLeo?.setAttribute('aria-pressed', 'false');
    cardMaya?.setAttribute('aria-pressed', 'false');

    // Initialize Continue button.
    updateCharacterSelectionButton();

    console.log('Museum application initialized successfully.');
}


// Handle both deferred and non-deferred script loading.
if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initializeApplication,
        { once: true }
    );
} else {
    initializeApplication();
}


// Responsive starfield.
window.addEventListener('resize', resizeCanvas);
