class PomodoroTimer {
    constructor() {
        // Timer state
        this.isRunning = false;
        this.isPaused = false;
        this.isWorkSession = true;
        this.timeLeft = 0;
        this.totalTime = 0;
        this.sessionCount = 0;
        this.interval = null;
        this.currentSessionInCycle = 0;
        this.totalSessions = 4;

        // Settings
        this.settings = {
            workDuration: 25,
            breakDuration: 5,
            longBreakDuration: 15,
            sections: 4,
            soundEnabled: true
        };

        // DOM elements
        this.timeDisplay = document.getElementById('time');
        this.sessionTypeDisplay = document.getElementById('session-type');
        this.startPauseBtn = document.getElementById('start-pause-btn');
        this.taskInput = document.getElementById('task-input');
        this.editTaskBtn = document.getElementById('edit-task-btn');
        this.progressCircle = document.getElementById('progress-circle');
        this.timerContent = document.querySelector('.timer-content');
        this.progressDots = document.querySelectorAll('.dot');
        
        // Settings modal elements
        this.settingsModal = document.getElementById('settings-modal');
        this.saveSettingsBtn = document.getElementById('save-settings');
        this.closeModalBtn = document.getElementById('close-modal');
        this.cancelSettingsBtn = document.getElementById('cancel-settings');
        this.workDurationSelect = document.getElementById('work-duration');
        this.breakDurationSelect = document.getElementById('break-duration');
        this.longBreakDurationSelect = document.getElementById('long-break-duration');
        this.sectionsSelect = document.getElementById('sections');

        // Navigation
        this.navBtns = document.querySelectorAll('.nav-btn');
        this.timerBtn = document.getElementById('timer-btn');
        this.statsBtn = document.getElementById('stats-btn');

        this.init();
    }

    init() {
        this.loadSettings();
        this.resetTimer();
        this.bindEvents();
        this.updateProgressDots();
        this.loadTask();
    }

    bindEvents() {
        this.startPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.editTaskBtn.addEventListener('click', () => this.editTask());
        this.taskInput.addEventListener('blur', () => this.saveTask());
        this.taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.taskInput.blur();
            }
        });

        // Settings
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.closeModalBtn.addEventListener('click', () => this.closeSettingsModal());
        this.cancelSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        this.statsBtn.addEventListener('click', () => this.openSettingsModal());
        
        // Close modal when clicking outside
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettingsModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.settingsModal.classList.contains('active') && e.target !== this.taskInput) {
                e.preventDefault();
                this.toggleTimer();
            }
            if (e.key === 'Escape') {
                this.closeSettingsModal();
            }
        });
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }

        const savedSessionCount = localStorage.getItem('pomodoroSessionCount');
        if (savedSessionCount) {
            this.sessionCount = parseInt(savedSessionCount);
        }

        this.totalSessions = this.settings.sections;

        // Update settings inputs
        this.workDurationSelect.value = this.settings.workDuration;
        this.breakDurationSelect.value = this.settings.breakDuration;
        this.longBreakDurationSelect.value = this.settings.longBreakDuration;
        this.sectionsSelect.value = this.settings.sections;
    }

    saveSettings() {
        this.settings.workDuration = parseInt(this.workDurationSelect.value);
        this.settings.breakDuration = parseInt(this.breakDurationSelect.value);
        this.settings.longBreakDuration = parseInt(this.longBreakDurationSelect.value);
        this.settings.sections = parseInt(this.sectionsSelect.value);

        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
        this.totalSessions = this.settings.sections;
        
        // If timer is not running, update with new settings
        if (!this.isRunning) {
            this.resetTimer();
            this.updateProgressDots();
        }
        
        this.closeSettingsModal();
    }

    openSettingsModal() {
        this.settingsModal.classList.add('active');
    }

    closeSettingsModal() {
        this.settingsModal.classList.remove('active');
    }

    loadTask() {
        const savedTask = localStorage.getItem('pomodoroTask');
        if (savedTask) {
            this.taskInput.value = savedTask;
        }
    }

    saveTask() {
        localStorage.setItem('pomodoroTask', this.taskInput.value);
    }

    editTask() {
        this.taskInput.focus();
        this.taskInput.select();
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        this.isRunning = true;
        this.isPaused = false;
        this.updatePlayPauseButton();
        this.timerContent.classList.add('working');

        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgress();

            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        this.isPaused = true;
        this.updatePlayPauseButton();
        this.timerContent.classList.remove('working');
        clearInterval(this.interval);
    }

    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        this.isWorkSession = true;
        this.currentSessionInCycle = 0;
        
        this.timeLeft = this.settings.workDuration * 60;
        this.totalTime = this.timeLeft;
        
        this.updatePlayPauseButton();
        this.timerContent.classList.remove('working');
        this.sessionTypeDisplay.textContent = 'Focus time';
        this.sessionTypeDisplay.classList.remove('break');
        this.progressCircle.classList.remove('break');
        
        clearInterval(this.interval);
        this.updateDisplay();
        this.updateProgress();
        this.updateProgressDots();
    }

    completeSession() {
        this.isRunning = false;
        clearInterval(this.interval);
        this.timerContent.classList.remove('working');

        if (this.isWorkSession) {
            // Completed a work session
            this.sessionCount++;
            this.currentSessionInCycle++;
            this.saveSessionCount();
            
            // Determine if it's time for a long break
            const isLongBreak = this.currentSessionInCycle >= this.totalSessions;
            
            if (isLongBreak) {
                this.currentSessionInCycle = 0;
                this.timeLeft = this.settings.longBreakDuration * 60;
                this.sessionTypeDisplay.textContent = 'Long break';
            } else {
                this.timeLeft = this.settings.breakDuration * 60;
                this.sessionTypeDisplay.textContent = 'Short break';
            }
            
            this.isWorkSession = false;
            this.totalTime = this.timeLeft;
            this.sessionTypeDisplay.classList.add('break');
            this.progressCircle.classList.add('break');
        } else {
            // Completed a break
            this.isWorkSession = true;
            this.timeLeft = this.settings.workDuration * 60;
            this.totalTime = this.timeLeft;
            this.sessionTypeDisplay.textContent = 'Focus time';
            this.sessionTypeDisplay.classList.remove('break');
            this.progressCircle.classList.remove('break');
        }

        this.updatePlayPauseButton();
        this.updateDisplay();
        this.updateProgress();
        this.updateProgressDots();
        this.playNotificationSound();
        this.showNotification();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateProgress() {
        const progress = (this.totalTime - this.timeLeft) / this.totalTime;
        const circumference = 2 * Math.PI * 120; // radius = 120
        const dashOffset = circumference - (progress * circumference);
        this.progressCircle.style.strokeDashoffset = dashOffset;
    }

    updateProgressDots() {
        this.progressDots.forEach((dot, index) => {
            if (index < this.currentSessionInCycle) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    updatePlayPauseButton() {
        const svg = this.startPauseBtn.querySelector('svg');
        
        if (this.isRunning) {
            // Show pause icon
            svg.innerHTML = `
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            `;
            this.startPauseBtn.classList.add('paused');
        } else {
            // Show play icon
            svg.innerHTML = `<path d="M8 5v14l11-7z"/>`;
            this.startPauseBtn.classList.remove('paused');
        }
    }

    saveSessionCount() {
        localStorage.setItem('pomodoroSessionCount', this.sessionCount.toString());
    }

    playNotificationSound() {
        if (!this.settings.soundEnabled) return;

        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.8);
        } catch (error) {
            console.log('Audio not supported:', error);
        }
    }

    showNotification() {
        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            const message = this.isWorkSession ? 
                'Break time! Take a short rest.' : 
                'Break\'s over! Time to focus.';
            
            new Notification('🍅 Pomodoro Timer', {
                body: message,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>'
            });
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const timer = new PomodoroTimer();
    
    // Request notification permission
    timer.requestNotificationPermission();
    
    // Prevent space bar from scrolling the page
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
        }
    });
}); 