// ============================================================================
// DTD Phase 4: Emergency Triage - Z.AI Client
// File: src/lib/zai.ts
// Description: Z.AI client configuration and helper functions
// ============================================================================

import { AI_SERVICE_ERROR } from '@/lib/errors';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Z.AI configuration
 */
interface ZaiConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

/**
 * Emergency classification result
 */
export interface EmergencyClassification {
  classification: 'medical' | 'crisis' | 'stray' | 'normal';
  reasoning: string;
}

/**
 * Emergency recommendation
 */
export interface EmergencyRecommendation {
  classification: string;
  recommendations: string[];
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Emergency contact info
 */
export interface EmergencyContactInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  hours?: string;
  services?: string[];
}

// ============================================================================
// Z.AI CLIENT CLASS
// ============================================================================

/**
 * Z.AI client for emergency triage
 */
class ZaiClient {
  private config: ZaiConfig;

  constructor(config: ZaiConfig) {
    this.config = config;
  }

  /**
   * Make a request to Z.AI API
   */
  private async makeRequest(endpoint: string, payload: Record<string, unknown>): Promise<unknown> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Z.AI API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new AI_SERVICE_ERROR(`Z.AI request failed: ${error.message}`);
      }
      throw new AI_SERVICE_ERROR('Z.AI request failed: Unknown error');
    }
  }

  /**
   * Classify emergency severity
   */
  async classifyEmergency(
    description: string,
    dogAgeGroup: string,
    behaviorIssue: string
  ): Promise<EmergencyClassification> {
    const prompt = this.buildClassificationPrompt(description, dogAgeGroup, behaviorIssue);

    try {
      const response = await this.makeRequest('/v1/classify', {
        model: this.config.model,
        prompt,
        temperature: 0.3,
        max_tokens: 500,
      }) as {
        classification: string;
        reasoning: string;
      };

      return {
        classification: this.validateClassification(response.classification),
        reasoning: response.reasoning,
      };
    } catch (error) {
      throw new AI_SERVICE_ERROR(`Failed to classify emergency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get emergency recommendations based on classification
   */
  async getEmergencyRecommendations(classification: string): Promise<EmergencyRecommendation> {
    const prompt = this.buildRecommendationsPrompt(classification);

    try {
      const response = await this.makeRequest('/v1/recommend', {
        model: this.config.model,
        prompt,
        temperature: 0.5,
        max_tokens: 800,
      }) as {
        recommendations: string[];
        urgency_level: string;
      };

      return {
        classification,
        recommendations: response.recommendations || [],
        urgency_level: this.validateUrgencyLevel(response.urgency_level),
      };
    } catch (error) {
      throw new AI_SERVICE_ERROR(`Failed to get recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get emergency contacts for a council
   */
  async getEmergencyContacts(
    classification: string,
    councilId: string
  ): Promise<EmergencyContactInfo[]> {
    const prompt = this.buildContactsPrompt(classification, councilId);

    try {
      const response = await this.makeRequest('/v1/contacts', {
        model: this.config.model,
        prompt,
        temperature: 0.2,
        max_tokens: 1000,
      }) as {
        contacts: EmergencyContactInfo[];
      };

      return response.contacts || [];
    } catch (error) {
      throw new AI_SERVICE_ERROR(`Failed to get emergency contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build classification prompt
   */
  private buildClassificationPrompt(
    description: string,
    dogAgeGroup: string,
    behaviorIssue: string
  ): string {
    return `You are an emergency triage assistant for dog-related situations. 
Classify the following situation into one of these categories:
- medical: Dog is injured, bleeding, or in physical distress
- crisis: Dog is attacking, aggressive, or posing immediate danger
- stray: Dog is lost, abandoned, or wandering alone
- normal: Non-urgent situation requiring general advice

Situation details:
- Description: ${description}
- Dog age group: ${dogAgeGroup}
- Behavior issue: ${behaviorIssue}

Provide your response in JSON format:
{
  "classification": "medical|crisis|stray|normal",
  "reasoning": "Brief explanation of your classification"
}`;
  }

  /**
   * Build recommendations prompt
   */
  private buildRecommendationsPrompt(classification: string): string {
    const classificationGuides: Record<string, string> = {
      medical: 'Provide immediate first aid steps and recommend contacting a veterinarian',
      crisis: 'Provide safety measures and recommend contacting emergency services',
      stray: 'Provide steps to safely handle the situation and contact animal control',
      normal: 'Provide general advice and recommend contacting a trainer if needed',
    };

    return `You are an emergency triage assistant for dog-related situations.
Classification: ${classification}

${classificationGuides[classification] || classificationGuides.normal}

Provide your response in JSON format:
{
  "recommendations": ["step 1", "step 2", "step 3"],
  "urgency_level": "low|medium|high|critical"
}`;
  }

  /**
   * Build contacts prompt
   */
  private buildContactsPrompt(classification: string, councilId: string): string {
    return `You are an emergency triage assistant for dog-related situations.
Classification: ${classification}
Council ID: ${councilId}

Provide a list of relevant emergency contacts for this situation.
Include veterinarians, emergency clinics, animal control, or shelters as appropriate.

Provide your response in JSON format:
{
  "contacts": [
    {
      "name": "Contact name",
      "phone": "Phone number",
      "email": "Email (optional)",
      "address": "Address (optional)",
      "hours": "Operating hours (optional)",
      "services": ["service1", "service2"]
    }
  ]
}`;
  }

  /**
   * Validate classification value
   */
  private validateClassification(classification: string): 'medical' | 'crisis' | 'stray' | 'normal' {
    const validClassifications = ['medical', 'crisis', 'stray', 'normal'];
    if (validClassifications.includes(classification)) {
      return classification as 'medical' | 'crisis' | 'stray' | 'normal';
    }
    return 'normal';
  }

  /**
   * Validate urgency level
   */
  private validateUrgencyLevel(urgency: string): 'low' | 'medium' | 'high' | 'critical' {
    const validLevels = ['low', 'medium', 'high', 'critical'];
    if (validLevels.includes(urgency)) {
      return urgency as 'low' | 'medium' | 'high' | 'critical';
    }
    return 'medium';
  }

  /**
   * Check if Z.AI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.makeRequest('/v1/health', {});
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// CLIENT INSTANCE
// ============================================================================

let zaiClientInstance: ZaiClient | null = null;

/**
 * Get or create Z.AI client instance
 */
export function getZaiClient(): ZaiClient {
  if (!zaiClientInstance) {
    const apiKey = process.env.ZAI_API_KEY;
    const model = process.env.ZAI_MODEL || 'zai-1';
    const baseUrl = process.env.ZAI_BASE_URL || 'https://api.zai.ai';

    if (!apiKey) {
      throw new AI_SERVICE_ERROR('Z.AI API key not configured');
    }

    zaiClientInstance = new ZaiClient({ apiKey, model, baseUrl });
  }

  return zaiClientInstance;
}

/**
 * Reset Z.AI client instance (useful for testing)
 */
export function resetZaiClient(): void {
  zaiClientInstance = null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if Z.AI is configured
 */
export function isZaiConfigured(): boolean {
  return !!process.env.ZAI_API_KEY;
}

/**
 * Get Z.AI model name
 */
export function getZaiModel(): string {
  return process.env.ZAI_MODEL || 'zai-1';
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ZaiClient };
export type { ZaiConfig };
