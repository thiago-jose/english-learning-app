import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Word: a
    .model({
      word: a.string().required(),
      meaning: a.string().required(),
      usageExample: a.string().required(),
      pronunciation: a.string(),
      difficulty: a.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
      category: a.string(),
      nextReviewDate: a.datetime().required(),
      reviewCount: a.integer().default(0),
      correctCount: a.integer().default(0),
      createdAt: a.datetime().required(),
      userId: a.string().required(),
    })
    .authorization((allow) => [
      allow.owner().to(['read', 'create', 'update', 'delete']),
    ]),

  UserProgress: a
    .model({
      userId: a.string().required(),
      totalWords: a.integer().default(0),
      wordsLearned: a.integer().default(0),
      currentStreak: a.integer().default(0),
      longestStreak: a.integer().default(0),
      lastStudyDate: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner().to(['read', 'create', 'update', 'delete']),
    ]),

  StudySession: a
    .model({
      userId: a.string().required(),
      wordId: a.id().required(),
      wasCorrect: a.boolean().required(),
      responseTime: a.integer(),
      sessionDate: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.owner().to(['read', 'create', 'update', 'delete']),
    ]),
  
  TranscriptionJob: a
    .model({
      id: a.id(),
      jobName: a.string().required(),
      status: a.string().required(),
      audioFileKey: a.string().required(),
      transcriptionText: a.string(),
      languageCode: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});