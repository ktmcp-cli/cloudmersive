import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { getConfig } from './config.js';

const BASE_URL = 'https://api.cloudmersive.com';

function getApiKey() {
  const apiKey = getConfig('apiKey');
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key not configured. Run: cloudmersive config set --api-key YOUR_KEY');
  }
  return apiKey;
}

function buildForm(filePath, fieldName = 'imageFile') {
  const form = new FormData();
  form.append(fieldName, fs.createReadStream(filePath));
  return form;
}

async function postFile(endpoint, filePath, fieldName = 'imageFile') {
  const apiKey = getApiKey();
  const form = buildForm(filePath, fieldName);
  const url = `${BASE_URL}${endpoint}`;

  const response = await axios.post(url, form, {
    headers: {
      ...form.getHeaders(),
      'Apikey': apiKey,
    },
  });

  return response.data;
}

export async function imageToText(filePath) {
  return postFile('/ocr/image/toText', filePath, 'imageFile');
}

export async function imageToLines(filePath) {
  return postFile('/ocr/image/to/lines-with-location', filePath, 'imageFile');
}

export async function pdfToText(filePath) {
  return postFile('/ocr/pdf/toText', filePath, 'imageFile');
}

export async function photoToText(filePath) {
  return postFile('/ocr/photo/toText', filePath, 'imageFile');
}

export async function recognizeReceipt(filePath) {
  return postFile('/ocr/photo/recognize/receipt', filePath, 'imageFile');
}

export async function recognizeBusinessCard(filePath) {
  return postFile('/ocr/photo/recognize/business-card', filePath, 'imageFile');
}

export async function recognizeForm(filePath) {
  return postFile('/ocr/photo/recognize/form', filePath, 'imageFile');
}

export async function preprocessBinarize(filePath) {
  return postFile('/ocr/preprocessing/image/binarize', filePath, 'imageFile');
}

export async function getPageAngle(filePath) {
  return postFile('/ocr/preprocessing/image/get-page-angle', filePath, 'imageFile');
}
