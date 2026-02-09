
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

let genAI;
let model;

export function initAI(apiKey) {
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        return true;
    } catch (error) {
        console.error("AI Init Error:", error);
        return false;
    }
}

export async function getWordDefinition(word, context) {
    if (!model) return "AI가 초기화되지 않았습니다.";
    const prompt = `Translate the English word "${word}" in the following context: "${context}". 
    Provide the most accurate Korean meaning and a very brief explanation or example if possible. 
    Format: [Meaning] (short explanation)`;
    
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Definition Error:", error);
        return "뜻을 가져오는 중 오류가 발생했습니다.";
    }
}

/**
 * Magic Subtitles 로직: 문장을 청크(Chunk) 단위로 나누고 번역합니다.
 */
export async function getMagicSubtitles(sentence) {
    if (!model) return null;
    const prompt = `Analyze the following English sentence and break it down into meaningful chunks for a language learner. 
    For each chunk, provide its Korean translation that follows the English word order (direct translation).
    Sentence: "${sentence}"
    Return the result ONLY as a JSON array of objects, like this: 
    [{"en": "The rabbit-hole", "ko": "그 토끼 구멍은"}, {"en": "went straight on", "ko": "곧장 이어졌다"}]`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Extract JSON from potential markdown code blocks
        const jsonMatch = text.match(/\[.*\]/s);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
        console.error("Magic Subtitles Error:", error);
        return null;
    }
}

export async function generateComprehensionQuiz(context) {
    if (!model) return null;
    const prompt = `Based on the following text, create a multiple-choice comprehension question in Korean.
    Text: "${context}"
    Return the result ONLY as a JSON object:
    {"question": "질문", "options": ["옵션1", "옵션2", "옵션3", "옵션4"], "answer": "정답인 옵션"}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{.*\}/s);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
        console.error("Quiz Generation Error:", error);
        return null;
    }
}
