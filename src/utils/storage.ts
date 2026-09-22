import type {
  Course,
  WeekProgress,
  QaItem,
  QuizItem,
  AssignmentItem,
} from '../types/index.ts';
import {
  INITIAL_COURSES,
  INITIAL_WEEK_PROGRESS,
  INITIAL_QA_ITEMS,
  INITIAL_QUIZZES,
  INITIAL_ASSIGNMENTS,
} from '../data/hanshinData.ts';

const STORAGE_KEYS = {
  COURSES: 'hanshin_prof_courses_v1',
  SELECTED_COURSE_ID: 'hanshin_prof_selected_course_v1',
  PROGRESS: 'hanshin_prof_progress_v1',
  QA: 'hanshin_prof_qa_v1',
  QUIZ: 'hanshin_prof_quiz_v1',
  ASSIGNMENT: 'hanshin_prof_assignment_v1',
};

export function loadStoredCourses(): Course[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COURSES);
    return data ? JSON.parse(data) : INITIAL_COURSES;
  } catch {
    return INITIAL_COURSES;
  }
}

export function saveStoredCourses(courses: Course[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  } catch (e) {
    console.error('Failed to save courses to localStorage', e);
  }
}

export function loadSelectedCourseId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.SELECTED_COURSE_ID);
    return id || INITIAL_COURSES[0].id;
  } catch {
    return INITIAL_COURSES[0].id;
  }
}

export function saveSelectedCourseId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_COURSE_ID, id);
  } catch (e) {
    console.error('Failed to save selected course id', e);
  }
}

export function loadStoredProgress(): Record<string, WeekProgress[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : INITIAL_WEEK_PROGRESS;
  } catch {
    return INITIAL_WEEK_PROGRESS;
  }
}

export function saveStoredProgress(progressMap: Record<string, WeekProgress[]>) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressMap));
  } catch (e) {
    console.error('Failed to save progress to localStorage', e);
  }
}

export function loadStoredQa(): QaItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.QA);
    return data ? JSON.parse(data) : INITIAL_QA_ITEMS;
  } catch {
    return INITIAL_QA_ITEMS;
  }
}

export function saveStoredQa(qaList: QaItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.QA, JSON.stringify(qaList));
  } catch (e) {
    console.error('Failed to save QA to localStorage', e);
  }
}

export function loadStoredQuizzes(): QuizItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.QUIZ);
    return data ? JSON.parse(data) : INITIAL_QUIZZES;
  } catch {
    return INITIAL_QUIZZES;
  }
}

export function saveStoredQuizzes(quizzes: QuizItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.QUIZ, JSON.stringify(quizzes));
  } catch (e) {
    console.error('Failed to save quizzes to localStorage', e);
  }
}

export function loadStoredAssignments(): AssignmentItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ASSIGNMENT);
    return data ? JSON.parse(data) : INITIAL_ASSIGNMENTS;
  } catch {
    return INITIAL_ASSIGNMENTS;
  }
}

export function saveStoredAssignments(assignments: AssignmentItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENT, JSON.stringify(assignments));
  } catch (e) {
    console.error('Failed to save assignments to localStorage', e);
  }
}

export function resetAllDataToDefault() {
  try {
    localStorage.removeItem(STORAGE_KEYS.COURSES);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_COURSE_ID);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.QA);
    localStorage.removeItem(STORAGE_KEYS.QUIZ);
    localStorage.removeItem(STORAGE_KEYS.ASSIGNMENT);
  } catch (e) {
    console.error('Failed to reset localStorage', e);
  }
}

// Aliases for cleaner imports
export const loadCourses = loadStoredCourses;
export const saveCourses = saveStoredCourses;
export const loadProgressMap = loadStoredProgress;
export const saveProgressMap = saveStoredProgress;
export const loadQaList = loadStoredQa;
export const saveQaList = saveStoredQa;
export const loadQuizzes = loadStoredQuizzes;
export const saveQuizzes = saveStoredQuizzes;
export const loadAssignments = loadStoredAssignments;
export const saveAssignments = saveStoredAssignments;
