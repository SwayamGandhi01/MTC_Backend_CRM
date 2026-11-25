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
  status: BookingStatus;
  submittedAt: string;
  timingSlot?: string;
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
}
