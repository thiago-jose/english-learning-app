import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand, LanguageCode } from '@aws-sdk/client-transcribe';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
const transcribeClient = new TranscribeClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });
export const handler = async (event) => {
    console.log('Received transcription event:', JSON.stringify(event, null, 2));
    try {
        // Validate environment variables
        validateEnvironment();
        switch (event.action) {
            case 'start':
                return await startTranscriptionJob(event);
            case 'status':
                return await getTranscriptionJobStatus(event);
            case 'process':
                return await processTranscriptionResult(event);
            default:
                throw new Error(`Unsupported action: ${event.action}`);
        }
    }
    catch (error) {
        console.error('Error processing transcription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};
function validateEnvironment() {
    const required = ['AWS_REGION', 'STORAGE_BUCKET_NAME'];
    const missing = required.filter(env => !process.env[env]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
// Validate and convert language code
const getLanguageCode = (langCode) => {
    // Check if the provided language code is valid
    if (Object.values(LanguageCode).includes(langCode)) {
        return langCode;
    }
    // Default to English if invalid language code is provided
    console.warn(`Invalid language code: ${langCode}, defaulting to en-US`);
    return LanguageCode.EN_US;
};
async function startTranscriptionJob(event) {
    const { audioFileKey, jobName, languageCode = 'en-US', speakerLabels = true, maxSpeakers = 2, userId } = event;
    if (!audioFileKey || !jobName) {
        throw new Error('audioFileKey and jobName are required');
    }
    const bucketName = process.env.STORAGE_BUCKET_NAME;
    const mediaUri = `s3://${bucketName}/${audioFileKey}`;
    // Generate unique job name with timestamp and user ID
    const uniqueJobName = `${jobName}-${Date.now()}-${userId || 'anonymous'}`;
    const params = {
        TranscriptionJobName: uniqueJobName,
        LanguageCode: getLanguageCode(languageCode),
        Media: {
            MediaFileUri: mediaUri,
        },
        OutputBucketName: bucketName,
        OutputKey: `transcriptions/${uniqueJobName}.json`,
        Settings: {
            ShowSpeakerLabels: speakerLabels,
            MaxSpeakerLabels: maxSpeakers,
            ShowAlternatives: true,
            MaxAlternatives: 3,
        },
    };
    try {
        const command = new StartTranscriptionJobCommand(params);
        const result = await transcribeClient.send(command);
        // Log job creation for monitoring
        await logTranscriptionEvent('job_started', {
            jobName: uniqueJobName,
            userId,
            audioFileKey,
            languageCode,
        });
        return {
            success: true,
            jobName: result.TranscriptionJob?.TranscriptionJobName,
            status: result.TranscriptionJob?.TranscriptionJobStatus,
        };
    }
    catch (error) {
        console.error('Error starting transcription job:', error);
        await logTranscriptionEvent('job_start_failed', {
            jobName: uniqueJobName,
            userId,
            audioFileKey,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}
async function getTranscriptionJobStatus(event) {
    const { jobName } = event;
    if (!jobName) {
        throw new Error('jobName is required');
    }
    try {
        const command = new GetTranscriptionJobCommand({
            TranscriptionJobName: jobName,
        });
        const result = await transcribeClient.send(command);
        const job = result.TranscriptionJob;
        let transcriptionText = undefined;
        let speakerLabels = [];
        // If completed, fetch the actual transcription text and speaker labels
        if (job?.TranscriptionJobStatus === 'COMPLETED' && job.Transcript?.TranscriptFileUri) {
            const transcriptData = await fetchTranscriptionText(job.Transcript.TranscriptFileUri);
            transcriptionText = transcriptData?.transcript || undefined;
            speakerLabels = transcriptData?.speakerLabels || [];
            // Log successful completion
            await logTranscriptionEvent('job_completed', {
                jobName,
                transcriptionLength: transcriptionText?.length || 0,
            });
        }
        else if (job?.TranscriptionJobStatus === 'FAILED') {
            // Log failure
            await logTranscriptionEvent('job_failed', {
                jobName,
                failureReason: job.FailureReason,
            });
        }
        return {
            success: true,
            jobName: job?.TranscriptionJobName,
            status: job?.TranscriptionJobStatus,
            transcriptionText,
            transcriptFileUri: job?.Transcript?.TranscriptFileUri,
            creationTime: job?.CreationTime,
            completionTime: job?.CompletionTime,
            speakerLabels,
        };
    }
    catch (error) {
        console.error('Error getting transcription job status:', error);
        throw error;
    }
}
async function processTranscriptionResult(event) {
    const { jobName, userId } = event;
    if (!jobName) {
        throw new Error('jobName is required');
    }
    try {
        // Get the job status first
        const statusResult = await getTranscriptionJobStatus(event);
        if (statusResult.status === 'COMPLETED' && statusResult.transcriptionText) {
            // Process the transcription (e.g., clean up text, extract insights)
            const processedTranscription = await processTranscriptionText(statusResult.transcriptionText, statusResult.speakerLabels || []);
            // Save processed transcription to S3
            await saveProcessedTranscription(jobName, processedTranscription, userId);
            // Log processing completion
            await logTranscriptionEvent('processing_completed', {
                jobName,
                userId,
                wordCount: processedTranscription.wordCount,
                speakerCount: processedTranscription.speakerCount,
            });
            return {
                success: true,
                jobName: statusResult.jobName,
                status: statusResult.status,
                transcriptionText: processedTranscription.cleanedText,
                speakerLabels: processedTranscription.speakerSegments,
            };
        }
        return {
            success: false,
            error: 'Transcription job not completed or failed',
            status: statusResult.status,
            jobName: statusResult.jobName,
        };
    }
    catch (error) {
        console.error('Error processing transcription result:', error);
        throw error;
    }
}
async function fetchTranscriptionText(transcriptFileUri) {
    try {
        // Parse S3 URI to get bucket and key
        const s3UriMatch = transcriptFileUri.match(/s3:\/\/([^/]+)\/(.+)/);
        if (!s3UriMatch) {
            console.error('Invalid S3 URI format:', transcriptFileUri);
            return null;
        }
        const [, bucketName, key] = s3UriMatch;
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        const response = await s3Client.send(command);
        const transcriptData = await response.Body?.transformToString();
        if (!transcriptData) {
            return null;
        }
        const transcript = JSON.parse(transcriptData);
        // Extract the transcript text and speaker labels
        const transcriptText = transcript.results?.transcripts?.[0]?.transcript || '';
        const speakerLabels = transcript.results?.speaker_labels?.segments || [];
        return {
            transcript: transcriptText,
            speakerLabels,
        };
    }
    catch (error) {
        console.error('Error fetching transcription text:', error);
        return null;
    }
}
async function processTranscriptionText(text, speakerLabels) {
    // Clean up the transcription text
    const cleanedText = text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Ensure proper spacing after punctuation
        .trim();
    // Extract speaker segments
    const speakerSegments = speakerLabels.map(segment => ({
        speaker: segment.speaker_label,
        startTime: parseFloat(segment.start_time),
        endTime: parseFloat(segment.end_time),
        items: segment.items || [],
    }));
    // Calculate statistics
    const wordCount = cleanedText.split(/\s+/).length;
    const speakerCount = new Set(speakerLabels.map(s => s.speaker_label)).size;
    return {
        cleanedText,
        speakerSegments,
        wordCount,
        speakerCount,
        processingDate: new Date().toISOString(),
    };
}
async function saveProcessedTranscription(jobName, processedData, userId) {
    const bucketName = process.env.STORAGE_BUCKET_NAME;
    const key = `processed-transcriptions/${jobName}-processed.json`;
    const dataToSave = {
        ...processedData,
        jobName,
        userId,
        savedAt: new Date().toISOString(),
    };
    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: JSON.stringify(dataToSave, null, 2),
            ContentType: 'application/json',
        });
        await s3Client.send(command);
        console.log(`Processed transcription saved to S3: ${key}`);
    }
    catch (error) {
        console.error('Error saving processed transcription:', error);
        // Don't throw error here as it's not critical for the main flow
    }
}
async function logTranscriptionEvent(eventType, eventData) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        eventType,
        data: eventData,
    };
    console.log('Transcription Event:', JSON.stringify(logEntry));
    // Optionally save to S3 for audit trail
    try {
        const bucketName = process.env.STORAGE_BUCKET_NAME;
        const key = `transcription-logs/${new Date().toISOString().split('T')[0]}/${Date.now()}-${eventType}.json`;
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: JSON.stringify(logEntry, null, 2),
            ContentType: 'application/json',
        });
        await s3Client.send(command);
    }
    catch (error) {
        console.error('Error saving log entry:', error);
        // Don't throw error for logging failures
    }
}
