import * as fs from 'fs';
import * as path from 'path';
import outputs from '../amplify_outputs.json';

const envFilePath = path.resolve(__dirname, '../.env');

const storageBucketName = outputs.storage?.bucket_name;
const awsRegion = outputs.auth?.aws_region;

console.log('Reading from amplify_outputs.json:', {
  storageBucketName,
  awsRegion
});

if (!storageBucketName || !awsRegion) {
  console.error('Error: Missing required environment variables in amplify_outputs.json');
  process.exit(1);
}

const envContent = `EXPO_PUBLIC_STORAGE_BUCKET_NAME=${storageBucketName}\nEXPO_PUBLIC_AWS_REGION=${awsRegion}`;

console.log('Writing to .env:', envContent);

fs.writeFileSync(envFilePath, envContent);
console.log('Successfully generated .env'); 