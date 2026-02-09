import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

let genAI;

export function initAI(apiKey) {
    if (!apiKey) {
        console.error("API key is required to initialize AI.");
        return false;
    }
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        return true;
    } catch (error) {
        console.error("Error initializing AI:", error);
        return false;
    }
}

export async function getWordDefinition(word, contextSentence) {
    if (!genAI) {
        return "AI is not initialized. Please enter your API key.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro"});
        const prompt = `다음 문장에서 "${word}"라는 단어의 뜻을 한국어로 설명해줘. 학생도 이해할 수 있도록 쉽고 간결하게, 그리고 원래 문장의 문맥을 고려해서 설명해줘.\n\n문장: "${contextSentence}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        return text;
    } catch (error) {
        console.error("Error getting definition:", error);
        return "단어의 뜻을 가져오는 데 실패했습니다. 다시 시도해주세요.";
    }
}

export async function generateComprehensionQuiz(contextSentences) {
    if (!genAI) {
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `다음 영어 본문 내용은 책의 일부입니다. 이 내용에 대해 사용자의 이해도를 테스트할 수 있는 객관식 질문 1개를 만들어 주세요. 질문과 선택지는 모두 한국어로 작성해주세요. 정답이 1개인 4개의 선택지를 제공해야 합니다. 가장 중요한 핵심 내용을 질문하는 퀴즈를 만들어 주세요.

반드시 다음 JSON 형식을 정확히 따라서 응답해주세요:
{
  "question": "여기에 질문을 작성하세요",
  "options": [
    "선택지 1",
    "선택지 2",
    "선택지 3",
    "선택지 4"
  ],
  "answer": "정답 선택지"
}

---
영어 본문:
${contextSentences}
---
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        
        // Clean the response and parse JSON
        const jsonString = text.match(/\{.*\}/s)[0];
        const quizData = JSON.parse(jsonString);
        return quizData;

    } catch (error) {
        console.error("Error generating comprehension quiz:", error);
        return null;
    }
}
