export type ProgressStatus = '예정' | '진행중' | '완료' | '보강필요';
export type ClassFormat = '이론강의' | '실습실습' | '팀프로젝트' | '시험평가' | '토론발표';

export interface PreparationTask {
  id: string;
  text: string;
  done: boolean;
}

export interface WeekProgress {
  weekNumber: number; // 1 ~ 16
  title: string;
  topic: string;
  objectives: string[];
  format: ClassFormat;
  status: ProgressStatus;
  scheduledDate: string;
  completedDate?: string;
  materials?: string; // 교재/슬라이드 범위 (예: Ch 03. 스택과 큐)
  tasks: PreparationTask[];
  lectureNotes: string; // 수업 일지 및 학생 피드백 메모
  attendancePresent: number;
  attendanceTotal: number;
}

export type QaCategory = '강의내용' | '과제/실습' | '시험/평가' | '학습상담' | '기타';
export type QaStatus = '미답변' | '검토중' | '답변완료';

export interface QaItem {
  id: string;
  courseId: string;
  weekNumber: number;
  studentName: string;
  studentId: string;
  studentMajor: string;
  category: QaCategory;
  title: string;
  content: string;
  status: QaStatus;
  createdAt: string;
  isPinned: boolean;
  isPublic: boolean;
  answer?: {
    content: string;
    answeredAt: string;
    aiDraftUsed?: boolean;
    professorName?: string;
  };
}

export type QuizQuestionType = 'multiple_choice' | 'short_answer' | 'ox';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: string[]; // 4지선다형 또는 O/X
  correctAnswer: string; // "0".."3", "단어", "O"/"X"
  explanation: string;
  points: number;
}

export interface QuizSubmission {
  id: string;
  studentName: string;
  studentId: string;
  studentMajor: string;
  submittedAt: string;
  score: number;
  answers: Record<string, string>;
  isCorrectMap: Record<string, boolean>;
}

export interface QuizItem {
  id: string;
  courseId: string;
  weekNumber: number;
  title: string;
  description: string;
  timeLimitMinutes: number;
  totalPoints: number;
  status: '준비중' | '배포중' | '종료';
  createdAt: string;
  questions: QuizQuestion[];
  submissions: QuizSubmission[];
}

export type AssignmentStatus = '진행중' | '마감' | '채점완료';
export type SubmissionStatus = '제출완료' | '지각제출' | '미제출';

export interface RubricItem {
  id: string;
  criterion: string;
  maxPoints: number;
}

export interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentMajor: string;
  status: SubmissionStatus;
  submittedAt?: string;
  fileName?: string;
  fileSize?: string;
  score?: number; // 0 ~ 100
  feedback?: string;
  gradedAt?: string;
}

export interface AssignmentItem {
  id: string;
  courseId: string;
  weekNumber: number;
  title: string;
  description: string;
  deadline: string;
  totalPoints: number;
  allowedFileTypes: string[]; // e.g. ["PDF", "ZIP", "IPYNB", "DOCX"]
  status: AssignmentStatus;
  createdAt: string;
  rubrics: RubricItem[];
  submissions: StudentSubmission[];
}

export interface HanshinMajor {
  college: string;
  department: string;
  code: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  college: string;
  department: string;
  grade: number; // 1~4학년
  semester: string; // "2026학년도 1학기"
  classroom: string;
  schedule: string;
  professorName: string;
  enrolledStudents: number;
}

export type ActiveTab = 'progress' | 'qa' | 'quiz' | 'assignment';
