// ============================================================================
// DTD Phase 5: Operations - Operator Workflow Service
// File: src/lib/operator-workflow.ts
// Description: Operator task management and workflow service
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
  DatabaseError,
  logError,
  handleSupabaseError,
  NotFoundError,
  BadRequestError,
} from './errors';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Operator task type
 */
export type OperatorTaskType =
  | 'review_moderation'
  | 'trainer_verification'
  | 'featured_queue'
  | 'emergency_triage'
  | 'payment_dispute'
  | 'user_inquiry'
  | 'system_alert';

/**
 * Operator task priority
 */
export type OperatorTaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Operator task status
 */
export type OperatorTaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'escalated' | 'cancelled';

/**
 * Operator task
 */
export interface OperatorTask {
  id: string;
  type: OperatorTaskType;
  priority: OperatorTaskPriority;
  status: OperatorTaskStatus;
  title: string;
  description: string;
  entity_type: string;
  entity_id: string;
  assigned_to: string | null;
  assigned_at: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  escalated_at: Date | null;
  escalation_reason: string | null;
  notes: string | null;
  completion_notes: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  due_date: Date | null;
}

/**
 * Task history entry
 */
export interface TaskHistory {
  id: string;
  task_id: string;
  action: string;
  previous_status: OperatorTaskStatus | null;
  new_status: OperatorTaskStatus | null;
  notes: string | null;
  user_id: string;
  created_at: Date;
}

/**
 * Create task input
 */
export interface CreateTaskInput {
  type: OperatorTaskType;
  priority: OperatorTaskPriority;
  title: string;
  description: string;
  entity_type: string;
  entity_id: string;
  due_date?: Date | null;
  created_by?: string | null;
}

/**
 * Update task input
 */
export interface UpdateTaskInput {
  priority?: OperatorTaskPriority;
  title?: string;
  description?: string;
  notes?: string | null;
  due_date?: Date | null;
}

/**
 * Task filter
 */
export interface TaskFilter {
  status?: OperatorTaskStatus;
  type?: OperatorTaskType;
  priority?: OperatorTaskPriority;
  assigned_to?: string | null;
  created_by?: string | null;
  entity_type?: string;
  entity_id?: string;
  date_from?: Date;
  date_to?: Date;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * Operator workflow service
 */
export class OperatorWorkflowService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ============================================================================
  // TASK RETRIEVAL
  // ============================================================================

  /**
   * Get operator tasks
   */
  async getOperatorTasks(filter?: TaskFilter): Promise<OperatorTask[]> {
    try {
      let query = this.supabase
        .from('operator_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter?.status) {
        query = query.eq('status', filter.status);
      }
      if (filter?.type) {
        query = query.eq('type', filter.type);
      }
      if (filter?.priority) {
        query = query.eq('priority', filter.priority);
      }
      if (filter?.assigned_to !== undefined) {
        query = query.eq('assigned_to', filter.assigned_to);
      }
      if (filter?.created_by) {
        query = query.eq('created_by', filter.created_by);
      }
      if (filter?.entity_type) {
        query = query.eq('entity_type', filter.entity_type);
      }
      if (filter?.entity_id) {
        query = query.eq('entity_id', filter.entity_id);
      }
      if (filter?.date_from) {
        query = query.gte('created_at', filter.date_from.toISOString());
      }
      if (filter?.date_to) {
        query = query.lte('created_at', filter.date_to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((task) => this.mapTaskFromDb(task));
    } catch (error) {
      logError(error, { method: 'getOperatorTasks', filter });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string): Promise<OperatorTask> {
    try {
      const { data, error } = await this.supabase
        .from('operator_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Task not found: ${taskId}`);
        }
        throw error;
      }

      return this.mapTaskFromDb(data);
    } catch (error) {
      logError(error, { method: 'getTaskById', taskId });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // TASK CREATION
  // ============================================================================

  /**
   * Create new task
   */
  async createTask(input: CreateTaskInput): Promise<OperatorTask> {
    try {
      const now = new Date();

      const { data, error } = await this.supabase
        .from('operator_tasks')
        .insert({
          type: input.type,
          priority: input.priority,
          status: 'pending',
          title: input.title,
          description: input.description,
          entity_type: input.entity_type,
          entity_id: input.entity_id,
          assigned_to: null,
          assigned_at: null,
          started_at: null,
          completed_at: null,
          escalated_at: null,
          escalation_reason: null,
          notes: null,
          completion_notes: null,
          created_by: input.created_by || null,
          due_date: input.due_date?.toISOString() || null,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial history entry
      await this.createHistoryEntry(data.id, 'created', null, 'pending', 'Task created', input.created_by || 'system');

      return this.mapTaskFromDb(data);
    } catch (error) {
      logError(error, { method: 'createTask', input });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // TASK ASSIGNMENT
  // ============================================================================

  /**
   * Assign task to operator
   */
  async assignTask(taskId: string, operatorId: string): Promise<OperatorTask> {
    try {
      const task = await this.getTaskById(taskId);

      if (task.status !== 'pending') {
        throw new BadRequestError(`Task cannot be assigned in status: ${task.status}`);
      }

      const now = new Date();

      const { data, error } = await this.supabase
        .from('operator_tasks')
        .update({
          status: 'assigned',
          assigned_to: operatorId,
          assigned_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Create history entry
      await this.createHistoryEntry(taskId, 'assigned', 'pending', 'assigned', `Task assigned to ${operatorId}`, operatorId);

      return this.mapTaskFromDb(data);
    } catch (error) {
      logError(error, { method: 'assignTask', taskId, operatorId });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // TASK COMPLETION
  // ============================================================================

  /**
   * Complete task
   */
  async completeTask(taskId: string, notes: string): Promise<OperatorTask> {
    try {
      const task = await this.getTaskById(taskId);

      if (task.status !== 'assigned' && task.status !== 'in_progress') {
        throw new BadRequestError(`Task cannot be completed in status: ${task.status}`);
      }

      const now = new Date();

      const { data, error } = await this.supabase
        .from('operator_tasks')
        .update({
          status: 'completed',
          completed_at: now.toISOString(),
          completion_notes: notes,
          updated_at: now.toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Create history entry
      await this.createHistoryEntry(taskId, 'completed', task.status, 'completed', notes, task.assigned_to || 'system');

      return this.mapTaskFromDb(data);
    } catch (error) {
      logError(error, { method: 'completeTask', taskId, notes });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // TASK ESCALATION
  // ============================================================================

  /**
   * Escalate task
   */
  async escalateTask(taskId: string, reason: string): Promise<OperatorTask> {
    try {
      const task = await this.getTaskById(taskId);

      if (task.status === 'completed' || task.status === 'cancelled') {
        throw new BadRequestError(`Task cannot be escalated in status: ${task.status}`);
      }

      const now = new Date();

      const { data, error } = await this.supabase
        .from('operator_tasks')
        .update({
          status: 'escalated',
          escalated_at: now.toISOString(),
          escalation_reason: reason,
          updated_at: now.toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Create history entry
      await this.createHistoryEntry(taskId, 'escalated', task.status, 'escalated', reason, task.assigned_to || 'system');

      return this.mapTaskFromDb(data);
    } catch (error) {
      logError(error, { method: 'escalateTask', taskId, reason });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // TASK UPDATE
  // ============================================================================

  /**
   * Update task
   */
  async updateTask(taskId: string, input: UpdateTaskInput): Promise<OperatorTask> {
    try {
      const task = await this.getTaskById(taskId);

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.priority !== undefined) {
        updateData.priority = input.priority;
      }
      if (input.title !== undefined) {
        updateData.title = input.title;
      }
      if (input.description !== undefined) {
        updateData.description = input.description;
      }
      if (input.notes !== undefined) {
        updateData.notes = input.notes;
      }
      if (input.due_date !== undefined) {
        updateData.due_date = input.due_date?.toISOString() || null;
      }

      const { data, error } = await this.supabase
        .from('operator_tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Create history entry
      await this.createHistoryEntry(taskId, 'updated', task.status, task.status, 'Task updated', task.assigned_to || 'system');

      return this.mapTaskFromDb(data);
    } catch (error) {
      logError(error, { method: 'updateTask', taskId, input });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // TASK DELETION
  // ============================================================================

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('operator_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      logError(error, { method: 'deleteTask', taskId });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // TASK HISTORY
  // ============================================================================

  /**
   * Get task history
   */
  async getTaskHistory(taskId: string): Promise<TaskHistory[]> {
    try {
      const { data, error } = await this.supabase
        .from('operator_task_history')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((history) => this.mapHistoryFromDb(history));
    } catch (error) {
      logError(error, { method: 'getTaskHistory', taskId });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Create history entry
   */
  private async createHistoryEntry(
    taskId: string,
    action: string,
    previousStatus: OperatorTaskStatus | null,
    newStatus: OperatorTaskStatus | null,
    notes: string | null,
    userId: string
  ): Promise<void> {
    try {
      await this.supabase.from('operator_task_history').insert({
        task_id: taskId,
        action,
        previous_status: previousStatus,
        new_status: newStatus,
        notes,
        user_id: userId,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logError(error, { method: 'createHistoryEntry', taskId, action });
      // Don't throw - history is secondary
    }
  }

  /**
   * Map task from database
   */
  private mapTaskFromDb(data: Record<string, unknown>): OperatorTask {
    return {
      id: data.id as string,
      type: data.type as OperatorTaskType,
      priority: data.priority as OperatorTaskPriority,
      status: data.status as OperatorTaskStatus,
      title: data.title as string,
      description: data.description as string,
      entity_type: data.entity_type as string,
      entity_id: data.entity_id as string,
      assigned_to: data.assigned_to as string | null,
      assigned_at: data.assigned_at ? new Date(data.assigned_at as string) : null,
      started_at: data.started_at ? new Date(data.started_at as string) : null,
      completed_at: data.completed_at ? new Date(data.completed_at as string) : null,
      escalated_at: data.escalated_at ? new Date(data.escalated_at as string) : null,
      escalation_reason: data.escalation_reason as string | null,
      notes: data.notes as string | null,
      completion_notes: data.completion_notes as string | null,
      created_by: data.created_by as string | null,
      created_at: new Date(data.created_at as string),
      updated_at: new Date(data.updated_at as string),
      due_date: data.due_date ? new Date(data.due_date as string) : null,
    };
  }

  /**
   * Map history from database
   */
  private mapHistoryFromDb(data: Record<string, unknown>): TaskHistory {
    return {
      id: data.id as string,
      task_id: data.task_id as string,
      action: data.action as string,
      previous_status: data.previous_status as OperatorTaskStatus | null,
      new_status: data.new_status as OperatorTaskStatus | null,
      notes: data.notes as string | null,
      user_id: data.user_id as string,
      created_at: new Date(data.created_at as string),
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default OperatorWorkflowService;
