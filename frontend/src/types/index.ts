export interface User {
  id: number;
  roll_number: string;
  legacy_roll_number?: string | null;
  name: string;
  email: string | null;
  role: 'student' | 'admin';
  gender: 'male' | 'female';
  academic_year: number;
  degree_level?: string;
  is_pg_scholar?: boolean;
  campus_code?: string;
  school_code?: string;
  program_level?: string;
  program_duration_years?: number;
  department_code?: string;
  admission_batch_year?: number;
  section_letter?: string;
  section_digit?: number;
  section_sequence?: number;
  program_level_category?: string;
  synthetic_demo_record?: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Program {
  id: number;
  campus_code: string;
  school_code: string;
  program_level: string;
  program_duration_years: number;
  program_level_prefix: string;
  department_code: string;
  program_name: string;
  degree_level: string;
  is_active: boolean;
  created_at?: string;
}

export interface Section {
  id: number;
  program_id: number;
  admission_batch_year: number;
  section_letter: string;
  section_digit: number;
  capacity: number;
  current_count: number;
  is_active: boolean;
  program_name?: string;
  department_code?: string;
  program_level_prefix?: string;
}

export interface SharingConfig {
  id: number;
  hostel_id: number;
  sharing_type: number;
  fee_amount: number;
  is_available: boolean;
}

export interface Hostel {
  id: number;
  name: string;
  code?: string;
  gender: 'male' | 'female';
  description: string;
  total_floors: number;
  is_active: boolean;
  sharing_configs: SharingConfig[];
  floors?: number[];
}

export interface Room {
  id: number;
  hostel_id: number;
  room_number: string;
  room_code?: string;
  floor: number;
  sharing_capacity: number;
  occupied_beds: number;
  available_beds: number;
  is_active: boolean;
}

export interface Preference {
  rank: number;
  hostel_id: number | null;
  sharing_type: number | null;
  floor: number;
  flex_floor: boolean;
}

export interface GroupMember {
  id: number;
  group_id: number;
  student_id: number;
  student_name: string | null;
  student_roll: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  responded_at: string | null;
}

export interface Group {
  id: number;
  leader_student_id: number;
  group_size: number;
  status: 'pending' | 'confirmed' | 'rejected';
  members: GroupMember[];
}

export interface ApplicationPreferredRoom {
  id: number;
  application_id: number;
  room_id: number;
  room_number: string | null;
  priority: number;
}

export interface Application {
  id: number;
  registration_number: string;
  student_id: number;
  student?: User;
  preferences: (Preference | null)[];
  preferred_floor: number | null;
  flex_floor: boolean;
  roommate_mode: 'none' | 'group';
  group_id: number | null;
  group?: Group;
  preferred_rooms: ApplicationPreferredRoom[];
  status: 'submitted' | 'under_review' | 'allocated' | 'payment_completed' | 'rejected' | 'waitlisted';
  submitted_at: string;
}

export interface RoommateInvite {
  invitation_id: number;
  group_id: number;
  leader_name: string;
  leader_roll: string;
  group_size: number;
  created_at: string;
  members: GroupMember[];
}

export interface Allocation {
  id: number;
  application_id: number;
  student_id: number;
  student_name: string;
  student_roll: string;
  hostel_id: number;
  hostel_name: string;
  room_id: number;
  room_number: string;
  floor: number;
  sharing_type: number;
  preference_rank_satisfied: number;
  fee_amount: number;
  status: 'allocated' | 'payment_completed' | 'cancelled';
  allocated_at: string;
  roommates?: { name: string; roll_number: string }[];
}

export interface Payment {
  id: number;
  allocation_id: number;
  student_id: number;
  amount: number;
  payment_status: 'pending' | 'initiated' | 'successful' | 'failed';
  transaction_id: string | null;
  payment_method: string | null;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'invitation' | 'allocation' | 'payment' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  target_type: string;
  target_id: number | null;
  details: string;
  timestamp: string;
}
