/**
 * Resolves backend base URL at runtime:
 * - Server-side (functions/SSR): uses BACKEND_URL injected by Vercel service binding
 * - Client-side (browser): uses NEXT_PUBLIC_API_URL if set, or empty string '' for same-origin Vercel rewrite
 * - Fallback (local dev): http://localhost:5000
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type UserType = 'student' | 'teacher';

export interface UserSession {
  _id?: string;
  username: string;
  email: string;
  userType: UserType;
  role?: string;
  studentId?: string;
  studentName?: string;
  employeeId?: string;
  department?: string;
  hasStudentRecord?: boolean;
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  userType: UserType;
  employeeId?: string;
  department?: string;
}

export interface SigninPayload {
  email: string;
  password: string;
  userType: UserType;
}

export interface StudentRegistrationPayload {
  studentName: string;
  studentId: string;
  department: string;
  year: string;
  division: string;
  semester: string;
  email: string;
  phoneNumber: string;
  images: string[]; // 5 base64 jpeg strings
}

export interface StudentRecord {
  _id: string;
  studentName: string;
  studentId: string;
  department: string;
  year: string;
  division: string;
  semester: string;
  email: string;
  phoneNumber: string;
  status?: string;
  face_registered?: boolean;
  created_at?: number;
  updated_at?: number;
}

export interface StudentStats {
  total_students: number;
  face_registered: number;
  by_department: Array<{ _id: string; count: number }>;
  by_year: Array<{ _id: string; count: number }>;
}

export interface AttendanceRecord {
  studentId: string;
  studentName?: string;
  name?: string;
  date: string;
  subject: string;
  department: string;
  year: string;
  division: string;
  status: 'present' | 'absent';
  markedAt?: string | null;
}

export interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
}

export interface AttendanceQueryFilters {
  date?: string;
  department?: string;
  year?: string;
  division?: string;
  subject?: string;
  student_id?: string;
}

export interface CreateSessionPayload {
  date: string;
  subject: string;
  department: string;
  year: string;
  division: string;
}

export interface CreateSessionResponse {
  session_id: string;
  students_count: number;
}

export interface FaceMatch {
  user_id: string;
  name: string;
}

export interface RealMarkFaceResult {
  match: FaceMatch | null;
  confidence?: number | null;
  distance?: number | null;
  box: [number, number, number, number];
  already_marked?: boolean;
  status: 'marked_present' | 'marked_present_new' | 'duplicate' | 'no_match';
  message?: string;
}

export interface RealMarkResponse {
  message?: string;
  faces: RealMarkFaceResult[];
  processing_time?: number;
  session_info?: {
    session_id: string;
    total_present_now: number;
    faces_detected?: number;
    duplicates_prevented?: number;
  };
}

export interface EndSessionResponse {
  success: boolean;
  statistics: {
    present_count: number;
    absent_count: number;
    total_students: number;
  };
}

export interface ModelsStatusResponse {
  success?: boolean;
  models_ready: boolean;
  health_check: boolean;
  timestamp?: number;
}

// Session Storage Helpers adhering strictly to contract:
// keys: ams_user, ams_email, ams_userType
export function getStoredSession(): { user: UserSession | null; email: string | null; userType: UserType | null } {
  if (typeof window === 'undefined') {
    return { user: null, email: null, userType: null };
  }
  const userJson = localStorage.getItem('ams_user');
  const email = localStorage.getItem('ams_email');
  const userType = localStorage.getItem('ams_userType') as UserType | null;

  let user: UserSession | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch {
      user = null;
    }
  }

  return { user, email, userType };
}

export function setStoredSession(user: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ams_user', JSON.stringify(user));
  localStorage.setItem('ams_email', user.email);
  localStorage.setItem('ams_userType', user.userType);
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ams_user');
  localStorage.removeItem('ams_email');
  localStorage.removeItem('ams_userType');
  // Clean up any legacy keys
  localStorage.removeItem('snapPresent_user');
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', headers = {}, body } = options;
  const { email, userType } = getStoredSession();

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (email) {
    reqHeaders['X-User-Email'] = email;
  }
  if (userType) {
    reqHeaders['X-User-Type'] = userType;
  }

  const base = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth endpoints
  signup: (payload: SignupPayload) =>
    request<{ success: boolean; message: string }>('/api/signup', {
      method: 'POST',
      body: payload,
    }),

  signin: (payload: SigninPayload) =>
    request<{ success: boolean; message: string; user: UserSession; userType: UserType }>('/api/signin', {
      method: 'POST',
      body: payload,
    }),

  logout: () =>
    request<{ success: boolean; message: string }>('/api/logout', {
      method: 'POST',
    }),

  getUserProfile: () =>
    request<{ success: boolean; user: UserSession }>('/api/user/profile'),

  // Student endpoints
  registerStudent: (payload: StudentRegistrationPayload) =>
    request<{ success: boolean; studentId: string; record_id: string }>('/api/register-student', {
      method: 'POST',
      body: payload,
    }),

  getOwnStudentRecords: () =>
    request<{ success: boolean; students: StudentRecord[]; count: number }>('/api/students'),

  getStudentById: (id: string) =>
    request<{ success: boolean; student: StudentRecord }>(`/api/students/${id}`),

  updateStudent: (id: string, payload: Partial<StudentRecord>) =>
    request<{ success: boolean; message: string }>(`/api/students/${id}`, {
      method: 'PUT',
      body: payload,
    }),

  deleteStudent: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/students/${id}`, {
      method: 'DELETE',
    }),

  // Faculty/Admin student directory endpoints
  getAdminStudents: (params?: { search?: string; department?: string; year?: string; division?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.department) searchParams.set('department', params.department);
    if (params?.year) searchParams.set('year', params.year);
    if (params?.division) searchParams.set('division', params.division);
    const queryString = searchParams.toString();
    return request<{ success: boolean; students: StudentRecord[]; count: number }>(
      `/api/admin/students${queryString ? `?${queryString}` : ''}`
    );
  },

  getStudentStats: () =>
    request<{ success: boolean; stats: StudentStats }>('/api/students/stats'),

  // Attendance endpoints
  getAttendance: (filters?: AttendanceQueryFilters) => {
    const searchParams = new URLSearchParams();
    if (filters?.date) searchParams.set('date', filters.date);
    if (filters?.department) searchParams.set('department', filters.department);
    if (filters?.year) searchParams.set('year', filters.year);
    if (filters?.division) searchParams.set('division', filters.division);
    if (filters?.subject) searchParams.set('subject', filters.subject);
    if (filters?.student_id) searchParams.set('student_id', filters.student_id);
    const queryString = searchParams.toString();
    return request<{
      success: boolean;
      attendance: AttendanceRecord[];
      stats: AttendanceStats;
    }>(`/api/attendance${queryString ? `?${queryString}` : ''}`);
  },

  getAttendanceExport: (filters?: AttendanceQueryFilters) => {
    const searchParams = new URLSearchParams();
    if (filters?.date) searchParams.set('date', filters.date);
    if (filters?.department) searchParams.set('department', filters.department);
    if (filters?.year) searchParams.set('year', filters.year);
    if (filters?.division) searchParams.set('division', filters.division);
    if (filters?.subject) searchParams.set('subject', filters.subject);
    const queryString = searchParams.toString();
    return request<{ success: boolean; data: AttendanceRecord[] }>(
      `/api/attendance/export${queryString ? `?${queryString}` : ''}`
    );
  },

  createSession: (payload: CreateSessionPayload) =>
    request<CreateSessionResponse>('/api/attendance/create_session', {
      method: 'POST',
      body: payload,
    }),

  realMarkAttendance: (sessionId: string, imageBase64: string) =>
    request<RealMarkResponse>('/api/attendance/real-mark', {
      method: 'POST',
      body: { session_id: sessionId, image: imageBase64 },
    }),

  endSession: (sessionId: string) =>
    request<EndSessionResponse>('/api/attendance/end_session', {
      method: 'POST',
      body: { session_id: sessionId },
    }),

  getModelsStatus: () =>
    request<ModelsStatusResponse>('/api/attendance/models/status'),
};
