
// DOM Elements
export const pdfUpload = document.getElementById('pdf-upload');
export const bookContainer = document.getElementById('book-container');
export const navButtons = document.getElementById('nav-buttons');
export const vocabBtn = document.getElementById('vocab-btn');
export const quizBtn = document.getElementById('quiz-btn');
export const settingsBtn = document.getElementById('settings-btn');
export const loginBtn = document.getElementById('login-btn');
export const logoutBtn = document.getElementById('logout-btn');
export const userInfo = document.getElementById('user-info');

// Modals
export const interactionModal = document.getElementById('interaction-modal');
export const vocabModal = document.getElementById('vocab-modal');
export const quizModal = document.getElementById('quiz-modal');
export const settingsModal = document.getElementById('settings-modal');

// Modal Content Elements
const definitionView = document.getElementById('definition-view');
const magicView = document.getElementById('magic-view');
const tabDefinition = document.getElementById('tab-definition');
const tabMagic = document.getElementById('tab-magic');
const magicChunkContainer = document.getElementById('magic-chunk-container');


export function renderSentences(sentences, wordClickHandler, sentenceClickHandler) {
    bookContainer.innerHTML = '';
    sentences.forEach((sentence, index) => {
        const div = document.createElement('div');
        div.className = 'sentence';
        div.dataset.index = index;
        
        sentence.trim().split(/\s+/).forEach(word => {
            const span = document.createElement('span');
            span.textContent = word + ' ';
            span.addEventListener('click', (e) => {
                e.stopPropagation();
                wordClickHandler(word.replace(/[.,!?;:"'’]+$/, ''), sentence);
            });
            div.appendChild(span);
        });

        div.addEventListener('click', () => sentenceClickHandler(sentence, index));
        bookContainer.appendChild(div);
    });
}

export function updateSentenceHighlight(currentIndex) {
    const sentenceDivs = document.querySelectorAll('.sentence');
    sentenceDivs.forEach((div, index) => {
        div.classList.remove('highlighted', 'blurred');
        if (index === currentIndex) {
            div.classList.add('highlighted');
            div.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            div.classList.add('blurred');
        }
    });
}

export function showDefinition(word, definition) {
    document.getElementById('definition-word').textContent = word;
    document.getElementById('definition-text').textContent = definition;
}

export function showMagicSubtitles(chunks) {
    magicChunkContainer.innerHTML = '';
    if (chunks) {
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

export function switchInteractionView(view) {
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

export function renderVocabulary(vocabulary) {
    const vocabList = document.getElementById('vocab-list');
    vocabList.innerHTML = vocabulary.length ? '' : '<li>추가된 단어가 없습니다.</li>';
    vocabulary.forEach(word => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${word}</span>`;
        vocabList.appendChild(li);
    });
}

export function setupModalCloseButtons() {
    [...document.querySelectorAll('.close-btn')].forEach(btn => {
        btn.onclick = () => btn.closest('.modal').style.display = 'none';
    });
    window.onclick = (e) => { 
        if (e.target.classList.contains('modal')) e.target.style.display = 'none'; 
    };
}

export function updateAuthStateUI(user) {
    if (user) {
        userInfo.textContent = `${user.displayName.split(' ')[0]}님`;
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
    } else {
        userInfo.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        loginBtn.classList.remove('hidden');
    }
}

export function showLoadingState(view, word) {
    interactionModal.style.display = 'block';
    if (view === 'definition') {
        switchInteractionView('definition');
        showDefinition(word, "AI가 뜻을 분석 중입니다...");
    } else { // magic
        switchInteractionView('magic');
        magicChunkContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 문장을 분석하여 청크로 나누는 중...</p>';
    }
}

export function toggleMainView(isPdfLoaded) {
    if (isPdfLoaded) {
        document.getElementById('upload-container').classList.add('hidden');
        bookContainer.classList.remove('hidden');
        navButtons.classList.remove('hidden');
    } else {
        // ... can be extended to show upload container again
    }
}
