/**
 * ELLI-PSE - Application JavaScript principale
 * Version: 2.0.0 - Système 100% autonome
 * 
 * CONFIGURATION : Modifiez uniquement /data/episodes.json
 * Plus besoin de toucher au code source !
 * 
 * Structure du fichier :
 * 1. Configuration
 * 2. État de l'application
 * 3. Utilitaires
 * 4. Chargement des données
 * 5. Navigation
 * 6. Compte à rebours
 * 7. Page des épisodes
 * 8. Système de progression
 * 9. Système d'énigmes (dynamique)
 * 10. Affichage des fichiers bonus
 * 11. Modal d'accès
 * 12. Initialisation
 */

'use strict';

/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

/**
 * Code d'accès principal au site
 */
const ACCESS_CODE = 'ELLI-PSE1520';

/**
 * Nombre total de lettres à découvrir pour le mot final
 */
const TOTAL_LETTERS = 8;

/**
 * Date de sortie du premier épisode (pour le compte à rebours)
 */
const PREMIERE_DATE = new Date('2026-01-25T15:20:00');

/**
 * Intervalle entre les épisodes (en jours)
 */
const EPISODE_INTERVAL_DAYS = 7;

/* ==========================================================================
   2. ÉTAT DE L'APPLICATION
   ========================================================================== */

/**
 * État global de l'application
 */
const AppState = {
    selectedEpisode: null,
    unlockedEpisodes: [],
    episodesData: null, // Données chargées depuis episodes.json
    countdownInterval: null,
    
    /**
     * Charge les épisodes déverrouillés depuis le localStorage
     */
    loadUnlockedEpisodes() {
        try {
            const saved = localStorage.getItem('ellipse_unlocked');
            this.unlockedEpisodes = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Erreur lors du chargement des données sauvegardées:', e);
            this.unlockedEpisodes = [];
        }
    },
    
    /**
     * Sauvegarde les épisodes déverrouillés dans le localStorage
     */
    saveUnlockedEpisodes() {
        try {
            localStorage.setItem('ellipse_unlocked', JSON.stringify(this.unlockedEpisodes));
        } catch (e) {
            console.warn('Erreur lors de la sauvegarde des données:', e);
        }
    },
    
    /**
     * Ajoute un épisode à la liste des déverrouillés
     */
    addUnlockedEpisode(episodeId) {
        if (!this.unlockedEpisodes.includes(episodeId)) {
            this.unlockedEpisodes.push(episodeId);
            this.saveUnlockedEpisodes();
            return true;
        }
        return false;
    }
};

/* ==========================================================================
   3. UTILITAIRES
   ========================================================================== */

/**
 * Raccourci pour document.getElementById
 */
function $(id) {
    return document.getElementById(id);
}

/**
 * Raccourci pour document.querySelectorAll
 */
function $$(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Échappe les caractères HTML pour prévenir les injections XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Obtient l'extension d'un fichier
 */
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

/**
 * Détermine le type MIME audio
 */
function getAudioMimeType(ext) {
    const mimeTypes = {
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'm4a': 'audio/mp4'
    };
    return mimeTypes[ext] || 'audio/mpeg';
}

/* ==========================================================================
   4. CHARGEMENT DES DONNÉES
   ========================================================================== */

/**
 * Charge les données des épisodes depuis le fichier JSON
 */
async function loadEpisodesData() {
    try {
        const response = await fetch('/data/episodes.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        AppState.episodesData = data.episodes;
        console.log('Données des épisodes chargées avec succès');
        return data.episodes;
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // Fallback : retourner un tableau vide
        AppState.episodesData = [];
        return [];
    }
}

/**
 * Récupère les données d'un épisode spécifique
 */
function getEpisodeData(episodeId) {
    if (!AppState.episodesData) return null;
    return AppState.episodesData.find(ep => ep.id === episodeId);
}

/**
 * Calcule la date de sortie d'un épisode
 */
function getEpisodeReleaseDate(episodeId) {
    const firstDate = new Date(PREMIERE_DATE);
    const daysToAdd = (episodeId - 1) * EPISODE_INTERVAL_DAYS;
    firstDate.setDate(firstDate.getDate() + daysToAdd);
    return firstDate;
}

/* ==========================================================================
   5. EFFETS VISUELS
   ========================================================================== */

/**
 * Affiche l'effet de distorsion visuelle
 */
function showDistortionEffect() {
    const distortion = $('distortion');
    if (distortion) {
        distortion.style.display = 'block';
        setTimeout(() => {
            distortion.style.display = 'none';
        }, 500);
    }
}

/* ==========================================================================
   6. NAVIGATION
   ========================================================================== */

/**
 * Affiche une page spécifique et masque les autres
 */
function showPage(pageId) {
    const homePage = $('homePage');
    const mainMenu = $('mainMenu');
    const contentPages = $$('.content-page');
    
    // Masquer toutes les pages
    if (homePage) homePage.style.display = 'none';
    if (mainMenu) mainMenu.style.display = 'none';
    contentPages.forEach(page => {
        page.style.display = 'none';
    });
    
    // Afficher la page demandée
    const pageMap = {
        'home': () => { if (homePage) homePage.style.display = 'flex'; },
        'menu': () => { if (mainMenu) mainMenu.style.display = 'block'; },
        'faq': () => { const p = $('faqPage'); if (p) p.style.display = 'block'; },
        'apropos': () => { const p = $('aproposPage'); if (p) p.style.display = 'block'; },
        'enigmes': () => { const p = $('enigmesPage'); if (p) p.style.display = 'block'; },
        'episodes': () => { const p = $('episodesPage'); if (p) p.style.display = 'block'; },
        'informations': () => { const p = $('informationsPage'); if (p) p.style.display = 'block'; },
        'credits': () => { const p = $('creditsPage'); if (p) p.style.display = 'block'; },
        'contact': () => { const p = $('contactPage'); if (p) p.style.display = 'block'; }
    };
    
    if (pageMap[pageId]) {
        pageMap[pageId]();
    }
    
    showDistortionEffect();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Initialise la navigation entre les pages
 */
function initializeNavigation() {
    // Gestion des clics sur les éléments du menu
    $$('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            if (target) showPage(target);
        });
        
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const target = this.getAttribute('data-target');
                if (target) showPage(target);
            }
        });
    });
    
    // Boutons retour au menu
    $$('.back-to-menu').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            showPage('menu');
        });
    });
    
    // Bouton retour à l'accueil
    const homeBtn = $('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showPage('home');
        });
    }
    
    // Liens du footer (Informations, Crédits, Contact)
    $$('.footer-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            if (target) showPage(target);
        });
    });
}

/* ==========================================================================
   7. COMPTE À REBOURS
   ========================================================================== */

/**
 * Initialise et démarre le compte à rebours
 */
function initializeCountdown() {
    const targetDate = PREMIERE_DATE.getTime();
    
    function updateCountdown() {
        const now = Date.now();
        const distance = targetDate - now;
        
        const daysEl = $('days');
        const hoursEl = $('hours');
        const minutesEl = $('minutes');
        const secondsEl = $('seconds');
        const countdownContainer = document.querySelector('.countdown');
        
        if (distance > 0) {
            // Compte à rebours actif
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            if (daysEl) daysEl.textContent = String(days).padStart(3, '0');
            if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
            if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
            if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
        } else {
            // Compte à rebours terminé - afficher le message mystérieux
            if (countdownContainer && !countdownContainer.classList.contains('countdown-finished')) {
                countdownContainer.classList.add('countdown-finished');
                countdownContainer.innerHTML = `
                    <div class="countdown-message">
                        <div class="countdown-message-icon"><i class="fas fa-signal"></i></div>
                        <div class="countdown-message-text">Le signal est actif.</div>
                        <div class="countdown-message-subtext">Débloque l'expérience.</div>
                    </div>
                `;
                // Arrêter l'intervalle car le compte à rebours est terminé
                if (AppState.countdownInterval) {
                    clearInterval(AppState.countdownInterval);
                    AppState.countdownInterval = null;
                }
            }
        }
    }
    
    updateCountdown();
    AppState.countdownInterval = setInterval(updateCountdown, 1000);
}

/* ==========================================================================
   8. PAGE DES ÉPISODES
   ========================================================================== */

/**
 * Formate une date en français
 */
function formatDateFr(date) {
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Initialise la page des épisodes
 */
function initializeEpisodesPage() {
    const episodesGrid = $('episodesGrid');
    if (!episodesGrid) return;
    
    episodesGrid.innerHTML = '';
    
    for (let i = 1; i <= 10; i++) {
        const releaseDate = getEpisodeReleaseDate(i);
        const now = new Date();
        const isAvailable = now >= releaseDate;
        const epData = getEpisodeData(i);
        
        const episodeCard = document.createElement('div');
        episodeCard.className = `episode-card ${isAvailable ? 'available' : 'locked'}`;
        
        let countdownHtml = '';
        if (!isAvailable) {
            const timeLeft = releaseDate - now;
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            countdownHtml = `<div class="episode-countdown">Disponible dans ${days}j ${hours}h</div>`;
        }
        
        const disabledAttr = !isAvailable ? 'disabled aria-disabled="true"' : '';
        const disabledClass = !isAvailable ? 'disabled' : '';
        const linkHandler = !isAvailable ? 'onclick="return false;" tabindex="-1"' : '';
        
        // URL YouTube (placeholder - à remplacer)
        const youtubeUrl = `https://www.youtube.com/watch?v=VOTRE_VIDEO_${i}`;
        
        episodeCard.innerHTML = `
            <div class="episode-header">
                <div class="episode-number">EP ${i}</div>
                <div class="episode-status ${isAvailable ? 'available' : 'locked'}">
                    ${isAvailable ? 'DISPONIBLE' : 'VERROUILLÉ'}
                </div>
            </div>
            <div class="episode-release-date">
                <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                <time datetime="${releaseDate.toISOString()}">${formatDateFr(releaseDate)}</time>
            </div>
            ${countdownHtml}
            <div class="episode-actions">
                <a href="${youtubeUrl}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="episode-btn play-btn ${disabledClass}" 
                   ${linkHandler}
                   aria-label="Regarder l'épisode ${i}">
                    <i class="fas fa-play" aria-hidden="true"></i> REGARDER
                </a>
                <button class="episode-btn solve-btn ${disabledClass}" 
                        ${disabledAttr}
                        data-episode="${i}"
                        aria-label="Résoudre l'énigme de l'épisode ${i}">
                    <i class="fas fa-puzzle-piece" aria-hidden="true"></i> RÉSOUDRE
                </button>
            </div>
        `;
        
        episodesGrid.appendChild(episodeCard);
    }
    
    // Événements pour les boutons "Résoudre"
    episodesGrid.querySelectorAll('.solve-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.disabled) {
                showPage('enigmes');
            }
        });
    });
}

/**
 * Met à jour les boutons de résolution d'énigmes
 */
function updateResolveButtons() {
    const episodesList = $('episodesList');
    if (!episodesList) return;
    
    for (let i = 1; i <= 10; i++) {
        const btn = $(`resolveBtn-${i}`);
        if (!btn) continue;
        
        const isUnlocked = AppState.unlockedEpisodes.includes(i);
        
        btn.classList.remove('locked', 'unlocked');
        
        if (isUnlocked) {
            btn.classList.add('unlocked');
            btn.innerHTML = '<i class="fas fa-check-circle" aria-hidden="true"></i> Énigme résolue';
            btn.setAttribute('aria-label', `Énigme de l'épisode ${i} résolue`);
        } else {
            btn.classList.add('locked');
            btn.innerHTML = '<i class="fas fa-lock" aria-hidden="true"></i> Résoudre l\'énigme';
            btn.setAttribute('aria-label', `Résoudre l'énigme de l'épisode ${i}`);
        }
    }
}

/**
 * Initialise les événements des boutons de résolution
 */
function initializeResolveButtons() {
    const episodesList = $('episodesList');
    if (!episodesList) return;
    
    for (let i = 1; i <= 10; i++) {
        const btn = $(`resolveBtn-${i}`);
        if (!btn) continue;
        
        btn.addEventListener('click', function() {
            showPage('enigmes');
            setTimeout(() => {
                const folder = document.querySelector(`.enigme-folder[data-episode="${i}"]`);
                if (folder) {
                    folder.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    folder.style.transform = 'scale(1.05)';
                    folder.style.boxShadow = 'var(--glow-cyan), var(--glow-yellow), var(--card-shadow)';
                    setTimeout(() => {
                        folder.style.transform = '';
                        folder.style.boxShadow = '';
                    }, 1000);
                }
            }, 500);
        });
    }
}

/* ==========================================================================
   9. SYSTÈME DE PROGRESSION
   ========================================================================== */

/**
 * Met à jour l'affichage de la progression
 */
function updateProgress() {
    const progressFill = $('progressFill');
    const progressText = $('progressText');
    const lettersDiscovered = $('lettersDiscovered');
    const finalWord = $('finalWord');
    
    if (!progressFill || !progressText || !lettersDiscovered) return;
    
    // Compter les lettres découvertes (épisodes 1-8 ont des lettres)
    let lettersCount = 0;
    
    if (AppState.episodesData) {
        AppState.unlockedEpisodes.forEach(epId => {
            const epData = getEpisodeData(epId);
            if (epData && epData.letter) {
                lettersCount++;
            }
        });
    } else {
        // Fallback si les données ne sont pas chargées
        lettersCount = AppState.unlockedEpisodes.filter(ep => ep >= 1 && ep <= 8).length;
    }
    
    const progressPercentage = (lettersCount / TOTAL_LETTERS) * 100;
    
    progressFill.style.width = `${progressPercentage}%`;
    progressText.textContent = `${lettersCount}/${TOTAL_LETTERS} lettres découvertes`;
    
    // Mettre à jour les lettres découvertes
    const letterSlots = lettersDiscovered.querySelectorAll('.letter-slot');
    
    if (AppState.episodesData) {
        AppState.unlockedEpisodes.forEach(epId => {
            const epData = getEpisodeData(epId);
            if (epData && epData.letter && epData.letterPosition) {
                const slot = letterSlots[epData.letterPosition - 1];
                if (slot) {
                    slot.textContent = epData.letter;
                    slot.classList.add('revealed');
                    slot.setAttribute('aria-label', `Lettre ${epData.letterPosition}: ${epData.letter}`);
                }
            }
        });
    }
    
    // Afficher le mot final si toutes les lettres sont découvertes
    if (lettersCount >= TOTAL_LETTERS && finalWord) {
        finalWord.style.display = 'block';
    }
    
    // Mettre à jour l'apparence des dossiers déjà déverrouillés
    AppState.unlockedEpisodes.forEach(ep => {
        const folder = document.querySelector(`.enigme-folder[data-episode="${ep}"]`);
        if (folder) {
            folder.classList.add('unlocked');
            const status = folder.querySelector('.folder-status');
            if (status) {
                status.textContent = 'DÉVERROUILLÉ';
            }
        }
    });
}

/* ==========================================================================
   10. SYSTÈME D'ÉNIGMES (DYNAMIQUE)
   ========================================================================== */

/**
 * Affiche la section d'authentification pour une énigme
 */
function showEnigmeAuth(episode) {
    const authSection = $('enigmeAuthSection');
    const selectedText = $('selectedEpisodeText');
    const bonusContainer = $('bonusFilesContainer');
    
    // Masquer le contenu bonus précédent
    if (bonusContainer) {
        bonusContainer.innerHTML = '';
        bonusContainer.style.display = 'none';
    }
    
    if (authSection) {
        authSection.style.display = 'block';
    }
    if (selectedText) {
        selectedText.textContent = `Saisissez le mot de passe pour accéder aux indices de l'épisode ${episode}.`;
    }
    
    setTimeout(() => {
        const passwordInput = $('enigmePasswordInput');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }, 100);
}

/**
 * Masque la section d'authentification
 */
function hideEnigmeAuth() {
    const authSection = $('enigmeAuthSection');
    const passwordInput = $('enigmePasswordInput');
    
    if (authSection) {
        authSection.style.display = 'none';
    }
    if (passwordInput) {
        passwordInput.value = '';
    }
    AppState.selectedEpisode = null;
}

/**
 * Lance la séquence d'authentification avec animation
 */
function startAuthSequence(episodeId, enteredPassword) {
    const fingerprintOverlay = $('fingerprintOverlay');
    const enigmeLoading = $('enigmeLoading');
    const enigmeLoadingProgress = $('enigmeLoadingProgress');
    
    if (!fingerprintOverlay || !enigmeLoading || !enigmeLoadingProgress) {
        verifyAndUnlock(episodeId, enteredPassword);
        return;
    }
    
    // Masquer la section d'authentification
    const authSection = $('enigmeAuthSection');
    if (authSection) {
        authSection.style.opacity = '0.5';
        authSection.style.pointerEvents = 'none';
    }
    
    // Étape 1: Afficher l'overlay d'empreinte digitale
    fingerprintOverlay.style.display = 'flex';
    fingerprintOverlay.setAttribute('aria-hidden', 'false');
    
    setTimeout(() => {
        // Étape 2: Masquer l'empreinte et afficher le chargement
        fingerprintOverlay.style.display = 'none';
        fingerprintOverlay.setAttribute('aria-hidden', 'true');
        
        enigmeLoading.style.display = 'block';
        enigmeLoadingProgress.style.width = '0%';
        
        // Animation de la barre de progression
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress > 100) progress = 100;
            
            enigmeLoadingProgress.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                
                setTimeout(() => {
                    enigmeLoading.style.display = 'none';
                    
                    if (authSection) {
                        authSection.style.opacity = '1';
                        authSection.style.pointerEvents = 'auto';
                    }
                    
                    verifyAndUnlock(episodeId, enteredPassword);
                }, 500);
            }
        }, 100);
        
    }, 3000);
}

/**
 * Vérifie le mot de passe et déverrouille l'épisode
 */
async function verifyAndUnlock(episodeId, enteredPassword) {
    const epData = getEpisodeData(episodeId);
    
    if (!epData) {
        showEnigmeError('Épisode non trouvé.');
        return;
    }
    
    // Comparaison insensible à la casse
    const isCorrect = enteredPassword.trim().toLowerCase() === epData.password.toLowerCase();
    
    if (isCorrect) {
        // Succès !
        showEnigmeSuccess('Accès autorisé. Fichiers déclassifiés.');
        
        setTimeout(async () => {
            // Ajouter à la liste des déverrouillés
            AppState.addUnlockedEpisode(episodeId);
            
            // Mettre à jour l'interface
            updateProgress();
            updateResolveButtons();
            
            // Mettre à jour le dossier
            const folder = document.querySelector(`.enigme-folder[data-episode="${episodeId}"]`);
            if (folder) {
                folder.classList.add('unlocked');
                const status = folder.querySelector('.folder-status');
                if (status) {
                    status.textContent = 'DÉVERROUILLÉ';
                }
            }
            
            // Afficher le contenu et les fichiers bonus
            await displayUnlockedContent(episodeId, epData);
        }, 2000);
    } else {
        showEnigmeError('Code invalide.');
    }
}

/**
 * Affiche le contenu déverrouillé et les fichiers bonus
 */
async function displayUnlockedContent(episodeId, epData) {
    const authSection = $('enigmeAuthSection');
    const contentSection = $('enigmeContent');
    const contentTitle = $('contentTitle');
    const unlockedContent = $('unlockedContent');
    const bonusContainer = $('bonusFilesContainer');
    
    if (authSection) {
        authSection.style.display = 'none';
    }
    
    if (contentSection) {
        // Construire le contenu de l'indice
        let letterHtml = '';
        if (epData.letter) {
            letterHtml = `<div class="letter-found">Lettre découverte : ${epData.letter}</div>`;
        } else if (episodeId === 9) {
            letterHtml = `<div class="letter-found">Lettre découverte : (aucune)</div>`;
        } else if (episodeId === 10) {
            letterHtml = `<div class="letter-found">PROGRESSION COMPLÈTE : ELLIPSE2</div>`;
        }
        
        if (contentTitle) {
            contentTitle.innerHTML = `<i class="fas fa-unlock" aria-hidden="true"></i> ${escapeHtml(epData.title)} - INDICE DÉCHIFFRÉ`;
        }
        
        if (unlockedContent) {
            unlockedContent.innerHTML = `
                <h3>${escapeHtml(epData.password)}</h3>
                <p><strong>INDICE DÉCHIFFRÉ : Bravo !</strong></p>
                <p>${escapeHtml(epData.hint)}</p>
                <p>Mais ce n'est qu'une pièce du puzzle…</p>
                <p><em>Note : Continuez à chercher des indices similaires dans les prochains épisodes...</em></p>
                ${letterHtml}
            `;
        }
        
        // Afficher les fichiers bonus
        if (bonusContainer && epData.files) {
            await displayBonusFiles(episodeId, epData.files, bonusContainer);
        }
        
        contentSection.style.display = 'block';
        contentSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Affiche les fichiers bonus d'un épisode
 */
async function displayBonusFiles(episodeId, files, container) {
    container.innerHTML = `<h3><i class="fas fa-folder-open" aria-hidden="true"></i> INDICES DÉCLASSIFIÉS — ÉPISODE ${episodeId}</h3>`;
    
    if (!files || files.length === 0) {
        container.innerHTML += `<p class="no-bonus">Aucun fichier supplémentaire pour cet épisode… pour l'instant.</p>`;
        container.style.display = 'block';
        return;
    }
    
    const filesGrid = document.createElement('div');
    filesGrid.className = 'bonus-files-grid';
    
    for (const file of files) {
        const path = `/data/indices/ep${episodeId}/${file}`;
        const ext = getFileExtension(file);
        
        const fileItem = document.createElement('div');
        fileItem.className = 'bonus-file-wrapper';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            // Image
            fileItem.innerHTML = `
                <div class="bonus-file-card bonus-image-card">
                    <img src="${path}" alt="${escapeHtml(file)}" class="bonus-img" loading="lazy">
                    <div class="bonus-file-name">${escapeHtml(file)}</div>
                </div>
            `;
        } else if (ext === 'txt') {
            // Fichier texte - charger le contenu
            try {
                const response = await fetch(path);
                const text = await response.text();
                fileItem.innerHTML = `
                    <div class="bonus-file-card bonus-text-card">
                        <div class="bonus-file-header">
                            <i class="fas fa-file-alt" aria-hidden="true"></i>
                            <span>${escapeHtml(file)}</span>
                        </div>
                        <pre class="bonus-text">${escapeHtml(text)}</pre>
                    </div>
                `;
            } catch (e) {
                fileItem.innerHTML = `
                    <div class="bonus-file-card">
                        <a href="${path}" target="_blank" class="bonus-download">
                            <i class="fas fa-file-alt" aria-hidden="true"></i>
                            ${escapeHtml(file)}
                        </a>
                    </div>
                `;
            }
        } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
            // Audio
            fileItem.innerHTML = `
                <div class="bonus-file-card bonus-audio-card">
                    <div class="bonus-file-header">
                        <i class="fas fa-file-audio" aria-hidden="true"></i>
                        <span>${escapeHtml(file)}</span>
                    </div>
                    <audio controls class="bonus-audio">
                        <source src="${path}" type="${getAudioMimeType(ext)}">
                        Votre navigateur ne supporte pas l'audio.
                    </audio>
                </div>
            `;
        } else if (['mp4', 'webm', 'ogv'].includes(ext)) {
            // Vidéo
            fileItem.innerHTML = `
                <div class="bonus-file-card bonus-video-card">
                    <div class="bonus-file-header">
                        <i class="fas fa-file-video" aria-hidden="true"></i>
                        <span>${escapeHtml(file)}</span>
                    </div>
                    <video controls class="bonus-video">
                        <source src="${path}" type="video/${ext}">
                        Votre navigateur ne supporte pas la vidéo.
                    </video>
                </div>
            `;
        } else if (ext === 'pdf') {
            // PDF
            fileItem.innerHTML = `
                <div class="bonus-file-card bonus-pdf-card">
                    <a href="${path}" target="_blank" rel="noopener noreferrer" class="bonus-download bonus-pdf">
                        <i class="fas fa-file-pdf" aria-hidden="true"></i>
                        <span>${escapeHtml(file)}</span>
                        <small>Cliquez pour ouvrir</small>
                    </a>
                </div>
            `;
        } else {
            // Autre fichier - lien de téléchargement
            fileItem.innerHTML = `
                <div class="bonus-file-card">
                    <a href="${path}" target="_blank" download class="bonus-download">
                        <i class="fas fa-download" aria-hidden="true"></i>
                        <span>Télécharger ${escapeHtml(file)}</span>
                    </a>
                </div>
            `;
        }
        
        filesGrid.appendChild(fileItem);
    }
    
    container.appendChild(filesGrid);
    container.style.display = 'block';
}

/**
 * Vérifie le mot de passe de l'énigme (appelée par le bouton)
 */
function checkEnigmePassword() {
    if (!AppState.selectedEpisode) return;
    
    const passwordInput = $('enigmePasswordInput');
    if (!passwordInput) return;
    
    const enteredPassword = passwordInput.value.trim();
    
    if (!enteredPassword) {
        showEnigmeError('Veuillez entrer un mot de passe.');
        return;
    }
    
    startAuthSequence(AppState.selectedEpisode, enteredPassword);
}

/**
 * Affiche la notification de succès
 */
function showEnigmeSuccess(message) {
    const notification = $('enigmeNotification');
    const icon = $('enigmeNotificationIcon');
    const text = $('enigmeNotificationText');
    
    if (notification && icon && text) {
        icon.className = 'fas fa-check-circle';
        text.textContent = message || 'Accès autorisé - indice déverrouillé.';
        notification.style.borderColor = 'var(--accent-cyan)';
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }
}

/**
 * Affiche la notification d'erreur
 */
function showEnigmeError(message) {
    const notification = $('enigmeNotification');
    const icon = $('enigmeNotificationIcon');
    const text = $('enigmeNotificationText');
    
    if (notification && icon && text) {
        icon.className = 'fas fa-times-circle';
        text.textContent = message || 'Accès refusé - mot de passe incorrect.';
        notification.style.borderColor = 'var(--error-red)';
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }
    
    const passwordInput = $('enigmePasswordInput');
    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.focus();
    }
}

/**
 * Masque le contenu de l'énigme
 */
function hideEnigmeContent() {
    const contentSection = $('enigmeContent');
    const bonusContainer = $('bonusFilesContainer');
    const passwordInput = $('enigmePasswordInput');
    
    if (contentSection) {
        contentSection.style.display = 'none';
    }
    if (bonusContainer) {
        bonusContainer.style.display = 'none';
        bonusContainer.innerHTML = '';
    }
    if (passwordInput) {
        passwordInput.value = '';
    }
    AppState.selectedEpisode = null;
}

/**
 * Initialise le système d'énigmes
 */
function initializeEnigmes() {
    const enigmeFolders = $$('.enigme-folder');
    const enigmeSubmitBtn = $('enigmeSubmitBtn');
    const enigmeCancelBtn = $('enigmeCancelBtn');
    const backToFoldersBtn = $('backToFoldersBtn');
    const enigmePasswordInput = $('enigmePasswordInput');
    
    enigmeFolders.forEach(folder => {
        folder.addEventListener('click', function() {
            if (this.classList.contains('disabled')) return;
            
            AppState.selectedEpisode = parseInt(this.getAttribute('data-episode'));
            showEnigmeAuth(AppState.selectedEpisode);
        });
        
        folder.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!this.classList.contains('disabled')) {
                    AppState.selectedEpisode = parseInt(this.getAttribute('data-episode'));
                    showEnigmeAuth(AppState.selectedEpisode);
                }
            }
        });
    });
    
    if (enigmeSubmitBtn) {
        enigmeSubmitBtn.addEventListener('click', checkEnigmePassword);
    }
    
    if (enigmeCancelBtn) {
        enigmeCancelBtn.addEventListener('click', hideEnigmeAuth);
    }
    
    if (backToFoldersBtn) {
        backToFoldersBtn.addEventListener('click', hideEnigmeContent);
    }
    
    if (enigmePasswordInput) {
        enigmePasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkEnigmePassword();
            }
        });
    }
}

/* ==========================================================================
   11. MODAL D'ACCÈS
   ========================================================================== */

/**
 * Ferme le modal d'accès
 */
function closeModal() {
    const accessModal = $('accessModal');
    const errorMessage = $('errorMessage');
    const accessCodeInput = $('accessCode');
    
    if (accessModal) accessModal.style.display = 'none';
    if (errorMessage) errorMessage.style.display = 'none';
    if (accessCodeInput) accessCodeInput.value = '';
}

/**
 * Vérifie le code d'accès principal
 */
function checkAccessCode() {
    const accessCodeInput = $('accessCode');
    const errorMessage = $('errorMessage');
    
    if (!accessCodeInput) return;
    
    const enteredCode = accessCodeInput.value.trim().toUpperCase();
    
    if (enteredCode === ACCESS_CODE) {
        closeModal();
        showPage('menu');
        showDistortionEffect();
    } else {
        if (errorMessage) {
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 3000);
        }
        if (accessCodeInput) {
            accessCodeInput.value = '';
            accessCodeInput.focus();
        }
    }
}

/**
 * Initialise les événements du modal et de l'accueil
 */
function initializeEvents() {
    const startBtn = $('startBtn');
    const accessModal = $('accessModal');
    const submitBtn = $('submitBtn');
    const cancelBtn = $('cancelBtn');
    const accessCodeInput = $('accessCode');
    
    if (startBtn) {
        startBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (accessModal) {
                accessModal.style.display = 'flex';
                setTimeout(() => {
                    if (accessCodeInput) accessCodeInput.focus();
                }, 100);
            }
        });
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            checkAccessCode();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    }
    
    if (accessCodeInput) {
        accessCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkAccessCode();
            }
        });
    }
    
    if (accessModal) {
        accessModal.addEventListener('click', function(e) {
            if (e.target === accessModal) closeModal();
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && accessModal.style.display === 'flex') {
                closeModal();
            }
        });
    }
}

/* ==========================================================================
   12. TOGGLE PASSWORD VISIBILITY
   ========================================================================== */

/**
 * Initialise les boutons de toggle visibilité des mots de passe
 */
function initializePasswordToggle() {
    const toggleButtons = $$('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const container = this.parentElement;
            const input = container.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    if (icon) {
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    }
                    this.setAttribute('aria-label', 'Masquer le mot de passe');
                } else {
                    input.type = 'password';
                    if (icon) {
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                    this.setAttribute('aria-label', 'Afficher le mot de passe');
                }
            }
        });
    });
}

/* ==========================================================================
   13. INITIALISATION
   ========================================================================== */

/**
 * Initialisation complète de l'application
 */
async function init() {
    console.log('ELLI-PSE v2.0.0 - Initialisation...');
    
    // Charger les données sauvegardées
    AppState.loadUnlockedEpisodes();
    
    // Charger les données des épisodes depuis le JSON
    await loadEpisodesData();
    
    // Initialiser tous les composants
    initializeEvents();
    initializeNavigation();
    initializeCountdown();
    initializeEpisodesPage();
    initializeEnigmes();
    initializeResolveButtons();
    initializePasswordToggle();
    updateProgress();
    updateResolveButtons();
    
    console.log('ELLI-PSE v2.0.0 - Application initialisée');
    console.log('Épisodes déverrouillés:', AppState.unlockedEpisodes);
}

// Exposer les fonctions globalement pour les handlers onclick
window.showPage = showPage;

// Lancer l'initialisation au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
