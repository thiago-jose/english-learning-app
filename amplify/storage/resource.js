import { defineStorage } from '@aws-amplify/backend';
export const storage = defineStorage({
    name: 'transcriptionStorage',
    access: (allow) => ({
        'audio-files/*': [
            allow.authenticated.to(['read', 'write', 'delete']),
        ],
        'transcriptions/*': [
            allow.authenticated.to(['read', 'write']),
        ],
    })
});
