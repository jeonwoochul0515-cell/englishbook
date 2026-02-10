import { GoogleGenerativeAI } from '@google/generative-ai';

// IMPORTANT: Securely manage your API key. Do not hardcode it in the source code.
// Use environment variables. We will set this up in the next step.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { sentence } = await request.json();

    if (!sentence) {
      return new Response(JSON.stringify({ error: 'Sentence is required.' }), { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      From the following sentence, select one word that would be challenging for a middle school student (CEFR B2 level or higher). 
      Return the result as a JSON object with two keys: "word" and "meaning".
      The "word" should be the selected English word.
      The "meaning" should be its Korean translation.

      Sentence: "${sentence}"

      JSON Response:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    
    // Parse the JSON string from the model's response
    const jsonResponse = JSON.parse(text);

    return new Response(JSON.stringify(jsonResponse), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in Gemini API route:', error);
    return new Response(JSON.stringify({ error: 'Failed to process the request.', details: error.message }), { status: 500 });
  }
}
