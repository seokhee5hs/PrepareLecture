import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  HelpCircle,
  Award,
  FileCheck,
  ChevronDown,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { Course, ActiveTab } from '../types/index.ts';

interface NavbarProps {
  courses: Course[];
  selectedCourse: Course;
  onSelectCourse: (course: Course) => void;
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenNewCourseModal: () => void;
  onResetData: () => void;
  unansweredQaCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  courses,
  selectedCourse,
  onSelectCourse,
  activeTab,
  onChangeTab,
  onOpenNewCourseModal,
  onResetData,
  unansweredQaCount,
}) => {
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Hanshin Brand Bar */}
      <div className="bg-slate-900 text-slate-100 text-xs px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-semibold tracking-wide">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-rose-400 font-bold">한신대학교</span>
              <span className="text-slate-400">HANSHIN UNIVERSITY</span>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-300 font-medium">교수학습지원 포털 · 수업 준비 및 학사관리 시스템</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-rose-950/80 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded-sm text-[11px] font-medium">
              2026학년도 1학기
            </span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <GraduationCap className="w-3.5 h-3.5 text-rose-400" />
              <span>{selectedCourse.professorName}</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('예시 데이터를 초기 상태로 복원하시겠습니까?')) {
                  onResetData();
                }
              }}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 ml-2 text-[11px] transition-colors"
              title="데이터 초기화"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden md:inline">초기화</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Course Bar & Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Current Course Selector */}
          <div className="relative">
            <button
              id="course-selector-btn"
              onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
              className="group flex items-center gap-3 text-left p-1.5 -ml-1.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-rose-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                HS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    {selectedCourse.department}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{selectedCourse.code}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <h1 className="text-lg font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                    {selectedCourse.name}
                  </h1>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {courseDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCourseDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-96 max-w-[90vw] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100">
                  <div className="p-3 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">담당 개설 강좌 목록</span>
                    <button
                      onClick={() => {
                        setCourseDropdownOpen(false);
                        onOpenNewCourseModal();
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      새 강좌 등록
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1.5">
                    {courses.map((course) => {
                      const isSelected = course.id === selectedCourse.id;
                      return (
                        <button
                          key={course.id}
                          onClick={() => {
                            onSelectCourse(course);
                            setCourseDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-lg text-sm transition-colors flex items-start justify-between ${
                            isSelected
                              ? 'bg-rose-50 text-rose-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs text-slate-500 font-medium">
                              {course.department} · {course.grade}학년
                            </div>
                            <div className="font-semibold mt-0.5">{course.name}</div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                              <span>{course.schedule}</span>
                              <span>·</span>
                              <span>{course.classroom}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-[11px] bg-rose-600 text-white px-2 py-0.5 rounded-full shrink-0 font-medium">
                              현재 선택
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200/80 flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">강의실:</span>
              <span className="font-semibold text-slate-900">{selectedCourse.classroom}</span>
            </div>
            <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200/80 flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">수강인원:</span>
              <span className="font-semibold text-slate-900">{selectedCourse.enrolledStudents}명</span>
            </div>
            <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200/80 flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">강의시간:</span>
              <span className="font-semibold text-slate-900">{selectedCourse.schedule}</span>
            </div>
          </div>
        </div>

        {/* 4 Core Module Navigation Tabs */}
        <nav className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <button
            id="tab-progress"
            onClick={() => onChangeTab('progress')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'progress'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>수업 진도 관리</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
              activeTab === 'progress' ? 'bg-rose-800 text-rose-100' : 'bg-slate-200 text-slate-700'
            }`}>
              16주차
            </span>
          </button>

          <button
            id="tab-qa"
            onClick={() => onChangeTab('qa')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'qa'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>학생 Q&A 모듈</span>
            {unansweredQaCount > 0 ? (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500 text-white animate-pulse">
                {unansweredQaCount} 미답변
              </span>
            ) : (
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
                activeTab === 'qa' ? 'bg-rose-800 text-rose-100' : 'bg-slate-200 text-slate-700'
              }`}>
                관리
              </span>
            )}
          </button>

          <button
            id="tab-quiz"
            onClick={() => onChangeTab('quiz')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'quiz'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>퀴즈 출제 & 자동채점</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-medium flex items-center gap-0.5 ${
              activeTab === 'quiz' ? 'bg-rose-800 text-rose-100' : 'bg-rose-100 text-rose-800'
            }`}>
              <Sparkles className="w-2.5 h-2.5" />
              AI출제
            </span>
          </button>

          <button
            id="tab-assignment"
            onClick={() => onChangeTab('assignment')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'assignment'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>과제 관리 & 평가</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
