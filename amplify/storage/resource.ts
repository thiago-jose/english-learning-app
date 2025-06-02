import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'englishLearningStorage',
  access: (allow) => ({
    'audio-files/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'user-recordings/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  })
});