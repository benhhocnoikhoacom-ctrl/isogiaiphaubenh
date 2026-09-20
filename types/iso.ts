export const ISO_DRIVE_FOLDER_ID = '1RCN1x2_JwHa9iHN1NfICWiZFpKqmG5GZ';
export const ISO_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${ISO_DRIVE_FOLDER_ID}`;

export type UserRole = 'ADMIN' | 'USER';

export interface UserProfile {
  id: string; // User ID: email
  fullName: string;
  role: UserRole;
  title: string; // Trưởng khoa, Bác sĩ, KTV
  email: string;
  phone: string;
  password?: string;
  mustChangePassword?: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type FrequencyType = 'Daily' | 'Periodic' | 'Annual' | 'Event' | 'Mixed';
export type PriorityLevel = 'Cao' | 'Trung bình' | 'Thấp';

export interface WorkItem {
  itemId: string; // W001..W030
  itemCode: string; // XN.QL.01, GB.QL.08...
  itemName: string; // Tên đầu việc
  assigneeId: string; // ID người phụ trách
  assigneeName: string;
  reviewerId: string; // ID người duyệt (mặc định Trưởng khoa hoặc người được ủy quyền)
  reviewerName: string;
  frequency: FrequencyType;
  dueRule: string; // Gợi ý hạn
  reminderDays: number;
  evidenceRequired: boolean;
  approvalRequired: boolean;
  priority: PriorityLevel;
  operationNote: string;
  externalLink?: string; // Link hệ thống sẵn có (GB.QL.08, GB.QL.09, XN.QL.01)
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatusCode = 'NOT_DUE' | 'DUE_SOON' | 'PENDING_APPROVAL' | 'COMPLETED' | 'OVERDUE';

export interface TaskRecord {
  taskId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  period: string; // VD: 2026-09, 2026-Q3, 2026-09-21
  dueDate: string; // YYYY-MM-DD
  completedDate?: string;
  status: TaskStatusCode;
  assigneeId: string;
  assigneeName: string;
  reviewerId: string;
  reviewerName: string;
  evidenceUrl?: string;
  evidenceFileName?: string;
  note?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  externalLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: 'COMPLETE' | 'APPROVE' | 'REJECT' | 'REASSIGN' | 'CHANGE_DUE' | 'CREATE_EVENT';
  targetId: string; // taskId hoặc itemId
  targetName: string;
  details?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
}

export interface DashboardStats {
  overdueCount: number;
  dueSoonCount: number;
  completedCount: number;
  pendingApprovalCount: number;
  totalDueCount: number;
  completionRate: number; // percentage 0 - 100
}

export interface StaffPerformance {
  userId: string;
  fullName: string;
  title: string;
  email: string;
  assignedCount: number;
  completedCount: number;
  overdueCount: number;
  pendingCount: number;
  rate: number;
}
