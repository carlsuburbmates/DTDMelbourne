// ============================================================================
// DTD Phase 4: Emergency Triage - Emergency Contacts Service
// File: src/lib/emergency-contacts.ts
// Description: Emergency contacts service
// ============================================================================

import { supabase } from './auth';
import { handleSupabaseError, NotFoundError, BadRequestError } from './errors';
import { getCascadeManager } from './emergency-cascade';
import type { EmergencyContact, DogBusinessResourceType, DogTriageClassification } from '../types/database';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Emergency contact input
 */
export interface EmergencyContactInput {
  business_id: number;
  resource_type: DogBusinessResourceType;
  name: string;
  locality_id?: number;
  council_id?: number;
  phone: string;
  email?: string | null;
  website?: string | null;
  description?: string | null;
  emergency_phone?: string | null;
  emergency_hours?: string | null;
  emergency_services?: string[] | null;
  verified?: boolean;
  claimed?: boolean;
  scaffolded?: boolean;
  data_source?: string;
}

/**
 * Emergency contact update input
 */
export interface EmergencyContactUpdateInput {
  name?: string;
  phone?: string;
  email?: string | null;
  website?: string | null;
  description?: string | null;
  emergency_phone?: string | null;
  emergency_hours?: string | null;
  emergency_services?: string[] | null;
  verified?: boolean;
  claimed?: boolean;
  availability_status?: string;
  last_verified?: Date;
}

// ============================================================================
// EMERGENCY CONTACTS SERVICE CLASS
// ============================================================================

/**
 * Emergency contacts service
 */
class EmergencyContactsService {
  /**
   * Get emergency contacts for council
   */
  async getEmergencyContacts(
    councilId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<EmergencyContact[]> {
    const { data: contacts, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('council_id', councilId)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw handleSupabaseError(error);
    }

    return contacts || [];
  }

  /**
   * Get emergency contacts by locality
   */
  async getEmergencyContactsByLocality(
    localityId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<EmergencyContact[]> {
    const { data: contacts, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('locality_id', localityId)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw handleSupabaseError(error);
    }

    return contacts || [];
  }

  /**
   * Get emergency contacts by classification
   */
  async getEmergencyContactsByClassification(
    classification: DogTriageClassification,
    councilId?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<EmergencyContact[]> {
    // Map classification to resource types
    const resourceTypes = this.mapClassificationToResourceTypes(classification);

    let query = supabase
      .from('emergency_contacts')
      .select('*')
      .in('resource_type', resourceTypes)
      .order('name', { ascending: true });

    if (councilId) {
      query = query.eq('council_id', councilId);
    }

    const { data: contacts, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw handleSupabaseError(error);
    }

    return contacts || [];
  }

  /**
   * Get emergency contacts by resource type
   */
  async getEmergencyContactsByResourceType(
    resourceType: DogBusinessResourceType,
    councilId?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<EmergencyContact[]> {
    let query = supabase
      .from('emergency_contacts')
      .select('*')
      .eq('resource_type', resourceType)
      .order('name', { ascending: true });

    if (councilId) {
      query = query.eq('council_id', councilId);
    }

    const { data: contacts, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw handleSupabaseError(error);
    }

    return contacts || [];
  }

  /**
   * Get emergency contact by ID
   */
  async getEmergencyContactById(id: string): Promise<EmergencyContact> {
    const { data: contact, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!contact) {
      throw new NotFoundError(`Emergency contact not found: ${id}`);
    }

    return contact;
  }

  /**
   * Create emergency contact
   */
  async createEmergencyContact(data: EmergencyContactInput): Promise<EmergencyContact> {
    // Validate input
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestError('Contact name is required');
    }

    if (!data.phone || data.phone.trim().length === 0) {
      throw new BadRequestError('Contact phone is required');
    }

    if (!data.business_id) {
      throw new BadRequestError('Business ID is required');
    }

    const { data: contact, error } = await supabase
      .from('emergency_contacts')
      .insert({
        business_id: data.business_id,
        resource_type: data.resource_type,
        name: data.name,
        locality_id: data.locality_id,
        council_id: data.council_id,
        phone: data.phone,
        email: data.email,
        website: data.website,
        description: data.description,
        emergency_phone: data.emergency_phone,
        emergency_hours: data.emergency_hours,
        emergency_services: data.emergency_services,
        verified: data.verified ?? false,
        claimed: data.claimed ?? false,
        scaffolded: data.scaffolded ?? true,
        data_source: data.data_source || 'manual_form',
      })
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    return contact;
  }

  /**
   * Update emergency contact
   */
  async updateEmergencyContact(
    id: string,
    data: EmergencyContactUpdateInput
  ): Promise<EmergencyContact> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    if (data.website !== undefined) {
      updateData.website = data.website;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.emergency_phone !== undefined) {
      updateData.emergency_phone = data.emergency_phone;
    }

    if (data.emergency_hours !== undefined) {
      updateData.emergency_hours = data.emergency_hours;
    }

    if (data.emergency_services !== undefined) {
      updateData.emergency_services = data.emergency_services;
    }

    if (data.verified !== undefined) {
      updateData.verified = data.verified;
    }

    if (data.claimed !== undefined) {
      updateData.claimed = data.claimed;
    }

    if (data.availability_status !== undefined) {
      updateData.availability_status = data.availability_status;
    }

    if (data.last_verified !== undefined) {
      updateData.last_verified = data.last_verified.toISOString();
    }

    const { data: contact, error } = await supabase
      .from('emergency_contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!contact) {
      throw new NotFoundError(`Emergency contact not found: ${id}`);
    }

    return contact;
  }

  /**
   * Delete emergency contact
   */
  async deleteEmergencyContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      throw handleSupabaseError(error);
    }
  }

  /**
   * Search emergency contacts
   */
  async searchEmergencyContacts(
    searchTerm: string,
    councilId?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<EmergencyContact[]> {
    let query = supabase
      .from('emergency_contacts')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true });

    if (councilId) {
      query = query.eq('council_id', councilId);
    }

    const { data: contacts, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw handleSupabaseError(error);
    }

    return contacts || [];
  }

  /**
   * Get verified emergency contacts
   */
  async getVerifiedEmergencyContacts(
    councilId?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<EmergencyContact[]> {
    let query = supabase
      .from('emergency_contacts')
      .select('*')
      .eq('verified', true)
      .order('name', { ascending: true });

    if (councilId) {
      query = query.eq('council_id', councilId);
    }

    const { data: contacts, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw handleSupabaseError(error);
    }

    return contacts || [];
  }

  /**
   * Get emergency contacts statistics
   */
  async getEmergencyContactsStatistics(): Promise<{
    total_contacts: number;
    verified_contacts: number;
    by_resource_type: Record<string, number>;
    by_council: Record<string, number>;
  }> {
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('emergency_contacts')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw handleSupabaseError(countError);
    }

    // Get verified count
    const { count: verifiedCount, error: verifiedError } = await supabase
      .from('emergency_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('verified', true);

    if (verifiedError) {
      throw handleSupabaseError(verifiedError);
    }

    // Get all contacts for statistics
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('resource_type, council_id');

    if (contactsError) {
      throw handleSupabaseError(contactsError);
    }

    const byResourceType: Record<string, number> = {};
    const byCouncil: Record<string, number> = {};

    (contacts || []).forEach(contact => {
      byResourceType[contact.resource_type] = (byResourceType[contact.resource_type] || 0) + 1;
      if (contact.council_id) {
        byCouncil[contact.council_id] = (byCouncil[contact.council_id] || 0) + 1;
      }
    });

    return {
      total_contacts: totalCount || 0,
      verified_contacts: verifiedCount || 0,
      by_resource_type: byResourceType,
      by_council: byCouncil,
    };
  }

  /**
   * Map classification to resource types
   */
  private mapClassificationToResourceTypes(classification: DogTriageClassification): DogBusinessResourceType[] {
    switch (classification) {
      case 'medical':
        return ['emergency_vet', 'urgent_care'];
      case 'crisis':
        return ['emergency_vet', 'urgent_care', 'emergency_shelter'];
      case 'stray':
        return ['emergency_shelter', 'urgent_care'];
      case 'normal':
        return ['trainer', 'behaviour_consultant'];
      default:
        return ['emergency_vet', 'urgent_care', 'emergency_shelter'];
    }
  }
}

// ============================================================================
// SERVICE INSTANCE
// ============================================================================

let emergencyContactsServiceInstance: EmergencyContactsService | null = null;

/**
 * Get or create emergency contacts service instance
 */
export function getEmergencyContactsService(): EmergencyContactsService {
  if (!emergencyContactsServiceInstance) {
    emergencyContactsServiceInstance = new EmergencyContactsService();
  }
  return emergencyContactsServiceInstance;
}

/**
 * Reset emergency contacts service instance (useful for testing)
 */
export function resetEmergencyContactsService(): void {
  emergencyContactsServiceInstance = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { EmergencyContactsService };
