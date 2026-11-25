import { BookingStatus, ServiceType } from "./appointment";

export interface KpiMetric {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  description: string;
  iconName: string;
  colorScheme: "orange" | "blue" | "navy" | "green" | "purple";
}

export interface ActivityDataPoint {
  day: string;
  date: string;
  appointments: number;
  emergency: number;
  enquiries: number;
}

export interface RecentSubmissionItem {
  id: string;
  type: "appointment" | "emergency" | "contact" | "callback";
  customerName: string;
  phoneNumber: string;
  vehicleReg?: string;
  postcode: string;
  serviceType: ServiceType | string;
  status: BookingStatus | string;
  submittedAt: string;
  timingSlot?: string;
}

export interface EmailMetrics {
  totalSent: number;
  delivered: number;
  bounced: number;
  failed: number;
  pending: number;
  delayed: number;
  complaints: number;
  deliveryRate: number; // e.g. 98.5
  bounceRate: number; // e.g. 1.2
  opens?: number;
  clicks?: number;
  openRate?: number;
  clickRate?: number;
  hasTrackingData: boolean;
}

export interface RecentEmailActivityItem {
  id: string;
  recipient: string;
  subject: string;
  templateName: string;
  relatedRecord?: {
    type?: "appointment" | "enquiry" | "callback" | "user" | "customer";
    id?: string;
    referenceId?: string;
  };
  sentAt: string;
  status: "Sent" | "Failed" | "Queued" | "Delivered" | "Delayed" | "Bounced" | "Complained" | "Opened" | "Clicked";
  resendMessageId?: string;
  lastEventAt?: string;
}

export interface EmailPerformanceData {
  metrics: EmailMetrics;
  recentEmails: RecentEmailActivityItem[];
}

export interface DashboardOverviewData {
  kpis: {
    totalLeads: number;
    todayLeads: number;
    pendingAppointments: number;
    activeEmergencies: number;
    averageRating: number;
    totalReviews: number;
  };
  metrics: KpiMetric[];
  activityTrends: ActivityDataPoint[];
  recentSubmissions: RecentSubmissionItem[];
  emailPerformance?: EmailPerformanceData;
}
