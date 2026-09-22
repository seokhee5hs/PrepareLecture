import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { StatsOverview } from './components/StatsOverview.tsx';
import { ProgressManager } from './components/ProgressManager.tsx';
import { QaManager } from './components/QaManager.tsx';
import { QuizManager } from './components/QuizManager.tsx';
import { AssignmentManager } from './components/AssignmentManager.tsx';
import { CourseModal } from './components/CourseModal.tsx';
import {
  loadCourses,
  saveCourses,
  loadProgressMap,
  saveProgressMap,
  loadQaList,
  saveQaList,
  loadQuizzes,
  saveQuizzes,
  loadAssignments,
  saveAssignments,
  resetAllDataToDefault,
} from './utils/storage.ts';
import { generate16WeekSyllabus, INITIAL_COURSES, INITIAL_WEEK_PROGRESS, INITIAL_QA_ITEMS, INITIAL_QUIZZES, INITIAL_ASSIGNMENTS } from './data/hanshinData.ts';
import type {
  Course,
  ActiveTab,
  WeekProgress,
  QaItem,
  QuizItem,
  AssignmentItem,
} from './types/index.ts';

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('progress');
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  // Data states
  const [progressMap, setProgressMap] = useState<Record<string, WeekProgress[]>>({});
  const [qaList, setQaList] = useState<QaItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);

  // Initial load from storage
  useEffect(() => {
    const loadedCourses = loadCourses();
    setCourses(loadedCourses);
    if (loadedCourses.length > 0) {
      setSelectedCourseId(loadedCourses[0].id);
    }
    setProgressMap(loadProgressMap());
    setQaList(loadQaList());
    setQuizzes(loadQuizzes());
    setAssignments(loadAssignments());
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // If a course does not have a progress array yet, generate one
  const currentProgressList =
    selectedCourse && progressMap[selectedCourse.id]
      ? progressMap[selectedCourse.id]
      : selectedCourse
      ? generate16WeekSyllabus(selectedCourse)
      : [];

  const handleUpdateProgress = (updated: WeekProgress[]) => {
    if (!selectedCourse) return;
    const newMap = { ...progressMap, [selectedCourse.id]: updated };
    setProgressMap(newMap);
    saveProgressMap(newMap);
  };

  const handleUpdateQaList = (updated: QaItem[]) => {
    setQaList(updated);
    saveQaList(updated);
  };

  const handleUpdateQuizzes = (updated: QuizItem[]) => {
    setQuizzes(updated);
    saveQuizzes(updated);
  };

  const handleUpdateAssignments = (updated: AssignmentItem[]) => {
    setAssignments(updated);
    saveAssignments(updated);
  };

  const handleAddCourse = (newCourse: Course) => {
    const updatedCourses = [...courses, newCourse];
    setCourses(updatedCourses);
    saveCourses(updatedCourses);

    // Generate 16 weeks syllabus for the new course
    const newProgress = generate16WeekSyllabus(newCourse);
    const newMap = { ...progressMap, [newCourse.id]: newProgress };
    setProgressMap(newMap);
    saveProgressMap(newMap);

    setSelectedCourseId(newCourse.id);
  };

  const handleResetData = () => {
    if (confirm('모든 데이터를 한신대학교 초기 상태로 초기화하시겠습니까?')) {
      resetAllDataToDefault();
      setCourses(INITIAL_COURSES);
      setSelectedCourseId(INITIAL_COURSES[0].id);
      setProgressMap(INITIAL_WEEK_PROGRESS);
      setQaList(INITIAL_QA_ITEMS);
      setQuizzes(INITIAL_QUIZZES);
      setAssignments(INITIAL_ASSIGNMENTS);
      alert('초기 데이터로 재설정되었습니다.');
    }
  };

  // Badges for Navbar
  const courseQaList = selectedCourse ? qaList.filter((q) => q.courseId === selectedCourse.id) : [];
  const pendingQaCount = courseQaList.filter((q) => q.status === '미답변').length;

  const courseAssignments = selectedCourse ? assignments.filter((a) => a.courseId === selectedCourse.id) : [];

  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center text-slate-500 text-sm">강좌 데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Hanshin Header & Navigation Bar */}
      <Navbar
        courses={courses}
        selectedCourse={selectedCourse}
        onSelectCourse={(course) => setSelectedCourseId(course.id)}
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        onOpenNewCourseModal={() => setIsCourseModalOpen(true)}
        onResetData={handleResetData}
        unansweredQaCount={pendingQaCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Executive Summary Stats Ribbon */}
        <StatsOverview
          progressList={currentProgressList}
          qaList={courseQaList}
          quizzes={selectedCourse ? quizzes.filter((q) => q.courseId === selectedCourse.id) : []}
          assignments={courseAssignments}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />

        {/* Tab Modules */}
        {activeTab === 'progress' && (
          <ProgressManager
            course={selectedCourse}
            progressList={currentProgressList}
            onUpdateProgress={handleUpdateProgress}
          />
        )}

        {activeTab === 'qa' && (
          <QaManager
            course={selectedCourse}
            qaList={qaList}
            onUpdateQaList={handleUpdateQaList}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizManager
            course={selectedCourse}
            quizzes={quizzes}
            onUpdateQuizzes={handleUpdateQuizzes}
          />
        )}

        {activeTab === 'assignment' && (
          <AssignmentManager
            course={selectedCourse}
            assignments={assignments}
            onUpdateAssignments={handleUpdateAssignments}
          />
        )}
      </main>

      {/* Modal for opening a new Hanshin course */}
      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onAddCourse={handleAddCourse}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-800">한신대학교 교수학습지원센터 (CTL)</span>
            <span>·</span>
            <span>수업 준비 및 학사 운영 통합 포털</span>
          </div>
          <div className="text-slate-400">
            캠퍼스: 경기도 오산시 한신대길 137 한신대학교 송암관 / 장공관
          </div>
        </div>
      </footer>
    </div>
  );
}
