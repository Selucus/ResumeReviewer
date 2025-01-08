import { GlobalWorkerOptions } from 'pdfjs-dist';

// Set worker source
const WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
GlobalWorkerOptions.workerSrc = WORKER_URL; 