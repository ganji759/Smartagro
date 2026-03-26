import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { PredictionServiceClient, helpers } from '@google-cloud/aiplatform';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();
const visionClient = new ImageAnnotatorClient();
const predictionClient = new PredictionServiceClient();
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const processDiagnosis = functions.firestore
  .document('diagnosis_queue/{jobId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const jobId = context.params.jobId;

    try {
      // 1. Download image (simulated path)
      const bucket = admin.storage().bucket();
      const file = bucket.file(`uploads/${jobId}.jpg`);
      const [content] = await file.download();

      // 2. Vision API Detection
      const [visionResult] = await visionClient.labelDetection({ image: { content } });
      const labels = visionResult.labelAnnotations?.map(l => l.description) || [];

      // 3. Vertex AI Secondary Check (if needed)
      let vertexDiagnosis = null;
      const confidence = visionResult.labelAnnotations?.[0]?.score || 0;
      
      if (confidence < 0.7) {
        const endpoint = `projects/${process.env.GCP_PROJECT}/locations/us-central1/endpoints/${process.env.VERTEX_ENDPOINT_ID}`;
        const instance = { content: content.toString('base64') };
        const [response] = await predictionClient.predict({
          endpoint,
          instances: [helpers.toValue(instance)!],
        });
        vertexDiagnosis = response.predictions?.[0];
      }

      // 4. Gemini Advisory Generation
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        System: You are an expert agronomist for East African smallholders. 
        Context: Crop: ${data.cropType}, Vision Labels: ${labels.join(', ')}, Vertex: ${vertexDiagnosis}.
        Task: Provide a diagnosis and actionable recommendation in Swahili and English.
        Constraint: Keep it under 100 words. Use simple language.
      `;
      
      const result = await model.generateContent(prompt);
      const advisoryText = result.response.text();

      // 5. Write back to Firestore
      await admin.firestore().collection('advisories').add({
        farmerId: data.farmerId,
        cropType: data.cropType,
        diagnosis: labels[0] || 'Unknown Stress',
        recommendation: advisoryText,
        urgency: confidence < 0.5 ? 'high' : 'medium',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // 6. Cleanup queue
      await snapshot.ref.delete();

    } catch (error) {
      console.error("Diagnosis failed:", error);
      await snapshot.ref.update({ status: 'failed', error: error.message });
    }
  });
