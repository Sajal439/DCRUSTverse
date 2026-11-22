export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  targetRoles: string[];
  targetDepartmentId?: string | null;
  isUrgent: boolean;
  expiresAt?: string | null;
  publishedBy?: string | null;
  publishedAt: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NoticesRepository {
  listNotices(filters?: { targetRole?: string; departmentId?: string }): Promise<NoticeItem[]>;
  createNotice(data: {
    title: string;
    content: string;
    targetRoles?: string[];
    targetDepartmentId?: string;
    isUrgent?: boolean;
    expiresAt?: Date;
    publishedBy: string;
  }): Promise<NoticeItem>;

  listNotifications(userId: string): Promise<NotificationItem[]>;
  createNotification(data: {
    userId: string;
    title: string;
    message: string;
    link?: string;
  }): Promise<NotificationItem>;
  markNotificationRead(id: string): Promise<boolean>;
}
