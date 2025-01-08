import { GlobalWorkerOptions, version, getDocument, PDFPageProxy } from 'pdfjs-dist';

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ParsedPdfContent {
  text: string;
  items: TextItem[];
  dimensions: {
    width: number;
    height: number;
  };
  rawPdfData: string;
}

// Add this helper function to group characters into words
function groupTextIntoWords(items: any[], viewport: any): TextItem[] {
  // Sort items by y position first (for lines), then x position
  const sortedItems = [...items].sort((a, b) => {
    const yDiff = Math.abs(a.transform[5] - b.transform[5]);
    if (yDiff > 2) { // If on different lines (using small threshold)
      return b.transform[5] - a.transform[5]; // Sort by y position
    }
    return a.transform[4] - b.transform[4]; // Sort by x position within line
  });

  const words: TextItem[] = [];
  let currentWord: TextItem | null = null;
  let lastY: number | null = null;

  sortedItems.forEach((item: any) => {
    const x = item.transform[4];
    const y = viewport.height - item.transform[5];
    
    // Start new word if:
    // 1. Different line (y position changed significantly)
    // 2. Space or significant gap in x direction
    // 3. No current word
    if (lastY !== null && Math.abs(y - lastY) > 2) {
      if (currentWord) {
        words.push(currentWord);
        currentWord = null;
      }
    }

    if (currentWord && (
      item.str.trim() === '' || 
      x - (currentWord.x + currentWord.width) > 5
    )) {
      words.push(currentWord);
      currentWord = null;
    }

    lastY = y;

    if (item.str.trim() === '') return;

    if (!currentWord) {
      currentWord = {
        str: item.str,
        x: x,
        y: y,
        width: item.width || 0,
        height: item.height || (item.transform[3] - item.transform[1]) || 12
      };
    } else {
      // Append to current word
      currentWord.str += item.str;
      currentWord.width = (x + (item.width || 0)) - currentWord.x;
      // Keep the height as max of current and new
      currentWord.height = Math.max(currentWord.height, 
        item.height || (item.transform[3] - item.transform[1]) || 12);
    }
  });

  if (currentWord) {
    words.push(currentWord);
  }

  // Remove duplicates based on content and position
  return words.filter((word, index, self) => 
    index === self.findIndex(w => 
      w.str === word.str && 
      Math.abs(w.x - word.x) < 2 && 
      Math.abs(w.y - word.y) < 2
    )
  );
}

export async function parsePdfToText(file: File): Promise<ParsedPdfContent> {
  const base64String = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });

  const pdf = await getDocument({ data: atob(base64String) }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });
  
  const textContent = await page.getTextContent();
  const items = groupTextIntoWords(textContent.items, viewport);

  return {
    text: items.map(item => item.str).join(' '),
    items,
    dimensions: {
      width: viewport.width,
      height: viewport.height
    },
    rawPdfData: base64String
  };
} 