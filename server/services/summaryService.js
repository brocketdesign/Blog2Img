// summaryService.js
require('dotenv').config();
const { OpenAI } = require('openai');
const MongoClient = require('mongodb').MongoClient;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const mongoClient = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const summaryService = {
    /**
     * Generates a summary of the provided article content.
     * @param {string} articleContent The content of the article to summarize.
     * @returns {Promise<string>} A promise that resolves to the summary of the article.
     */
    generateSummary: async function(articleContent) {
        try {
            const summary = await this.summarizeWithAI(articleContent);
            return summary;
        } catch (error) {
            console.error('Error in generateSummary:', error);
            throw error; // Re-throw the error for the caller to handle
        }
    },

    summarizeWithAI: async function(articleContent) {
        try {
            // Connect to MongoDB
            await mongoClient.connect();
            const db = mongoClient.db(process.env.MONGODB_DATABASE);
            const summariesCollection = db.collection('summaries');
    
            // Check if a summary already exists
            const existingSummary = await summariesCollection.findOne({ articleContent: articleContent });
            if (existingSummary) {
                return existingSummary.summary;
            }
    
            let summary;
            const maxAttempts = 3;
    
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                // Generate the summary using OpenAI's GPT-3
                const response = await openai.completions.create({
                    model: "gpt-3.5-turbo-instruct",
                    prompt: this.generatePrompt(articleContent),
                    max_tokens: 100 // Adjust token limit as needed
                });

                summary = findTheArray(response.choices[0].text.trim());
    
                // If an array is found, break the loop
                if (summary) {
                    break;
                }
            }
    
            // If no valid summary found after all attempts, handle accordingly
            if (!summary) {
                throw new Error('Failed to generate a valid summary after multiple attempts.');
                return
            }
    
            // Save the new summary to MongoDB
            await summariesCollection.insertOne({ articleContent: articleContent, summary: summary });
    
            return summary;
        } catch (error) {
            console.error('Error in summarizeWithAI:', error);
            throw error;
        } finally {
            // Close the MongoDB connection
            await mongoClient.close();
        }
    },    

    generatePrompt: function(articleContent) {
        // Function to generate the prompt for GPT-3 based on the article content
        return `You will act as a image prompt generator. I will provide you a description and you will generate ONLY ONE prompt for the image generation as a JAVASCRIPT ARRAY containing the image prompt.\n\n${articleContent}`;
    },
};

function findTheArray(summary){
  const arrayString = summary.substring(
    summary.indexOf('['),
    summary.lastIndexOf(']') + 1
  );

  try {
    const array = JSON.parse(arrayString);
    return array
  } catch (error) {
    return false
  }
}
module.exports = summaryService;
