import { initAI, getWordDefinition, generateComprehensionQuiz } from './ai.js';
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

// Modals & Controls
const definitionModal = document.getElementById('definition-modal');
const vocabModal = document.getElementById('vocab-modal');
const quizModal = document.getElementById('quiz-modal');
const settingsModal = document.getElementById('settings-modal');

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
        if(isAIInitialized) console.log("AI Initialized from storage.");
    }

    if (firebaseConfig) {
        document.getElementById('firebase-config-input').value = firebaseConfig;
        isFirebaseInitialized = initFirebase(firebaseConfig, handleAuthStateChange);
        if(isFirebaseInitialized) console.log("Firebase Initialized from storage.");
    }
});

// --- SETTINGS --- 
settingsBtn.addEventListener('click', () => settingsModal.style.display = 'block');
document.querySelector('#settings-modal .close-btn').addEventListener('click', () => settingsModal.style.display = 'none');

document.getElementById('api-key-submit').addEventListener('click', () => {
    const apiKey = document.getElementById('api-key-input').value.trim();
    if (apiKey) {
        isAIInitialized = initAI(apiKey);
        if (isAIInitialized) {
            localStorage.setItem('geminiApiKey', apiKey);
            alert('Gemini AI가 성공적으로 초기화되었습니다.');
        } else {
            alert('AI 초기화에 실패했습니다. API 키를 확인해주세요.');
        }
    }
});

document.getElementById('firebase-config-submit').addEventListener('click', () => {
    const config = document.getElementById('firebase-config-input').value.trim();
    if (config) {
        isFirebaseInitialized = initFirebase(config, handleAuthStateChange);
        if (isFirebaseInitialized) {
            localStorage.setItem('firebaseConfig', config);
            alert('Firebase가 성공적으로 초기화되었습니다.');
        } else {
            alert('Firebase 초기화에 실패했습니다. 구성 정보를 확인해주세요.');
        }
    }
});


// --- AUTHENTICATION ---
loginBtn.addEventListener('click', () => {
    if (!isFirebaseInitialized) {
        alert('Firebase가 설정되지 않았습니다. 설정 메뉴에서 구성 정보를 입력해주세요.');
        return;
    }
    login().catch(err => console.error("Login failed:", err));
});

logoutBtn.addEventListener('click', () => {
    logout().catch(err => console.error("Logout failed:", err));
});

async function handleAuthStateChange(user) {
    if (user) {
        console.log("User logged in:", user.displayName);
        currentUser = user;
        userInfo.textContent = `환영합니다, ${user.displayName.split(' ')[0]}님`;
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        
        await loadDataForUser(user.uid);

    } else {
        console.log("User logged out.");
        currentUser = null;
        vocabulary = [];
        currentSentenceIndex = 0;
        userInfo.textContent = '';
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        renderVocabulary();
        if (sentences.length > 0) updateSentenceHighlight();
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
    } else {
        vocabulary = [];
        currentSentenceIndex = 0;
    }
    renderVocabulary();
    if (sentences.length > 0) updateSentenceHighlight();
}

function saveData() {
    if (!currentUser) return;
    const dataToSave = {
        vocabulary: vocabulary,
        progress: { [currentBookId]: currentSentenceIndex }
    };
    saveUserData(currentUser.uid, dataToSave);
}

// --- PDF & READING LOGIC ---
pdfUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') return alert('PDF 파일만 업로드할 수 있습니다.');
    
    currentBookId = file.name; // Use filename as book ID
    document.getElementById('upload-container').style.display = 'none';
    navButtons.classList.remove('hidden');

    const fileReader = new FileReader();
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedarray).promise.then(async pdf => {
            const fullText = await getAllText(pdf);
            sentences = fullText.replace(/([.!?])\s*(?=[A-Z])/g, "$1|").split("|").filter(s => s.trim().length > 0);
            
            // Reset index and load progress if available
            currentSentenceIndex = 0;
            if (currentUser) {
                await loadDataForUser(currentUser.uid); 
            }
            
            renderSentences();
        });
    };
    fileReader.readAsArrayBuffer(file);
});

async function getAllText(pdf) {
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ') + '\n';
    }
    return fullText;
}

function renderSentences() {
    bookContainer.innerHTML = '';
    sentences.forEach((sentence, index) => {
        const sentenceSpan = document.createElement('div');
        sentenceSpan.className = 'sentence';
        
        sentence.trim().split(/\s+/).forEach(word => {
            if (word) {
                const wordSpan = document.createElement('span');
                wordSpan.textContent = word + ' ';
                wordSpan.addEventListener('mousedown', onWordMouseDown);
                wordSpan.addEventListener('mouseup', onWordMouseUp);
                wordSpan.addEventListener('touchstart', onWordMouseDown, {passive: true});
                wordSpan.addEventListener('touchend', onWordMouseUp);
                sentenceSpan.appendChild(wordSpan);
            }
        });
        bookContainer.appendChild(sentenceSpan);
    });
    updateSentenceHighlight();
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

function updateSentenceHighlight() {
    const sentenceSpans = document.querySelectorAll('.sentence');
    sentenceSpans.forEach((span, index) => {
        span.classList.remove('highlighted', 'blurred');
        if (index === currentSentenceIndex) {
            span.classList.add('highlighted');
            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            span.classList.add('blurred');
        }
    });
    saveData(); // Save progress on each navigation
}


// --- VOCAB & QUIZ LOGIC (with modifications for Firebase) ---

function onWordMouseDown(event) {
    clearTimeout(pressTimer);
    currentWord = event.target.textContent.trim().replace(/[.,!?;:"\'’]+$/, '');
    pressTimer = window.setTimeout(() => {
        if (!isAIInitialized) return alert("AI가 초기화되지 않았습니다. 설정에서 API 키를 입력해주세요.");
        const contextSentence = event.target.closest('.sentence').textContent;
        showDefinition(currentWord, contextSentence);
    }, 1200);
}

function onWordMouseUp() {
    clearTimeout(pressTimer);
}

async function showDefinition(word, context) {
    const defModal = document.getElementById('definition-modal');
    document.getElementById('definition-word').textContent = word;
    document.getElementById('definition-text').textContent = 'AI가 단어의 뜻을 생성 중입니다...';
    defModal.style.display = 'block';

    const definition = await getWordDefinition(word, context);
    document.getElementById('definition-text').textContent = definition;
}

document.getElementById('add-to-vocab-btn').addEventListener('click', () => {
    if (!currentUser) return alert("단어장을 사용하려면 로그인해야 합니다.");
    const btn = document.getElementById('add-to-vocab-btn');
    if (currentWord && !vocabulary.includes(currentWord)) {
        vocabulary.push(currentWord);
        saveData();
        renderVocabulary();
        btn.textContent = '추가 완료!';
    } else {
        btn.textContent = '이미 추가됨';
    }
    setTimeout(() => { 
        btn.textContent = '단어장에 추가'; 
        document.getElementById('definition-modal').style.display = 'none';
    }, 1000);
});

vocabBtn.addEventListener('click', () => {
    if (!currentUser) return alert("단어장을 보려면 로그인해야 합니다.");
    vocabModal.style.display = 'block';
});

function renderVocabulary() {
    vocabList.innerHTML = '';
    if (vocabulary.length === 0) {
        vocabList.innerHTML = '<li>단어장에 단어가 없습니다.</li>';
        return;
    }
    vocabulary.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        vocabList.appendChild(li);
    });
}

// Quiz Logic (remains largely the same, but benefits from synced vocab)
quizBtn.addEventListener('click', () => {
    quizModal.style.display = 'block';
    document.getElementById('quiz-options').style.display = 'block';
    document.getElementById('quiz-container').innerHTML = '';
});

document.getElementById('vocab-quiz-btn').addEventListener('click', () => {
    if (!currentUser) return alert("퀴즈를 풀려면 로그인해야 합니다.");
    document.getElementById('quiz-options').style.display = 'none';
    startVocabQuiz();
});

document.getElementById('comprehension-quiz-btn').addEventListener('click', () => {
    if (!isAIInitialized) return alert("AI 퀴즈를 생성하려면 API 키가 필요합니다.");
    document.getElementById('quiz-options').style.display = 'none';
    startComprehensionQuiz();
});

function startVocabQuiz() {
    const quizContainer = document.getElementById('quiz-container');
    if (vocabulary.length < 4) {
        quizContainer.innerHTML = '<p>단어 퀴즈를 만들려면 단어장에 4개 이상의 단어가 필요합니다.</p>';
        return;
    }    
    // ... (rest of vocab quiz logic is the same)
}

async function startComprehensionQuiz() {
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = '<p>AI가 읽은 내용을 바탕으로 퀴즈를 생성 중입니다...</p>';
    const context = sentences.slice(Math.max(0, currentSentenceIndex - 10), currentSentenceIndex + 1).join(' ');
    const quizData = await generateComprehensionQuiz(context);
    if (quizData) renderComprehensionQuiz(quizData);
    else quizContainer.innerHTML = '<p>퀴즈 생성에 실패했습니다. 다시 시도해주세요.</p>';
}

// ... (render/check functions for quizzes remain the same) ...

// --- MODAL CLOSE LOGIC ---
[...document.querySelectorAll('.modal .close-btn')].forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none');
});
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Placeholder functions from previous version that need to be filled or connected
function checkVocabAnswer(selected, correct) {
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = '';
    const resultEl = document.createElement('p');
    if (selected === correct) {
        resultEl.textContent = '정답입니다! 🎉';
        resultEl.style.color = 'green';
    } else {
        resultEl.textContent = `오답입니다. 정답은 \"${correct}\" 입니다.`;
        resultEl.style.color = 'red';
    }
    quizContainer.appendChild(resultEl);
    
    const nextButton = document.createElement('button');
    nextButton.textContent = '다른 문제 풀기';
    nextButton.onclick = startVocabQuiz;
    quizContainer.appendChild(nextButton);
}

function renderComprehensionQuiz(quizData) {
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = '';

    const questionEl = document.createElement('div');
    questionEl.innerHTML = `<p>${quizData.question}</p>`;

    const optionsEl = document.createElement('div');
    quizData.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => checkComprehensionAnswer(option, quizData.answer);
        optionsEl.appendChild(button);
    });

    quizContainer.appendChild(questionEl);
    quizContainer.appendChild(optionsEl);
}

function checkComprehensionAnswer(selected, correctAnswer) {
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = '';
    const resultEl = document.createElement('p');
    if (selected === correctAnswer) {
        resultEl.textContent = '정답입니다! 🎉';
        resultEl.style.color = 'green';
    } else {
        resultEl.textContent = `오답입니다. 정답은 \"${correctAnswer}\" 입니다.`;
        resultEl.style.color = 'red';
    }
    quizContainer.appendChild(resultEl);

    const backButton = document.createElement('button');
    backButton.textContent = '퀴즈 선택으로 돌아가기';
    backButton.onclick = () => {
        document.getElementById('quiz-options').style.display = 'block';
        quizContainer.innerHTML = '';
    };
    quizContainer.appendChild(backButton);
}