import { Handler } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

interface ProcessSpeechEvent {
  transcribedText: string;
  userId: string;
}

interface WordData {
  word: string;
  meaning: string;
  usageExample: string;
  pronunciation?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category?: string;
}

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || 'us-east-1',
});

export const handler: Handler<ProcessSpeechEvent> = async (event) => {
  try {
    const { transcribedText, userId } = event;
    
    // Parse the transcribed text to extract the word
    const wordMatch = transcribedText.match(/save (?:this )?word:?\s*(.+)/i);
    if (!wordMatch) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Could not parse word from transcribed text',
          transcribedText,
        }),
      };
    }

    const word = wordMatch[1].trim().toLowerCase();
    
    // Use Bedrock to get word information
    const wordData = await getWordInformation(word);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        wordData: {
          ...wordData,
          userId,
          nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          createdAt: new Date().toISOString(),
        },
      }),
    };
  } catch (error) {
    console.error('Error processing speech:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process speech',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

async function getWordInformation(word: string): Promise<WordData> {
  const prompt = `Please provide information about the English word "${word}" in the following JSON format:
{
  "word": "${word}",
  "meaning": "clear definition in English",
  "usageExample": "a practical sentence using the word",
  "pronunciation": "phonetic pronunciation if available",
  "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
  "category": "noun|verb|adjective|adverb|other"
}

Provide only the JSON response without any additional text.`;

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    contentType: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  try {
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    
    // Parse the JSON response from Claude
    const wordData = JSON.parse(content);
    
    return {
      word: wordData.word || word,
      meaning: wordData.meaning || 'Definition not available',
      usageExample: wordData.usageExample || `Example with ${word} not available`,
      pronunciation: wordData.pronunciation || undefined,
      difficulty: wordData.difficulty || 'INTERMEDIATE',
      category: wordData.category || 'other',
    };
  } catch (error) {
    console.error('Error calling Bedrock:', error);
    // Fallback response
    return {
      word,
      meaning: 'Definition to be added',
      usageExample: `I need to learn more about the word ${word}.`,
      difficulty: 'INTERMEDIATE',
    };
  }
}