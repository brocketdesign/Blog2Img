// catchphraseService.js
require('dotenv').config();
const { OpenAI } = require('openai');
const MongoClient = require('mongodb').MongoClient;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const mongoClient = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const axios = require('axios');

const catchphraseService = {
    generatePrompts: async function(summarizedArticle) {
        try {
            const prompts = await this.createPromptsFromSummary(summarizedArticle);
            return prompts;
        } catch (error) {
            console.error('Error in generatePrompts:', error);
            throw error;
        }
    },

    createPromptsFromSummary: async function(summary) {
        try {
            // Connect to MongoDB
            await mongoClient.connect();
            const db = mongoClient.db(process.env.MONGODB_DATABASE);
            const promptsCollection = db.collection('prompts');

            // Check if prompts for this summary already exist
            const existingPrompts = await promptsCollection.findOne({ summary: summary });
            if (existingPrompts &&  existingPrompts.prompts.length > 0) {
                //return existingPrompts.prompts;
            }

            // Logic to create prompts from the summary
            const prompts = await this.generatePromptsLogic(summary);

            // Save the new prompts to MongoDB
            await promptsCollection.updateOne(
                { summary: summary }, // Filter object: find a document with this summary
                { $set: { prompts: prompts } }, // Update object: set the prompts field
                { upsert: true } // Upsert option: insert a new document if no matching document is found
            );
            
            return prompts;
        } catch (error) {
            console.error('Error in createPromptsFromSummary:', error);
            throw error;
        } finally {
            // Close the MongoDB connection
            await mongoClient.close();
        }
    },

    generatePromptsLogic: async function(summaries) {
        let generatedPrompts = [];
        for (const summary of summaries) {
            try {
                let data = JSON.stringify({"inputs": summary });
                  
                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: 'https://api-inference.huggingface.co/models/Ar4ikov/gpt2-650k-stable-diffusion-prompt-generator',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': "Bearer "+process.env.HUGGINGFACE_API 
                    },
                    data : data
                };
                console.log(`Generate prompt for : ${summary}`)
                const response = await axios.request(config)
                          
                // Add the generated prompt for each summary to the array
                generatedPrompts.push(response.data[0].generated_text);
            } catch (error) {
                console.error('Error in generatePromptsLogic for summary:', summary, error);
                // Optionally handle the error for each summary, e.g., by continuing with the next one
            }
        }
    
        return generatedPrompts;
    },
    
};
async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/succinctly/text2image-prompt-generator",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}
module.exports = catchphraseService;
