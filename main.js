
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

import { initAI, getWordDefinition, getMagicSubtitles, generateComprehensionQuiz } from './ai.js';
import { initFirebase, login, logout, saveUserData, loadUserData } from './firebase.js';

// DOM Elements
const pdfUpload = document.getElementById('pdf-upload');
const bookContainer = document.getElementById('book-container');
const navButtons = document.getElementById('nav-buttons');
const vocabBtn = document.getElementById('vocab-btn');
const quizBtn = document.getElementById('quiz-btn');
const settingsBtn = document.getElementById('settings-btn');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');

// Modals
const interactionModal = document.getElementById('interaction-modal');
const vocabModal = document.getElementById('vocab-modal');
const quizModal = document.getElementById('quiz-modal');
const settingsModal = document.getElementById('settings-modal');

// Modal Content Elements
const definitionView = document.getElementById('definition-view');
const magicView = document.getElementById('magic-view');
const tabDefinition = document.getElementById('tab-definition');
const tabMagic = document.getElementById('tab-magic');
const magicChunkContainer = document.getElementById('magic-chunk-container');

// State variables
let sentences = [];
let currentSentenceIndex = 0;
let pressTimer;
let vocabulary = [];
let currentWord = '';
let currentBookId = null;
let currentUser = null;

let isAIInitialized = false;
let isFirebaseInitialized = false;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const geminiApiKey = localStorage.getItem('geminiApiKey');
    const firebaseConfig = localStorage.getItem('firebaseConfig');

    if (geminiApiKey) {
        document.getElementById('api-key-input').value = geminiApiKey;
        isAIInitialized = initAI(geminiApiKey);
    }

    if (firebaseConfig) {
        document.getElementById('firebase-config-input').value = firebaseConfig;
        isFirebaseInitialized = initFirebase(firebaseConfig, handleAuthStateChange);
    }
});

// --- SETTINGS --- 
settingsBtn.addEventListener('click', () => settingsModal.style.display = 'block');

document.getElementById('api-key-submit').addEventListener('click', () => {
    const apiKey = document.getElementById('api-key-input').value.trim();
    if (apiKey) {
        isAIInitialized = initAI(apiKey);
        if (isAIInitialized) {
            localStorage.setItem('geminiApiKey', apiKey);
            alert('Gemini AI가 설정되었습니다.');
            settingsModal.style.display = 'none';
        }
    }
});

document.getElementById('firebase-config-submit').addEventListener('click', () => {
    const config = document.getElementById('firebase-config-input').value.trim();
    if (config) {
        isFirebaseInitialized = initFirebase(config, handleAuthStateChange);
        if (isFirebaseInitialized) {
            localStorage.setItem('firebaseConfig', config);
            alert('Firebase가 설정되었습니다.');
            settingsModal.style.display = 'none';
        }
    }
});


// --- AUTHENTICATION ---
loginBtn.addEventListener('click', () => {
    if (!isFirebaseInitialized) return alert('설정에서 Firebase 구성을 먼저 입력해주세요.');
    login();
});

logoutBtn.addEventListener('click', logout);

async function handleAuthStateChange(user) {
    if (user) {
        currentUser = user;
        userInfo.textContent = `${user.displayName.split(' ')[0]}님`;
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        await loadDataForUser(user.uid);
    } else {
        currentUser = null;
        vocabulary = [];
        userInfo.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        loginBtn.classList.remove('hidden');
    }
}

// --- DATA SYNC ---
async function loadDataForUser(userId) {
    const data = await loadUserData(userId);
    if (data) {
        vocabulary = data.vocabulary || [];
        if (currentBookId && data.progress && data.progress[currentBookId]) {
            currentSentenceIndex = data.progress[currentBookId];
        }
        renderVocabulary();
        if (sentences.length > 0) updateSentenceHighlight();
    }
}

function saveData() {
    if (!currentUser || !currentBookId) return;
    saveUserData(currentUser.uid, {
        vocabulary: vocabulary,
        progress: { [currentBookId]: currentSentenceIndex }
    });
}

// --- PDF & READING LOGIC ---
pdfUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    currentBookId = file.name;
    document.getElementById('upload-container').classList.add('hidden');
    bookContainer.classList.remove('hidden');
    navButtons.classList.remove('hidden');

    const fileReader = new FileReader();
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedarray).promise.then(async pdf => {
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => item.str).join(' ') + ' ';
            }
            sentences = fullText.replace(/([.!?])\s+(?=[A-Z])/g, "$1|").split("|").filter(s => s.trim().length > 5);
            
            if (currentUser) await loadDataForUser(currentUser.uid);
            renderSentences();
        });
    };
    fileReader.readAsArrayBuffer(file);
});

function renderSentences() {
    bookContainer.innerHTML = '';
    sentences.forEach((sentence, index) => {
        const div = document.createElement('div');
        div.className = 'sentence';
        div.dataset.index = index;
        
        // Split sentence into words for interaction
        sentence.trim().split(/\s+/).forEach(word => {
            const span = document.createElement('span');
            span.textContent = word + ' ';
            span.addEventListener('click', (e) => {
                e.stopPropagation();
                handleWordClick(word.replace(/[.,!?;:"'’]+$/, ''), sentence);
            });
            div.appendChild(span);
        });

        div.addEventListener('click', () => {
            currentSentenceIndex = index;
            updateSentenceHighlight();
            showMagicSubtitles(sentence);
        });

        bookContainer.appendChild(div);
    });
    updateSentenceHighlight();
}

function updateSentenceHighlight() {
    const sentenceDivs = document.querySelectorAll('.sentence');
    sentenceDivs.forEach((div, index) => {
        div.classList.remove('highlighted', 'blurred');
        if (index === currentSentenceIndex) {
            div.classList.add('highlighted');
            div.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            div.classList.add('blurred');
        }
    });
    saveData();
}

document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentSentenceIndex > 0) {
        currentSentenceIndex--;
        updateSentenceHighlight();
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentSentenceIndex < sentences.length - 1) {
        currentSentenceIndex++;
        updateSentenceHighlight();
    }
});

// --- INTERACTION LOGIC (Word & Magic Subtitles) ---

async function handleWordClick(word, context) {
    if (!isAIInitialized) return alert("설정에서 Gemini API 키를 입력해주세요.");
    
    currentWord = word;
    switchView('definition');
    interactionModal.style.display = 'block';
    
    document.getElementById('definition-word').textContent = word;
    document.getElementById('definition-text').textContent = "AI가 뜻을 분석 중입니다...";
    
    const definition = await getWordDefinition(word, context);
    document.getElementById('definition-text').textContent = definition;
}

async function showMagicSubtitles(sentence) {
    if (!isAIInitialized) return;
    
    switchView('magic');
    interactionModal.style.display = 'block';
    magicChunkContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 문장을 분석하여 청크로 나누는 중...</p>';
    
    const chunks = await getMagicSubtitles(sentence);
    if (chunks) {
        magicChunkContainer.innerHTML = '';
        chunks.forEach(chunk => {
            const chunkEl = document.createElement('div');
            chunkEl.className = 'magic-chunk';
            chunkEl.innerHTML = `
                <span class="chunk-en">${chunk.en}</span>
                <span class="chunk-ko">${chunk.ko}</span>
            `;
            magicChunkContainer.appendChild(chunkEl);
        });
    } else {
        magicChunkContainer.innerHTML = '<p>분석에 실패했습니다. 다시 시도해주세요.</p>';
    }
}

function switchView(view) {
    if (view === 'definition') {
        definitionView.classList.remove('hidden');
        magicView.classList.add('hidden');
        tabDefinition.classList.add('active-tab');
        tabMagic.classList.remove('active-tab');
        tabDefinition.style.color = 'var(--primary-color)';
        tabMagic.style.color = 'var(--text-muted)';
    } else {
        definitionView.classList.add('hidden');
        magicView.classList.remove('hidden');
        tabMagic.classList.add('active-tab');
        tabDefinition.classList.remove('active-tab');
        tabMagic.style.color = 'var(--primary-color)';
        tabDefinition.style.color = 'var(--text-muted)';
    }
}

tabDefinition.addEventListener('click', () => switchView('definition'));
tabMagic.addEventListener('click', () => {
    const currentSentence = sentences[currentSentenceIndex];
    showMagicSubtitles(currentSentence);
});

// --- VOCAB & QUIZ ---

document.getElementById('add-to-vocab-btn').addEventListener('click', () => {
    if (!currentUser) return alert("로그인이 필요합니다.");
    if (currentWord && !vocabulary.includes(currentWord)) {
        vocabulary.push(currentWord);
        saveData();
        renderVocabulary();
        alert(`'${currentWord}'가 단어장에 추가되었습니다.`);
    }
});

vocabBtn.addEventListener('click', () => {
    if (!currentUser) return alert("로그인이 필요합니다.");
    renderVocabulary();
    vocabModal.style.display = 'block';
});

function renderVocabulary() {
    const vocabList = document.getElementById('vocab-list');
    vocabList.innerHTML = vocabulary.length ? '' : '<li>추가된 단어가 없습니다.</li>';
    vocabulary.forEach(word => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${word}</span>`;
        vocabList.appendChild(li);
    });
}

// ... Quiz Logic remains similar but uses the new modal ...
quizBtn.addEventListener('click', () => quizModal.style.display = 'block');

// Modal Close logic
[...document.querySelectorAll('.close-btn')].forEach(btn => {
    btn.onclick = () => btn.closest('.modal').style.display = 'none';
});
window.onclick = (e) => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; };
