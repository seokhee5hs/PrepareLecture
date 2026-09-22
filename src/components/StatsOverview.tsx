import React from 'react';
import {
  TrendingUp,
  HelpCircle,
  Award,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { WeekProgress, QaItem, QuizItem, AssignmentItem } from '../types/index.ts';

interface StatsOverviewProps {
  progressList: WeekProgress[];
  qaList: QaItem[];
  quizzes: QuizItem[];
  assignments: AssignmentItem[];
  onNavigateToTab: (tab: 'progress' | 'qa' | 'quiz' | 'assignment') => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  progressList,
  qaList,
  quizzes,
  assignments,
  onNavigateToTab,
}) => {
  // 1. Progress Stats
  const completedWeeks = progressList.filter((w) => w.status === '완료').length;
  const inProgressWeeks = progressList.filter((w) => w.status === '진행중').length;
  const currentWeek = progressList.find((w) => w.status === '진행중') || progressList[0];
  const progressPercent = Math.round((completedWeeks / (progressList.length || 16)) * 100);

  // 2. QA Stats
  const pendingQa = qaList.filter((q) => q.status === '미답변').length;
  const reviewingQa = qaList.filter((q) => q.status === '검토중').length;
  const answeredQa = qaList.filter((q) => q.status === '답변완료').length;

  // 3. Quiz Stats
  const activeQuizzes = quizzes.filter((q) => q.status === '배포중').length;
  const totalSubmissions = quizzes.reduce((acc, q) => acc + (q.submissions?.length || 0), 0);
  const quizScores = quizzes.flatMap((q) => q.submissions.map((s) => s.score));
  const avgQuizScore = quizScores.length > 0 ? (quizScores.reduce((a, b) => a + b, 0) / quizScores.length).toFixed(1) : '-';

  // 4. Assignment Stats
  const totalAssignments = assignments.length;
  const allSubmissions = assignments.flatMap((a) => a.submissions);
  const totalSubmitted = allSubmissions.filter((s) => s.status === '제출완료' || s.status === '지각제출').length;
  const totalGraded = allSubmissions.filter((s) => s.score !== undefined).length;
  const gradingRate = allSubmissions.length > 0 ? Math.round((totalGraded / allSubmissions.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. 진도 현황 카드 */}
      <div
        onClick={() => onNavigateToTab('progress')}
        className="bg-white rounded-xl p-4 border border-slate-200/90 hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
            16주차 수업 진도율
          </span>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
            {currentWeek ? `${currentWeek.weekNumber}주차 진행중` : '준비'}
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {progressPercent}%
            <span className="text-xs font-normal text-slate-500 ml-1.5">
              ({completedWeeks}주 완료 / 총 16주)
            </span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className="bg-rose-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-500 mt-2 truncate">
          이번 주: <span className="text-slate-800 font-medium">{currentWeek?.topic || '학기 준비'}</span>
        </div>
      </div>

      {/* 2. 학생 Q&A 현황 카드 */}
      <div
        onClick={() => onNavigateToTab('qa')}
        className="bg-white rounded-xl p-4 border border-slate-200/90 hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            학생 질문 현황
          </span>
          {pendingQa > 0 && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              답변 대기 {pendingQa}건
            </span>
          )}
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {pendingQa}
            <span className="text-xs font-normal text-slate-500 ml-1">건 미답변</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>완료 {answeredQa}건</span>
            <span>·</span>
            <span>검토 {reviewingQa}건</span>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-100/80 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            AI 답변 초안 지원
          </span>
          <span className="font-semibold underline">바로 처리 &rarr;</span>
        </div>
      </div>

      {/* 3. 퀴즈 현황 카드 */}
      <div
        onClick={() => onNavigateToTab('quiz')}
        className="bg-white rounded-xl p-4 border border-slate-200/90 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            자동 채점 퀴즈
          </span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            배포중 {activeQuizzes}개
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {avgQuizScore}
            <span className="text-xs font-normal text-slate-500 ml-1">점 평균</span>
          </div>
          <div className="text-xs text-slate-500">
            총 {totalSubmissions}회 응시
          </div>
        </div>
        <div className="mt-3 text-[11px] text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-100/80 flex items-center justify-between">
          <span>문항 즉시 자동채점</span>
          <span className="font-semibold text-emerald-700">문항 관리 &rarr;</span>
        </div>
      </div>

      {/* 4. 과제 및 평가 현황 카드 */}
      <div
        onClick={() => onNavigateToTab('assignment')}
        className="bg-white rounded-xl p-4 border border-slate-200/90 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
            과제 평가 진행률
          </span>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
            {totalAssignments}개 과제
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {gradingRate}%
            <span className="text-xs font-normal text-slate-500 ml-1.5">
              ({totalGraded}/{allSubmissions.length || 0}명)
            </span>
          </div>
          <div className="text-xs text-slate-500">
            제출 {totalSubmitted}건
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${gradingRate}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
          <span>미채점: {Math.max(0, allSubmissions.length - totalGraded)}명</span>
          <span className="text-indigo-600 font-semibold group-hover:underline">평가하기 &rarr;</span>
        </div>
      </div>
    </div>
  );
};
