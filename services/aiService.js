const {GoogleGenAI}=require('@google/genai');

const ai=new GoogleGenAI({
    apiKey:process.env.GEMINI_API_KEY
});


async function getCategory(description){

 const prompt = `
You are an expense classifier.

Choose exactly ONE category from this list:

Food
Travel
Shopping
Entertainment
Bills
Health
Education
Salary
Investment
Other

Expense Description:
"${description}"

Rules:
- Reply with ONLY one word.
- Do not explain.
- Do not use punctuation.
- Never create a new category.
`;

const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt
});



return response.text.trim();
}

module.exports={
    getCategory
};