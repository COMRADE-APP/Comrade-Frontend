import Tesseract from 'tesseract.js';

export class DocumentScanner {
  constructor() {
    this.isProcessing = false;
  }

  async scanDocument(imageFile) {
    this.isProcessing = true;
    
    try {
      const result = await Tesseract.recognize(imageFile, 'eng', {
        logger: (m) => console.log(m),
      });

      const text = result.data.text;
      const confidence = result.data.confidence;
      const words = result.data.words;

      return {
        success: true,
        text,
        confidence,
        extractedData: this.extractDataFromText(text),
        words,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  extractDataFromText(text) {
    const extracted = {
      name: null,
      dateOfBirth: null,
      documentNumber: null,
      expiryDate: null,
      nationality: null,
      address: null,
    };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Extract document number (common patterns)
    const docPatterns = [
      /(?:passport|no|number|id)[:\s]*([A-Z0-9]{6,15})/i,
      /(?:document|doc)[:\s]*([A-Z0-9]{6,15})/i,
      /(?:IC|No\.?)[:\s]*([A-Z0-9]{8,12})/i,
    ];

    for (const pattern of docPatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.documentNumber = match[1];
        break;
      }
    }

    // Extract date of birth (various formats)
    const dobPatterns = [
      /(?:dob|birth|date of birth)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    ];

    for (const pattern of dobPatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.dateOfBirth = match[1];
        break;
      }
    }

    // Extract expiry date
    const expiryPatterns = [
      /(?:expiry|valid until|expires)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g,
    ];

    for (const pattern of expiryPatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.expiryDate = match[1];
        break;
      }
    }

    // Extract nationality
    const nationalityPattern = /(?:nationality|citizen)[:\s]*([A-Z]+)/i;
    const nationalityMatch = text.match(nationalityPattern);
    if (nationalityMatch) {
      extracted.nationality = nationalityMatch[1];
    }

    // Try to extract name (usually in first few lines)
    const namePatterns = [
      /^([A-Z][A-Z\s]+[A-Z])$/m,
      /(?:name|surname|given names)[:\s]*([A-Za-z\s]+)/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.name = match[1].trim();
        break;
      }
    }

    // Extract address (look for common keywords)
    const addressKeywords = ['address', 'street', 'road', 'avenue', 'lane', 'drive'];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (addressKeywords.some(kw => line.includes(kw))) {
        extracted.address = lines.slice(i, i + 2).join(', ');
        break;
      }
    }

    return extracted;
  }

  async scanBusinessDocument(imageFile) {
    this.isProcessing = true;

    try {
      const result = await Tesseract.recognize(imageFile, 'eng', {
        logger: (m) => console.log(m),
      });

      const text = result.data.text;

      return {
        success: true,
        text,
        confidence: result.data.confidence,
        extractedData: this.extractBusinessData(text),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  extractBusinessData(text) {
    const extracted = {
      companyName: null,
      registrationNumber: null,
      incorporationDate: null,
      address: null,
      directors: [],
      businessType: null,
    };

    // Company name patterns
    const companyPatterns = [
      /(?:company|corporation|inc|llc|ltd)[:\s]*([A-Za-z0-9\s]+)/i,
      /(?:registered|name)[:\s]*([A-Z][A-Za-z0-9\s&]+)/i,
    ];

    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match && !extracted.companyName) {
        extracted.companyName = match[1].trim();
      }
    }

    // Registration number
    const regPatterns = [
      /(?:registration|reg|no|number)[:\s]*([A-Z0-9]{5,15})/i,
      /(?:company|corp)[:\s]*no[:\s]*([A-Z0-9]{5,15})/i,
    ];

    for (const pattern of regPatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.registrationNumber = match[1];
        break;
      }
    }

    // Incorporation date
    const datePatterns = [
      /(?:incorporated|established|founded)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.incorporationDate = match[1];
        break;
      }
    }

    // Business type
    const typePatterns = [
      /(?:type|structure|nature)[:\s]*([A-Za-z\s]+)/i,
    ];

    for (const pattern of typePatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.businessType = match[1].trim();
        break;
      }
    }

    return extracted;
  }

  async scanTaxDocument(imageFile) {
    this.isProcessing = true;

    try {
      const result = await Tesseract.recognize(imageFile, 'eng');
      const text = result.data.text;

      return {
        success: true,
        text,
        extractedData: this.extractTaxData(text),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  extractTaxData(text) {
    const extracted = {
      taxId: null,
      taxType: null,
      taxpayerName: null,
      registeredDate: null,
    };

    // Tax ID patterns
    const taxIdPatterns = [
      /(?:tax|id|tin|ein|vat|gst)[:\s]*([A-Z0-9\-]{5,20})/i,
      /(?:vat|gst)[:\s]*([A-Z0-9]{5,15})/i,
    ];

    for (const pattern of taxIdPatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.taxId = match[1];
        break;
      }
    }

    return extracted;
  }
}

export const documentScanner = new DocumentScanner();
export default documentScanner;