// Application State
let currentProgress = 0;
let flowerCount = 0;
let clickCount = 0;
let hasRevealed = false;
let cookieChoice = null;
let flowersComplete = false;

// Webhook Configuration
const WEBHOOK_URL = "https://example.com/valentine-webhook";

// Audio System
let audioContext;
let audioEnabled = true;

// Initialize Audio Context
const initializeAudio = () => {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Handle mobile audio context suspension
        if (audioContext.state === 'suspended') {
            document.addEventListener('touchstart', resumeAudioContext, { once: true });
            document.addEventListener('click', resumeAudioContext, { once: true });
        }
        
        return true;
    } catch (error) {
        console.log('Audio not supported');
        audioEnabled = false;
        return false;
    }
};

// Resume Audio Context (required for mobile)
const resumeAudioContext = () => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
};

// Create Cute Bell Sound
const createTapSound = (frequency = 800, duration = 0.4, volume = 0.2) => {
    if (!audioContext || !audioEnabled) return;
    
    // Create multiple oscillators for rich bell-like tone
    const oscillators = [];
    const gainNodes = [];
    
    // Main tone, octave, and harmonic for bell-like quality
    const frequencies = [frequency, frequency * 2, frequency * 3.2, frequency * 4.8];
    const volumes = [volume, volume * 0.3, volume * 0.15, volume * 0.08];
    
    frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Bell-like frequency modulation
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(freq * 0.98, audioContext.currentTime + duration);
        
        // Soft attack, gentle decay
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volumes[index], audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        // Softer waveform for warmer sound
        oscillator.type = index === 0 ? 'triangle' : 'sine';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
        oscillators.push(oscillator);
        gainNodes.push(gainNode);
    });
};

// Create Magical Celebration Sound
const createCelebrationSound = () => {
    if (!audioContext || !audioEnabled) return;
    
    // Romantic melody with gentle bell tones
    const melody = [
        { freq: 523, delay: 0 },    // C
        { freq: 659, delay: 300 },  // E
        { freq: 784, delay: 600 },  // G
        { freq: 1047, delay: 900 }, // C
        { freq: 1175, delay: 1200 }, // D
        { freq: 1047, delay: 1500 }  // C
    ];
    
    // Play romantic melody
    melody.forEach(note => {
        setTimeout(() => {
            createTapSound(note.freq, 0.8, 0.15);
        }, note.delay);
    });
    
    // Add magical sparkle sounds with reverb-like effect
    setTimeout(() => {
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const sparkleFreq = 800 + Math.random() * 1200;
                createSparkleSound(sparkleFreq);
            }, i * 150);
        }
    }, 1000);
};

// Create Sparkle Sound for Celebration
const createSparkleSound = (frequency) => {
    if (!audioContext || !audioEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Quick sparkle with high frequency and fast decay
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 2, audioContext.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
    
    oscillator.type = 'triangle';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
};

// Create Generic Button Click Sound (consistent with flower sounds)
const createButtonClickSound = () => {
    if (!audioContext || !audioEnabled) return;
    
    // Use same bell-like approach as flower taps, but shorter and softer
    const frequency = 600; // Pleasant, not too high
    const oscillators = [];
    const gainNodes = [];
    
    const frequencies = [frequency, frequency * 2, frequency * 3.2];
    const volumes = [0.08, 0.024, 0.012]; // Quieter than flower taps
    
    frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(freq * 0.98, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volumes[index], audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        
        oscillator.type = index === 0 ? 'triangle' : 'sine';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        
        oscillators.push(oscillator);
        gainNodes.push(gainNode);
    });
};

// Get Musical Sound for Click Number
const getTapSoundFrequency = (clickNumber) => {
    // Consistently ascending musical scale (no repeated notes)
    const frequencies = [
        440,  // 1 - A (warm start)
        494,  // 2 - B
        554,  // 3 - C#
        587,  // 4 - D
        659,  // 5 - E
        740,  // 6 - F# ("enough" point)
        784,  // 7 - G (getting expensive)
        831,  // 8 - G#
        880,  // 9 - A (octave)
        988,  // 10 - B
        1109, // 11 - C#
        1175  // 12 - D (final "broke" sound)
    ];
    
    return frequencies[clickNumber - 1] || 659;
};

// DOM Elements
let progressFill, progressLabel, dynamicMessage, growButton;
let mainScreen, cookieScreen, revealScreen, choiceButtons, finalMessage, animationContainer;
let visualBouquet, flowerCountDisplay;

// Messages for exactly 12 flowers (13 total: initial + 12 clicks)
const clickMessages = [
    "Ready to find out how many flowers you deserve?",
    "Starting small…",
    "A couple flowers… cute.",
    "Getting somewhere!",
    "Ooh, this is nice…",
    "Now we're talking!",
    "Looking lovely! Six is enough right?",
    "Wait… you want MORE? 😅",
    "Okay, you're making me broke!",
    "Now I have to check my wallet babe…",
    "We're going to go bankrupt! 💸",
    "My credit card is crying 😭",
    "Fine... you deserve all the flowers (and I'm officially broke)!"
];

// Flower Emojis for Visual Bouquet
const flowerEmojis = ['🌹', '🌸', '🌺', '🌻', '🌷', '💐', '🌼', '🥀', '🌿'];

const getUniqueMessage = (clickIndex) => {
    if (clickIndex < clickMessages.length) {
        return clickMessages[clickIndex];
    }
    return clickMessages[clickMessages.length - 1];
};

// Initialize Application
const initializeApp = () => {
    // Cache DOM elements
    progressFill = document.getElementById('progress-fill');
    progressLabel = document.getElementById('progress-label');
    dynamicMessage = document.getElementById('dynamic-message');
    growButton = document.getElementById('grow-button');
    mainScreen = document.getElementById('main-screen');
    cookieScreen = document.getElementById('cookie-screen');
    revealScreen = document.getElementById('reveal-screen');
    choiceButtons = document.getElementById('choice-buttons');
    visualBouquet = document.getElementById('visual-bouquet');
    flowerCountDisplay = document.getElementById('flower-count');
    finalMessage = document.getElementById('final-message');
    animationContainer = document.getElementById('animation-container');
    
    // Set initial state
    updateProgressUI();
    updateFlowerCountDisplay();
    updateMessage();
    
    // Initialize audio system
    initializeAudio();
    
    // Add event listeners
    growButton.addEventListener('click', handleGrowButtonClick);
    
    // Add cookie button listeners
    const cookieButtonElements = document.querySelectorAll('[data-cookie]');
    cookieButtonElements.forEach(button => {
        button.addEventListener('click', handleCookieChoice);
    });
    
    // Add valentine choice button listeners
    const valentineChoiceButtons = document.querySelectorAll('[data-choice]');
    valentineChoiceButtons.forEach(button => {
        button.addEventListener('click', handleValentineChoice);
    });
};

// Update Progress UI
const updateProgressUI = () => {
    progressFill.style.width = `${currentProgress}%`;
    const roundedProgress = Math.round(currentProgress);
    progressLabel.textContent = `${roundedProgress}% full bouquet`;
};

// Update Dynamic Message
const updateMessage = () => {
    const newMessage = getUniqueMessage(clickCount);
    
    // Add subtle animation to message change
    dynamicMessage.style.opacity = '0.5';
    dynamicMessage.style.transform = 'translateY(5px)';
    
    setTimeout(() => {
        dynamicMessage.textContent = newMessage;
        dynamicMessage.style.opacity = '1';
        dynamicMessage.style.transform = 'translateY(0)';
    }, 150);
};

// Update Flower Count Display
const updateFlowerCountDisplay = () => {
    const flowerText = flowerCount === 1 ? 'flower' : 'flowers';
    flowerCountDisplay.textContent = `${flowerCount} ${flowerText}`;
};

// Add Flower to Visual Bouquet
const addFlowerToBouquet = () => {
    const flower = document.createElement('span');
    const randomFlower = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];
    flower.textContent = randomFlower;
    flower.className = 'flower';
    
    visualBouquet.appendChild(flower);
    visualBouquet.classList.add('has-flowers');
    
    flowerCount++;
    updateFlowerCountDisplay();
};

// Handle Grow Button Click
const handleGrowButtonClick = () => {
    // Prevent interaction if already revealed
    if (hasRevealed) return;
    
    // Add button press animation
    growButton.style.transform = 'scale(0.95)';
    setTimeout(() => {
        growButton.style.transform = '';
    }, 100);
    
    // Check if flowers are complete and user wants to claim
    if (flowersComplete) {
        // User is claiming their flowers - play special claim sound
        createTapSound(1175, 0.6, 0.25); // Pleasant D note, longer duration
        setTimeout(showCookieScreen, 500);
        return;
    }
    
    // Prevent adding more than 12 flowers
    if (clickCount >= 12) return;
    
    // Increment click count
    clickCount++;
    
    // Play tap sound effect
    const frequency = getTapSoundFrequency(clickCount);
    createTapSound(frequency, 0.15, 0.3);
    
    // Add flower to visual bouquet
    addFlowerToBouquet();
    
    // Each flower is 8.33% progress (100% ÷ 12 flowers)
    const progressIncrease = 8.33;
    
    // Update progress
    const newProgress = Math.min(currentProgress + progressIncrease, 100);
    
    // Animate progress change
    setTimeout(() => {
        currentProgress = newProgress;
        updateProgressUI();
        updateMessage();
        
        // Check if we've reached 12 flowers (100%)
        if (clickCount >= 12 && !hasRevealed) {
            flowersComplete = true;
            updateButtonForClaim();
        }
    }, 100);
};

// Update Button for Claiming Flowers
const updateButtonForClaim = () => {
    growButton.textContent = 'Claim my flowers 💐';
    growButton.style.background = 'linear-gradient(90deg, #ff69b4, #ffa0c9)';
    
    // Add subtle pulse animation to draw attention
    growButton.style.animation = 'pulse 2s infinite';
};

// Show Cookie Screen
const showCookieScreen = () => {
    // Hide main screen
    mainScreen.classList.remove('active');
    
    // Show cookie screen after a short delay
    setTimeout(() => {
        cookieScreen.classList.add('active');
        
        // Add entrance animation to the cookie emoji
        const cookieEmoji = document.querySelector('.cookie-emoji');
        if (cookieEmoji) {
            cookieEmoji.style.animation = 'bounce 1s ease-in-out';
        }
    }, 300);
};

// Handle Cookie Choice
const handleCookieChoice = (event) => {
    cookieChoice = event.target.dataset.cookie;
    
    // Play button click sound
    createButtonClickSound();
    
    // Add button press animation
    event.target.style.transform = 'scale(0.95)';
    
    // Hide cookie screen and show reveal screen
    setTimeout(() => {
        cookieScreen.classList.remove('active');
        
        setTimeout(() => {
            showRevealScreen();
        }, 300);
    }, 150);
};

// Show Reveal Screen
const showRevealScreen = () => {
    hasRevealed = true;
    
    // Show reveal screen
    revealScreen.classList.add('active');
    
    // Add entrance animation to the bouquet emoji
    const bouquetEmoji = document.querySelector('.bouquet-emoji');
    if (bouquetEmoji) {
        bouquetEmoji.style.animation = 'bounce 1s ease-in-out';
    }
};

// Handle Valentine Choice
const handleValentineChoice = (event) => {
    const choice = event.target.dataset.choice;
    
    // Play button click sound
    createButtonClickSound();
    
    // Add button press animation
    event.target.style.transform = 'scale(0.95)';
    
    // Hide choice buttons
    setTimeout(() => {
        choiceButtons.style.opacity = '0';
        choiceButtons.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            choiceButtons.style.display = 'none';
            
            // Hide headline and subheadline
            const headline = document.querySelector('.reveal-headline');
            const subheadline = document.querySelector('.reveal-subheadline');
            if (headline) headline.style.display = 'none';
            if (subheadline) subheadline.style.display = 'none';
            
            // Show final message
            finalMessage.classList.remove('hidden');
            finalMessage.classList.add('show');
            
            // Trigger celebration animation
            setTimeout(() => {
                triggerFinalAnimation();
            }, 500);
            
            // Send webhook notification
            sendWebhook(choice);
        }, 300);
    }, 150);
};

// Trigger Final Celebration Animation
const triggerFinalAnimation = () => {
    // Play celebration sound
    createCelebrationSound();
    
    const hearts = ['❤️', '🌷', '🌸', '💖', '🌺'];
    const animationCount = 15;
    
    for (let i = 0; i < animationCount; i++) {
        setTimeout(() => {
            createFloatingHeart(hearts[Math.floor(Math.random() * hearts.length)]);
        }, i * 200);
    }
};

// Create Floating Heart Animation
const createFloatingHeart = (emoji) => {
    const heart = document.createElement('span');
    heart.textContent = emoji;
    heart.className = 'floating-heart';
    
    // Random horizontal position
    const randomX = Math.random() * (window.innerWidth - 50);
    heart.style.left = `${randomX}px`;
    heart.style.bottom = '0px';
    
    // Random animation delay and duration
    heart.style.animationDelay = `${Math.random() * 0.5}s`;
    heart.style.animationDuration = `${2.5 + Math.random() * 1}s`;
    
    animationContainer.appendChild(heart);
    
    // Remove element after animation
    setTimeout(() => {
        if (heart.parentNode) {
            heart.parentNode.removeChild(heart);
        }
    }, 4000);
};

// Send Webhook Notification
const sendWebhook = async (choice) => {
    try {
        const payload = {
            timestamp: new Date().toISOString(),
            valentineChoice: choice,
            cookieChoice: cookieChoice,
            totalFlowers: flowerCount,
            totalClicks: clickCount,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        console.log('Webhook sent successfully');
    } catch (error) {
        // Silently handle errors to not affect user experience
        console.log('Webhook failed (this is expected with the example URL):', error.message);
    }
};

// Handle Touch Events for Better Mobile Experience
const addTouchFeedback = () => {
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
        button.addEventListener('touchstart', () => {
            button.style.transform = button.style.transform.replace('scale(1)', 'scale(0.95)');
        }, { passive: true });
        
        button.addEventListener('touchend', () => {
            setTimeout(() => {
                if (!button.style.transform.includes('scale(0.95)')) {
                    button.style.transform = button.style.transform.replace('scale(0.95)', 'scale(1)');
                }
            }, 100);
        }, { passive: true });
    });
};

// Preload Critical Resources
const preloadResources = () => {
    // Preload Google Fonts if not already loaded
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
};

// Handle Visibility API for Performance
const handleVisibilityChange = () => {
    if (document.hidden) {
        // Pause animations when tab is not visible
        document.body.style.animationPlayState = 'paused';
    } else {
        // Resume animations when tab becomes visible
        document.body.style.animationPlayState = 'running';
    }
};

// Initialize Application on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    addTouchFeedback();
    preloadResources();
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add error handling for uncaught errors
    window.addEventListener('error', (event) => {
        console.log('Application error:', event.error?.message || 'Unknown error');
    });
    
    // Add console message for developers
    console.log('💐 Valentine\'s Flowers Meter loaded successfully!');
    console.log('Made with love for GitHub Pages deployment');
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getMessageForProgress,
        updateProgressUI,
        updateMessage
    };
}