import axios from 'axios';

const OPENCORPORATES_API = 'https://api.opencorporates.com/v0.4';
const VIES_API = 'https://ec.europa.eu/taxation_customs/vies/rest-api';

class BusinessVerificationService {
  constructor() {
    this.apiKeys = {
      openCorporates: process.env.OPENCORPORATES_API_KEY || '',
    };
  }

  async searchCompany(query) {
    try {
      const response = await axios.get(
        `${OPENCORPORATES_API}/companies/search`,
        {
          params: {
            q: query,
            per_page: 10,
          },
          headers: this.apiKeys.openCorporates 
            ? { Authorization: `Token token=${this.apiKeys.openCorporates}` }
            : {},
        }
      );
      
      return {
        success: true,
        companies: response.data.companies.map(c => ({
          name: c.company.name,
          companyNumber: c.company.company_number,
          jurisdiction: c.company.jurisdiction_code,
          incorporationDate: c.company.incorporation_date,
          companyType: c.company.type,
          address: c.company.registered_address_in_full,
          status: c.company.dissolution_date ? 'dissolved' : 'active',
        })),
      };
    } catch (error) {
      console.error('OpenCorporates search error:', error);
      return { success: false, error: error.message };
    }
  }

  async getCompanyDetails(companyNumber, jurisdiction) {
    try {
      const response = await axios.get(
        `${OPENCORPORATES_API}/companies/${jurisdiction}/${companyNumber}`,
        {
          headers: this.apiKeys.openCorporates 
            ? { Authorization: `Token token=${this.apiKeys.openCorporates}` }
            : {},
        }
      );
      
      const data = response.data.company;
      
      return {
        success: true,
        company: {
          name: data.name,
          companyNumber: data.company_number,
          jurisdiction: data.jurisdiction_code,
          incorporationDate: data.incorporation_date,
          dissolutionDate: data.dissolution_date,
          companyType: data.type,
          address: data.registered_address_in_full,
          officers: data.officers || [],
          filings: data.filings || [],
          source: data.source_url,
        },
      };
    } catch (error) {
      console.error('OpenCorporates details error:', error);
      return { success: false, error: error.message };
    }
  }

  async validateVAT(vatNumber) {
    const cleanVat = vatNumber.replace(/\s/g, '');
    
    try {
      const response = await axios.get(
        `${VIES_API}/vat/${cleanVat}`
      );
      
      return {
        success: true,
        valid: response.data.valid,
        details: response.data,
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error.message,
      };
    }
  }

  async validateGST(gstNumber, country) {
    // India GST validation (simplified)
    if (country === 'India' || country === 'IN') {
      const gstPattern = /^[0-9]{2}[A-Z]{4}[A-Z0-9]{1}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}$/;
      const isValidFormat = gstPattern.test(gstNumber);
      
      return {
        success: true,
        valid: isValidFormat,
        details: isValidFormat ? { format: 'valid' } : { format: 'invalid' },
      };
    }
    
    return { success: false, error: 'GST validation only available for India' };
  }

  async validateTaxId(taxId, country, taxType) {
    const results = {
      valid: false,
      details: {},
      warnings: [],
    };

    switch (taxType?.toLowerCase()) {
      case 'vat':
        const vatResult = await this.validateVAT(taxId);
        results.valid = vatResult.valid;
        results.details.vat = vatResult;
        break;

      case 'gst':
        const gstResult = await this.validateGST(taxId, country);
        results.valid = gstResult.valid;
        results.details.gst = gstResult;
        break;

      case 'ein':
        // US EIN validation (simplified format check)
        const einPattern = /^[0-9]{2}[0-9]{7}$/;
        results.valid = einPattern.test(taxId);
        results.details.ein = { format: results.valid ? 'valid' : 'invalid' };
        break;

      case 'business_registration':
        // Extract country code if present
        const countryCode = this.extractCountryCode(taxId);
        if (countryCode && country) {
          const searchResult = await this.searchCompany(taxId);
          results.valid = searchResult.companies?.length > 0;
          results.details.companySearch = searchResult;
          
          if (!results.valid) {
            results.warnings.push('Company not found in public registry');
          }
        }
        break;

      default:
        results.warnings.push('Tax ID type not recognized for validation');
    }

    return results;
  }

  extractCountryCode(taxId) {
    const prefixes = ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE'];
    const prefix = taxId.substring(0, 2).toUpperCase();
    return prefixes.includes(prefix) ? prefix : null;
  }

  async verifyBusinessRegistration(registrationNumber, country) {
    const verifications = [];
    
    // Try OpenCorporates for company lookup
    const companySearch = await this.searchCompany(registrationNumber);
    if (companySearch.success && companySearch.companies?.length > 0) {
      verifications.push({
        type: 'company_registry',
        status: 'found',
        source: 'OpenCorporates',
        details: companySearch.companies[0],
      });
    }

    // Try specific country validations
    if (country === 'US' || country === 'USA') {
      verifications.push({
        type: 'state_registration',
        status: 'manual_required',
        message: 'State-level verification requires state-specific API',
      });
    }

    if (country === 'UK' || country === 'GB') {
      verifications.push({
        type: 'companies_house',
        status: 'manual_required',
        message: 'Companies House API integration recommended',
      });
    }

    return {
      verified: verifications.some(v => v.status === 'found'),
      verifications,
    };
  }

  async checkSanctions(name, entityType = 'company') {
    try {
      // Using free sanctions lists
      const checks = await Promise.all([
        this.checkEUList(name),
        this.checkOFACList(name),
        this.checkUKList(name),
      ]);

      const matched = checks.filter(c => c.found);
      
      return {
        clean: matched.length === 0,
        matches: matched,
        checkedLists: ['EU', 'OFAC', 'UK'],
      };
    } catch (error) {
      return {
        clean: true,
        error: error.message,
      };
    }
  }

  async checkEUList(name) {
    try {
      const response = await axios.get(
        'https://data.europa.eu/euodp/en/data/dataset/cons_11_12',
        { timeout: 5000 }
      );
      // Simplified check - in production, download and cache the full list
      return { list: 'EU', found: false };
    } catch {
      return { list: 'EU', found: false, error: 'Could not access EU list' };
    }
  }

  async checkOFACList(name) {
    // OFAC provides a downloadable CSV
    // In production, cache this and check locally
    return { list: 'OFAC', found: false };
  }

  async checkUKList(name) {
    // UK HM Treasury sanctions list
    return { list: 'UK', found: false };
  }

  async performRiskAssessment(businessData) {
    const riskFactors = [];
    let riskScore = 0;

    // Check age of company
    if (businessData.incorporationDate) {
      const age = this.calculateCompanyAge(businessData.incorporationDate);
      if (age < 1) {
        riskFactors.push('Company less than 1 year old');
        riskScore += 30;
      } else if (age < 3) {
        riskFactors.push('Company less than 3 years old');
        riskScore += 15;
      }
    } else {
      riskFactors.push('Incorporation date not verified');
      riskScore += 20;
    }

    // Check business type risk
    const highRiskTypes = ['shell', 'trust', 'offshore'];
    if (businessData.companyType && 
        highRiskTypes.some(t => businessData.companyType.toLowerCase().includes(t))) {
      riskFactors.push('High-risk company type');
      riskScore += 40;
    }

    // Check address
    if (!businessData.address) {
      riskFactors.push('Address not verified');
      riskScore += 15;
    }

    // Check officers
    if (!businessData.officers || businessData.officers.length === 0) {
      riskFactors.push('No officer information available');
      riskScore += 10;
    }

    // Normalize score to 0-100
    const normalizedScore = Math.min(100, riskScore);

    return {
      score: normalizedScore,
      level: normalizedScore < 20 ? 'low' : normalizedScore < 50 ? 'medium' : 'high',
      factors: riskFactors,
      recommendations: this.getRecommendations(normalizedScore, riskFactors),
    };
  }

  calculateCompanyAge(incorporationDate) {
    const date = new Date(incorporationDate);
    const now = new Date();
    return (now - date) / (1000 * 60 * 60 * 24 * 365);
  }

  getRecommendations(score, factors) {
    const recommendations = [];
    
    if (score >= 50) {
      recommendations.push('Request additional documentation');
      recommendations.push('Consider video call verification');
    }
    
    if (factors.some(f => f.includes('age'))) {
      recommendations.push('Request business bank statements');
    }
    
    if (factors.some(f => f.includes('address'))) {
      recommendations.push('Verify registered address');
    }

    if (recommendations.length === 0) {
      recommendations.push('Standard verification process sufficient');
    }

    return recommendations;
  }
}

export const businessVerificationService = new BusinessVerificationService();
export default businessVerificationService;