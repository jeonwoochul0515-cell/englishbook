
import { initAI, getWordDefinition, getMagicSubtitles, generateComprehensionQuiz } from './ai.js';
import { initFirebase, login, logout, saveUserData, loadUserData } from './firebase.js';
import { processPdf } from './pdf.js';
import * as UI from './ui.js';

// --- STATE MANAGEMENT ---
let state = {
    sentences: [],
    currentSentenceIndex: 0,
    vocabulary: [],
    currentWord: '',
    currentBookId: null,
    currentUser: null,
    isAIReady: false,
    isFirebaseReady: false,
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    UI.setupModalCloseButtons();
    loadInitialSettings();
    addEventListeners();
});

function loadInitialSettings() {
    const geminiApiKey = localStorage.getItem('geminiApiKey');
    const firebaseConfig = localStorage.getItem('firebaseConfig');

    if (geminiApiKey) {
        document.getElementById('api-key-input').value = geminiApiKey;
        state.isAIReady = initAI(geminiApiKey);
    }

    if (firebaseConfig) {
        document.getElementById('firebase-config-input').value = firebaseConfig;
        state.isFirebaseReady = initFirebase(firebaseConfig, handleAuthStateChange);
    }
}

// --- EVENT LISTENERS ---
function addEventListeners() {
    UI.settingsBtn.addEventListener('click', () => UI.settingsModal.style.display = 'block');
    UI.loginBtn.addEventListener('click', handleLogin);
    UI.logoutBtn.addEventListener('click', logout);
    UI.pdfUpload.addEventListener('change', handlePdfUpload);
    
    document.getElementById('api-key-submit').addEventListener('click', setupAI);
    document.getElementById('firebase-config-submit').addEventListener('click', setupFirebase);

    document.getElementById('prev-btn').addEventListener('click', showPrevSentence);
    document.getElementById('next-btn').addEventListener('click', showNextSentence);

    document.getElementById('tab-definition').addEventListener('click', () => UI.switchInteractionView('definition'));
    document.getElementById('tab-magic').addEventListener('click', () => {
        const currentSentence = state.sentences[state.currentSentenceIndex];
        handleMagicSubtitles(currentSentence);
    });
    
    document.getElementById('add-to-vocab-btn').addEventListener('click', addToVocabulary);
    UI.vocabBtn.addEventListener('click', showVocabulary);
    UI.quizBtn.addEventListener('click', () => UI.quizModal.style.display = 'block');
}

// --- CORE LOGIC HANDLERS ---

function setupAI() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    if (apiKey) {
        state.isAIReady = initAI(apiKey);
        if (state.isAIReady) {
            localStorage.setItem('geminiApiKey', apiKey);
            alert('Gemini AI가 설정되었습니다.');
            UI.settingsModal.style.display = 'none';
        }
    }
}

function setupFirebase() {
    const config = document.getElementById('firebase-config-input').value.trim();
    if (config) {
        state.isFirebaseReady = initFirebase(config, handleAuthStateChange);
        if (state.isFirebaseReady) {
            localStorage.setItem('firebaseConfig', config);
            alert('Firebase가 설정되었습니다.');
            UI.settingsModal.style.display = 'none';
        }
    }
}

function handleLogin() {
    if (!state.isFirebaseReady) return alert('설정에서 Firebase 구성을 먼저 입력해주세요.');
    login();
}

async function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    state.currentBookId = file.name;
    UI.toggleMainView(true);

    try {
        state.sentences = await processPdf(file);
        if (state.currentUser) await loadDataForUser(state.currentUser.uid);
        UI.renderSentences(state.sentences, handleWordClick, handleSentenceClick);
        UI.updateSentenceHighlight(state.currentSentenceIndex);
    } catch (error) {
        console.error(error);
        alert(error.message);
        UI.toggleMainView(false);
    }
}

async function handleWordClick(word, context) {
    if (!state.isAIReady) return alert("설정에서 Gemini API 키를 입력해주세요.");
    
    state.currentWord = word;
    UI.showLoadingState('definition', word);

    const definition = await getWordDefinition(word, context);
    UI.showDefinition(word, definition);
}

function handleSentenceClick(sentence, index) {
    state.currentSentenceIndex = index;
    UI.updateSentenceHighlight(index);
    saveProgress();
    handleMagicSubtitles(sentence);
}

async function handleMagicSubtitles(sentence) {
    if (!state.isAIReady) return;

    UI.showLoadingState('magic');
    const chunks = await getMagicSubtitles(sentence);
    UI.showMagicSubtitles(chunks);
}

function showPrevSentence() {
    if (state.currentSentenceIndex > 0) {
        state.currentSentenceIndex--;
        UI.updateSentenceHighlight(state.currentSentenceIndex);
        saveProgress();
    }
}

function showNextSentence() {
    if (state.currentSentenceIndex < state.sentences.length - 1) {
        state.currentSentenceIndex++;
        UI.updateSentenceHighlight(state.currentSentenceIndex);
        saveProgress();
    }
}

// --- AUTH & DATA SYNC ---

async function handleAuthStateChange(user) {
    UI.updateAuthStateUI(user);
    if (user) {
        state.currentUser = user;
        await loadDataForUser(user.uid);
    } else {
        state.currentUser = null;
        state.vocabulary = [];
        // Optionally reset progress or handle logged-out state
    }
}

async function loadDataForUser(userId) {
    const data = await loadUserData(userId);
    if (data) {
        state.vocabulary = data.vocabulary || [];
        if (state.currentBookId && data.progress && data.progress[state.currentBookId]) {
            state.currentSentenceIndex = data.progress[state.currentBookId];
        }
        UI.renderVocabulary(state.vocabulary);
        if (state.sentences.length > 0) {
            UI.updateSentenceHighlight(state.currentSentenceIndex);
        }
    }
}

function saveProgress() {
    if (!state.currentUser || !state.currentBookId) return;
    const progress = { [state.currentBookId]: state.currentSentenceIndex };
    saveUserData(state.currentUser.uid, { progress });
}

function saveVocabulary() {
    if (!state.currentUser) return;
    saveUserData(state.currentUser.uid, { vocabulary: state.vocabulary });
}

// --- VOCABULARY & QUIZ ---

function addToVocabulary() {
    if (!state.currentUser) return alert("로그인이 필요합니다.");
    if (state.currentWord && !state.vocabulary.includes(state.currentWord)) {
        state.vocabulary.push(state.currentWord);
        saveVocabulary();
        UI.renderVocabulary(state.vocabulary);
        alert(`'${state.currentWord}'가 단어장에 추가되었습니다.`);
    }
}

function showVocabulary() {
    if (!state.currentUser) return alert("로그인이 필요합니다.");
    UI.renderVocabulary(state.vocabulary);
    UI.vocabModal.style.display = 'block';
}
