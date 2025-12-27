/**
 * TaskManagement Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TaskManagement from './TaskManagement';
import * as adminService from '../../services/admin';

// Mock admin service
vi.mock('../../services/admin');

describe('TaskManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (adminService.getTasks as any).mockImplementation(() => new Promise(() => {}));

    render(<TaskManagement />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render task list after loading', async () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Review trainer applications',
        description: 'Review pending trainer applications',
        priority: 'high',
        status: 'pending',
        assignedTo: 'admin-1',
        dueDate: '2025-01-10T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getTasks as any).mockResolvedValue({ tasks: mockTasks, total: 1 });

    render(<TaskManagement />);

    await waitFor(() => {
      expect(screen.getByText('Review trainer applications')).toBeInTheDocument();
    });
  });

  it('should filter tasks by status', async () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Review trainer applications',
        description: 'Review pending trainer applications',
        priority: 'high',
        status: 'pending',
        assignedTo: 'admin-1',
        dueDate: '2025-01-10T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getTasks as any).mockResolvedValue({ tasks: mockTasks, total: 1 });

    render(<TaskManagement />);

    await waitFor(() => {
      const statusFilter = screen.getByLabelText('Status');
      fireEvent.change(statusFilter, { target: { value: 'pending' } });
    });

    expect(adminService.getTasks).toHaveBeenCalledWith({ status: 'pending', page: 1 });
  });

  it('should filter tasks by priority', async () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Review trainer applications',
        description: 'Review pending trainer applications',
        priority: 'high',
        status: 'pending',
        assignedTo: 'admin-1',
        dueDate: '2025-01-10T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getTasks as any).mockResolvedValue({ tasks: mockTasks, total: 1 });

    render(<TaskManagement />);

    await waitFor(() => {
      const priorityFilter = screen.getByLabelText('Priority');
      fireEvent.change(priorityFilter, { target: { value: 'high' } });
    });

    expect(adminService.getTasks).toHaveBeenCalledWith({ priority: 'high', page: 1 });
  });

  it('should open create task modal', async () => {
    const mockTasks = [];

    (adminService.getTasks as any).mockResolvedValue({ tasks: mockTasks, total: 0 });

    render(<TaskManagement />);

    await waitFor(() => {
      const createButton = screen.getByText('Create Task');
      fireEvent.click(createButton);
    });

    expect(screen.getByText('Create New Task')).toBeInTheDocument();
  });

  it('should create a task', async () => {
    const mockTasks = [];

    (adminService.getTasks as any).mockResolvedValue({ tasks: mockTasks, total: 0 });
    (adminService.createTask as any).mockResolvedValue(true);

    render(<TaskManagement />);

    await waitFor(() => {
      const createButton = screen.getByText('Create Task');
      fireEvent.click(createButton);
    });

    const titleInput = screen.getByLabelText('Title');
    const descriptionInput = screen.getByLabelText('Description');
    const prioritySelect = screen.getByLabelText('Priority');
    const dueDateInput = screen.getByLabelText('Due Date');

    fireEvent.change(titleInput, { target: { value: 'New task' } });
    fireEvent.change(descriptionInput, { target: { value: 'Task description' } });
    fireEvent.change(prioritySelect, { target: { value: 'medium' } });
    fireEvent.change(dueDateInput, { target: { value: '2025-01-10' } });

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    expect(adminService.createTask).toHaveBeenCalledWith({
      title: 'New task',
      description: 'Task description',
      priority: 'medium',
      dueDate: '2025-01-10T00:00:00Z'
    });
  });

  it('should assign a task', async () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Review trainer applications',
        description: 'Review pending trainer applications',
        priority: 'high',
        status: 'pending',
        assignedTo: null,
        dueDate: '2025-01-10T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getTasks as any).mockResolvedValue({ tasks: mockTasks, total: 1 });
    (adminService.assignTask as any).mockResolvedValue(true);

    render(<TaskManagement />);

    await waitFor(() => {
      const assignButton = screen.getByText('Assign');
      fireEvent.click(assignButton);
    });

    expect(adminService.assignTask).toHaveBeenCalledWith('1', 'admin-1');
  });

  it('should complete a task', async () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Review trainer applications',
        description: 'Review pending trainer applications',
        priority: 'high',
        status: 'in_progress',
        assignedTo: 'admin-1',
        dueDate: '2025-01-10T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getTasks as any).mockResolvedValue({ tasks: mockTasks, total: 1 });
    (adminService.completeTask as any).mockResolvedValue(true);

    render(<TaskManagement />);

    await waitFor(() => {
      const completeButton = screen.getByText('Complete');
      fireEvent.click(completeButton);
    });

    expect(adminService.completeTask).toHaveBeenCalledWith('1');
  });

  it('should handle pagination', async () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Review trainer applications',
        description: 'Review pending trainer applications',
        priority: 'high',
        status: 'pending',
        assignedTo: 'admin-1',
        dueDate: '2025-01-10T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getTasks as any).mockResolvedValue({ tasks: mockTasks, total: 25 });

    render(<TaskManagement />);

    await waitFor(() => {
      const nextPageButton = screen.getByText('Next');
      fireEvent.click(nextPageButton);
    });

    expect(adminService.getTasks).toHaveBeenCalledWith({ page: 2 });
  });

  it('should handle error state', async () => {
    (adminService.getTasks as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<TaskManagement />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load tasks')).toBeInTheDocument();
    });
  });
});
