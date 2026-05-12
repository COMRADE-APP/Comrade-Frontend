import { LivenessDetector, loadFaceAPIModels } from './livenessDetection';
import { documentScanner } from './documentScanner';
import { businessVerificationService } from './businessVerification';

export class EnhancedVerificationService {
  constructor() {
    this.livenessDetector = null;
    this.verificationSteps = [];
    this.currentStep = 0;
  }

  async initializeLiveness(videoElement) {
    await loadFaceAPIModels();
    this.livenessDetector = new LivenessDetector(videoElement);
    await this.livenessDetector.startDetection();
    return this.livenessDetector;
  }

  async runAutomatedVerification(verificationRequest) {
    const results = {
      automated: true,
      timestamp: new Date().toISOString(),
      checks: [],
      riskScore: 0,
      recommendation: 'pending_review',
    };

    // Step 1: Validate registration number
    if (verificationRequest.registration?.registration_number) {
      const regCheck = await this.validateRegistrationNumber(
        verificationRequest.registration.registration_number,
        verificationRequest.location?.country
      );
      results.checks.push(regCheck);
    }

    // Step 2: Validate tax information
    if (verificationRequest.tax_info?.tax_id) {
      const taxCheck = await this.validateTaxInfo(verificationRequest.tax_info);
      results.checks.push(taxCheck);
    }

    // Step 3: Validate address
    if (verificationRequest.location?.address) {
      const addressCheck = await this.validateAddress(verificationRequest.location);
      results.checks.push(addressCheck);
    }

    // Step 4: Check for sanctions
    if (verificationRequest.basic_info?.name) {
      const sanctionsCheck = await businessVerificationService.checkSanctions(
        verificationRequest.basic_info.name,
        verificationRequest.entity_type
      );
      results.checks.push({
        type: 'sanctions',
        ...sanctionsCheck,
      });
    }

    // Step 5: Check documents
    if (verificationRequest.identifications?.length > 0) {
      const docCheck = await this.validateDocuments(verificationRequest.identifications);
      results.checks.push(docCheck);
    }

    // Calculate risk score
    results.riskScore = this.calculateRiskScore(results.checks);

    // Generate recommendation
    results.recommendation = this.generateRecommendation(results);

    return results;
  }

  async validateRegistrationNumber(regNumber, country) {
    const result = await businessVerificationService.verifyBusinessRegistration(
      regNumber,
      country
    );

    return {
      type: 'registration_verification',
      passed: result.verified,
      details: result.verifications,
      timestamp: new Date().toISOString(),
    };
  }

  async validateTaxInfo(taxInfo) {
    const result = await businessVerificationService.validateTaxId(
      taxInfo.tax_id,
      taxInfo.tax_jurisdiction || 'US',
      taxInfo.tax_system
    );

    return {
      type: 'tax_verification',
      passed: result.valid,
      details: result.details,
      warnings: result.warnings,
      timestamp: new Date().toISOString(),
    };
  }

  async validateAddress(location) {
    const addressString = `${location.address}, ${location.city}, ${location.state}, ${location.country}`;
    
    // Basic address validation (no API call)
    const isValid = (
      location.address?.length > 5 &&
      location.city?.length > 1 &&
      location.country?.length > 1
    );

    return {
      type: 'address_verification',
      passed: isValid,
      details: {
        formatted: addressString,
        isVirtual: location.is_virtual,
        virtualLink: location.virtual_link,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async validateDocuments(identifications) {
    const results = [];
    
    for (const id of identifications) {
      const validation = {
        type: 'document_validation',
        documentType: id.identification_type,
        documentNumber: id.document_number,
        verified: id.is_verified || false,
        scanned: id.scanned_data ? true : false,
      };
      
      results.push(validation);
    }

    const allVerified = results.every(r => r.verified);

    return {
      type: 'identification_verification',
      passed: allVerified,
      documents: results,
      timestamp: new Date().toISOString(),
    };
  }

  calculateRiskScore(checks) {
    let score = 0;
    const weights = {
      registration_verification: 25,
      tax_verification: 20,
      address_verification: 15,
      sanctions: 30,
      identification_verification: 10,
    };

    for (const check of checks) {
      const weight = weights[check.type] || 10;
      
      if (!check.passed) {
        if (check.type === 'sanctions' && !check.clean) {
          score += weight * 2; // Higher risk if sanctions match
        } else {
          score += weight;
        }
      }
    }

    return Math.min(100, score);
  }

  generateRecommendation(results) {
    const { riskScore, checks } = results;
    
    // Auto-approve if very low risk and all critical checks passed
    const criticalChecks = checks.filter(c => 
      ['registration_verification', 'sanctions', 'tax_verification'].includes(c.type)
    );
    
    const allCriticalPassed = criticalChecks.every(c => c.passed);
    
    if (riskScore < 15 && allCriticalPassed) {
      return 'auto_approved';
    }
    
    if (riskScore < 30) {
      return 'standard_review';
    }
    
    if (riskScore < 50) {
      return 'enhanced_review';
    }
    
    return 'manual_review_required';
  }

  async processLivenessWithChallenge(videoElement, challenges) {
    if (!this.livenessDetector) {
      await this.initializeLiveness(videoElement);
    }

    const results = [];
    
    for (const challenge of challenges) {
      const challengeResult = await this.livenessDetector.verifyChallenge(challenge);
      results.push({
        challenge,
        ...challengeResult,
        timestamp: new Date().toISOString(),
      });

      // Brief pause between challenges
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Final liveness analysis
    const finalAnalysis = await this.livenessDetector.analyzeLiveness();

    return {
      challenges: results,
      analysis: finalAnalysis,
      verified: results.every(r => r.passed) && finalAnalysis.livenessScore > 0.7,
    };
  }

  async scanAndAutoFill(documentFile, documentType) {
    let result;
    
    switch (documentType) {
      case 'passport':
      case 'national_id':
      case 'drivers_license':
        result = await documentScanner.scanDocument(documentFile);
        break;
      case 'business_license':
      case 'registration':
        result = await documentScanner.scanBusinessDocument(documentFile);
        break;
      case 'tax':
        result = await documentScanner.scanTaxDocument(documentFile);
        break;
      default:
        result = await documentScanner.scanDocument(documentFile);
    }

    if (result.success) {
      return {
        success: true,
        extractedData: result.extractedData,
        confidence: result.confidence,
        suggestedFields: this.mapExtractedToFields(result.extractedData, documentType),
      };
    }

    return result;
  }

  mapExtractedToFields(extractedData, documentType) {
    const mapping = {
      passport: {
        name: extractedData.name,
        documentNumber: extractedData.documentNumber,
        expiryDate: extractedData.expiryDate,
        nationality: extractedData.nationality,
      },
      national_id: {
        name: extractedData.name,
        documentNumber: extractedData.documentNumber,
        dateOfBirth: extractedData.dateOfBirth,
        address: extractedData.address,
      },
      business_license: {
        companyName: extractedData.companyName,
        registrationNumber: extractedData.registrationNumber,
        incorporationDate: extractedData.incorporationDate,
        address: extractedData.address,
      },
      tax: {
        taxId: extractedData.taxId,
        taxpayerName: extractedData.taxpayerName,
        registeredDate: extractedData.registeredDate,
      },
    };

    return mapping[documentType] || {};
  }

  generateVerificationReport(verificationRequest, automatedResults) {
    const report = {
      id: `VR-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      
      entity: {
        type: verificationRequest.entity_type,
        name: verificationRequest.basic_info?.name,
      },
      
      automatedVerification: {
        enabled: automatedResults.automated,
        timestamp: automatedResults.timestamp,
        riskScore: automatedResults.riskScore,
        recommendation: automatedResults.recommendation,
      },
      
      checks: automatedResults.checks,
      
      nextSteps: this.getNextSteps(automatedResults),
      
      staffNotes: '',
    };

    return report;
  }

  getNextSteps(automatedResults) {
    const steps = [];
    
    if (automatedResults.riskScore < 20) {
      steps.push('Standard processing - auto-approved');
    } else if (automatedResults.riskScore < 40) {
      steps.push('Review automated check results');
      steps.push('Verify any flagged items');
    } else {
      steps.push('Schedule video interview with applicant');
      steps.push('Request additional documentation');
      steps.push('Perform manual verification');
    }

    return steps;
  }
}

export const enhancedVerificationService = new EnhancedVerificationService();
export default enhancedVerificationService;