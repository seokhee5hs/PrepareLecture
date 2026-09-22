import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Edit2,
  Save,
  CheckSquare,
  Square,
  Users,
  BookOpen,
  Sparkles,
  ChevronRight,
  FileText,
} from 'lucide-react';
import type { WeekProgress, ProgressStatus, ClassFormat, Course } from '../types/index.ts';

interface ProgressManagerProps {
  course: Course;
  progressList: WeekProgress[];
  onUpdateProgress: (updated: WeekProgress[]) => void;
}

export const ProgressManager: React.FC<ProgressManagerProps> = ({
  course,
  progressList,
  onUpdateProgress,
}) => {
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(4);
  const [statusFilter, setStatusFilter] = useState<'전체' | ProgressStatus>('전체');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const selectedWeek = progressList.find((w) => w.weekNumber === selectedWeekNum) || progressList[0];

  const filteredWeeks = progressList.filter((w) => {
    if (statusFilter === '전체') return true;
    return w.status === statusFilter;
  });

  const handleStatusChange = (weekNum: number, newStatus: ProgressStatus) => {
    const updated = progressList.map((w) => {
      if (w.weekNumber === weekNum) {
        return {
          ...w,
          status: newStatus,
          completedDate: newStatus === '완료' ? new Date().toISOString().split('T')[0] : w.completedDate,
        };
      }
      return w;
    });
    onUpdateProgress(updated);
  };

  const handleToggleTask = (weekNum: number, taskId: string) => {
    const updated = progressList.map((w) => {
      if (w.weekNumber === weekNum) {
        return {
          ...w,
          tasks: w.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
        };
      }
      return w;
    });
    onUpdateProgress(updated);
  };

  const handleAddTask = (weekNum: number) => {
    if (!newTaskInput.trim()) return;
    const updated = progressList.map((w) => {
      if (w.weekNumber === weekNum) {
        return {
          ...w,
          tasks: [
            ...w.tasks,
            { id: `task-${Date.now()}`, text: newTaskInput.trim(), done: false },
          ],
        };
      }
      return w;
    });
    onUpdateProgress(updated);
    setNewTaskInput('');
  };

  const handleSaveNotes = (weekNum: number) => {
    const updated = progressList.map((w) => {
      if (w.weekNumber === weekNum) {
        return { ...w, lectureNotes: tempNotes };
      }
      return w;
    });
    onUpdateProgress(updated);
    setEditingNotes(false);
  };

  const handleUpdateAttendance = (weekNum: number, present: number) => {
    const updated = progressList.map((w) => {
      if (w.weekNumber === weekNum) {
        return { ...w, attendancePresent: Math.min(present, w.attendanceTotal) };
      }
      return w;
    });
    onUpdateProgress(updated);
  };

  const handleGenerateAiPlan = async () => {
    setIsAiLoading(true);
    try {
      // Add realistic intelligent enhancements for the selected week
      const current = selectedWeek;
      const updated = progressList.map((w) => {
        if (w.weekNumber === current.weekNumber) {
          return {
            ...w,
            tasks: [
              ...w.tasks,
              { id: `ai-task-${Date.now()}-1`, text: `[AI추천] ${w.topic} 관련 핵심 실습 예제 및 디버깅 가이드 배포`, done: false },
              { id: `ai-task-${Date.now()}-2`, text: `[AI추천] 전공 학습자 이해도 사전 체크 퀴즈(3문항) 출제`, done: false },
            ],
            materials: w.materials ? `${w.materials} + [AI추천 최신 보충논문/사례자료]` : '보충 학습 핸드아웃',
          };
        }
        return w;
      });
      onUpdateProgress(updated);
      alert(`${current.weekNumber}주차 [${current.topic}]에 대한 수업 준비 과업과 보충자료가 추천되었습니다.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
              학사일정 16주차 진도 트래커
            </span>
            <span className="text-xs text-slate-500">{course.name} ({course.department})</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">수업 진도 관리 및 강의 일지</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            주차별 강의 계획과 실습 진도를 체계적으로 추적하고 강의 준비 체크리스트와 출결 및 수업 메모를 기록합니다.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
          {(['전체', '완료', '진행중', '예정', '보강필요'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Week List / Right Week Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 16-Week List */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-500">
            <span>주차별 강의 목록 ({filteredWeeks.length}개)</span>
            <span>중간고사 8주 / 기말고사 16주</span>
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredWeeks.map((week) => {
              const isSelected = week.weekNumber === selectedWeek.weekNumber;
              const isExam = week.weekNumber === 8 || week.weekNumber === 16;
              const completedTasksCount = week.tasks.filter((t) => t.done).length;

              return (
                <div
                  key={week.weekNumber}
                  onClick={() => {
                    setSelectedWeekNum(week.weekNumber);
                    setEditingNotes(false);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-50/60 border-rose-500 shadow-xs ring-1 ring-rose-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isExam
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : isSelected
                            ? 'bg-rose-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {week.weekNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">
                            {week.weekNumber}주차
                          </span>
                          <span className="text-[11px] font-medium px-1.5 py-0.2 rounded-sm bg-slate-100 text-slate-600">
                            {week.format}
                          </span>
                          {isExam && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-purple-600 text-white">
                              시험주간
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-800 mt-0.5 line-clamp-1">
                          {week.topic}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        week.status === '완료'
                          ? 'bg-emerald-100 text-emerald-800'
                          : week.status === '진행중'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : week.status === '보강필요'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {week.status}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <span>일정: {week.scheduledDate}</span>
                      <span>·</span>
                      <span>준비체크: {completedTasksCount}/{week.tasks.length}</span>
                    </div>
                    {week.attendancePresent > 0 && (
                      <span className="font-medium text-slate-700">
                        출석 {week.attendancePresent}/{week.attendanceTotal}명
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Week Deep Dive & Editor */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-6">
          {/* Header of Detail */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                  {selectedWeek.weekNumber}주차 상세 관리
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  예정일: {selectedWeek.scheduledDate}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedWeek.title}</h3>
            </div>

            {/* Quick Status Setter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">진도 상태:</span>
              <select
                value={selectedWeek.status}
                onChange={(e) => handleStatusChange(selectedWeek.weekNumber, e.target.value as ProgressStatus)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-rose-600"
              >
                <option value="예정">예정 (Scheduled)</option>
                <option value="진행중">진행중 (In Progress)</option>
                <option value="완료">완료 (Completed)</option>
                <option value="보강필요">보강필요 (Makeup Required)</option>
              </select>
            </div>
          </div>

          {/* Week Metadata & Learning Objectives */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-500">강의 주제 및 범위</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedWeek.topic}</div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500">핵심 학습 목표 (Learning Objectives)</span>
              <ul className="mt-1 space-y-1">
                {selectedWeek.objectives.map((obj, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedWeek.materials && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-xs">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-medium">교재/자료 범위:</span>
                <span className="text-slate-800 font-semibold">{selectedWeek.materials}</span>
              </div>
            )}
          </div>

          {/* Preparation Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-rose-600" />
                <h4 className="text-sm font-bold text-slate-900">수업 준비 체크리스트</h4>
              </div>
              <button
                onClick={handleGenerateAiPlan}
                disabled={isAiLoading}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-rose-600" />
                {isAiLoading ? 'AI 생성중...' : 'AI 준비과업 추천'}
              </button>
            </div>

            <div className="space-y-1.5">
              {selectedWeek.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(selectedWeek.weekNumber, task.id)}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    task.done
                      ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {task.done ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>{task.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Task input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask(selectedWeek.weekNumber)}
                placeholder="새로운 준비 작업 입력 (예: 송암관 전산실 빔프로젝터 점검)"
                className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-rose-600 bg-slate-50"
              />
              <button
                onClick={() => handleAddTask(selectedWeek.weekNumber)}
                className="text-xs font-semibold bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors shrink-0"
              >
                추가
              </button>
            </div>
          </div>

          {/* Attendance Tracker */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <div>
                <div className="text-xs font-bold text-slate-800">강의 출결 관리</div>
                <div className="text-[11px] text-slate-500">
                  출석률: {selectedWeek.attendanceTotal > 0 ? Math.round((selectedWeek.attendancePresent / selectedWeek.attendanceTotal) * 100) : 0}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">출석 인원:</span>
              <input
                type="number"
                min="0"
                max={selectedWeek.attendanceTotal}
                value={selectedWeek.attendancePresent}
                onChange={(e) => handleUpdateAttendance(selectedWeek.weekNumber, Number(e.target.value))}
                className="w-14 text-center font-bold text-xs bg-white border border-slate-200 rounded-lg py-1 text-slate-900"
              />
              <span className="text-xs text-slate-500">/ {selectedWeek.attendanceTotal}명</span>
            </div>
          </div>

          {/* Professor Lecture Notes / Log */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <h4 className="text-sm font-bold text-slate-900">교수자 강의 일지 및 학생 피드백 메모</h4>
              </div>
              {editingNotes ? (
                <button
                  onClick={() => handleSaveNotes(selectedWeek.weekNumber)}
                  className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  저장하기
                </button>
              ) : (
                <button
                  onClick={() => {
                    setTempNotes(selectedWeek.lectureNotes);
                    setEditingNotes(true);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  일지 편집
                </button>
              )}
            </div>

            {editingNotes ? (
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                rows={4}
                placeholder="해당 주차 수업 진행 소감, 학생들의 이해도 취약점, 다음 주차 보강 사항 등을 자유롭게 기록하세요."
                className="w-full text-xs border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-rose-600 bg-white"
              />
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 min-h-[70px] whitespace-pre-wrap">
                {selectedWeek.lectureNotes || (
                  <span className="text-slate-400 italic">
                    등록된 강의 일지가 없습니다. [일지 편집]을 눌러 수업 후기를 기록해보세요.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
