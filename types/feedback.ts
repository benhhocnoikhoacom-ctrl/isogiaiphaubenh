export interface Feedback {
  id?: string;
  name: string;
  email?: string;
  content: string;
  rating?: number;
  status: "new" | "reviewed" | "resolved";
  createdAt: Date;
}
