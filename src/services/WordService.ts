import { post } from 'aws-amplify/api';

interface WordData {
  word: string;
  meaning: string;
  usageExample: string;
  pronunciation?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category?: string;
  nextReviewDate: string;
  createdAt: string;
}

class WordService {
  static async processSpeechInput(
    transcribedText: string,
    userId: string
  ): Promise<WordData | null> {
    try {
      // For now, we'll process the text locally
      // Later, this will call the Lambda function
      const wordMatch = transcribedText.match(/save (?:this )?word:?\s*(.+)/i);
      
      if (!wordMatch) {
        throw new Error('Could not parse word from transcribed text');
      }

      const word = wordMatch[1].trim().toLowerCase();
      
      // Mock word data - in production, this would come from the Lambda function
      // that calls Bedrock for word information
      const mockWordData: WordData = {
        word: word,
        meaning: `Definition of ${word}`,
        usageExample: `Example sentence using the word "${word}".`,
        pronunciation: `/${word}/`,
        difficulty: 'INTERMEDIATE',
        category: 'general',
        nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return mockWordData;
      
      // TODO: Uncomment this when Lambda function is deployed
      /*
      const response = await post({
        apiName: 'englishlearningapp',
        path: '/process-speech',
        options: {
          body: {
            transcribedText,
            userId,
          },
        },
      });

      const result = await response.response;
      const data = await result.body.json();
      
      if (data.success) {
        return data.wordData;
      } else {
        throw new Error(data.error || 'Failed to process speech');
      }
      */
    } catch (error) {
      console.error('Error in processSpeechInput:', error);
      throw error;
    }
  }

  static async getSpacedRepetitionWords(userId: string): Promise<WordData[]> {
    // This will be implemented later for Alexa integration
    // It should return words that are due for review based on spaced repetition algorithm
    return [];
  }

  static calculateNextReviewDate(
    currentDate: Date,
    reviewCount: number,
    wasCorrect: boolean
  ): Date {
    // Simple spaced repetition algorithm
    // Similar to Anki's algorithm but simplified
    let interval = 1; // days
    
    if (reviewCount === 0) {
      interval = 1;
    } else if (reviewCount === 1) {
      interval = wasCorrect ? 6 : 1;
    } else {
      const previousInterval = Math.pow(2, reviewCount - 1);
      interval = wasCorrect ? previousInterval * 2.5 : 1;
    }
    
    const nextReviewDate = new Date(currentDate);
    nextReviewDate.setDate(nextReviewDate.getDate() + Math.round(interval));
    
    return nextReviewDate;
  }
}

export default WordService;