import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Award,
  Edit3,
  Calendar,
  Layers,
  ChevronRight,
  UserCheck,
  Send,
} from 'lucide-react';
import type {
  AssignmentItem,
  StudentSubmission,
  RubricItem,
  Course,
} from '../types/index.ts';

interface AssignmentManagerProps {
  course: Course;
  assignments: AssignmentItem[];
  onUpdateAssignments: (updated: AssignmentItem[]) => void;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({
  course,
  assignments,
  onUpdateAssignments,
}) => {
  const courseAssignments = assignments.filter((a) => a.courseId === course.id);
  const [selectedAsgId, setSelectedAsgId] = useState<string>(courseAssignments[0]?.id || '');
  
  // Grading Modal State
  const [gradingSubmission, setGradingSubmission] = useState<StudentSubmission | null>(null);
  const [scoreInput, setScoreInput] = useState<number>(90);
  const [feedbackInput, setFeedbackInput] = useState<string>('');

  // New Assignment Modal State
  const [isNewAsgModalOpen, setIsNewAsgModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newWeek, setNewWeek] = useState(4);
  const [newDeadline, setNewDeadline] = useState('2026-04-10 23:59');
  const [newTotalPoints, setNewTotalPoints] = useState(100);
  const [newDesc, setNewDesc] = useState('');

  // Filter on submission table
  const [statusFilter, setStatusFilter] = useState<'전체' | '채점대기' | '채점완료' | '미제출'>('전체');

  const selectedAsg = courseAssignments.find((a) => a.id === selectedAsgId) || courseAssignments[0];

  const handleOpenGrading = (sub: StudentSubmission) => {
    setGradingSubmission(sub);
    setScoreInput(sub.score !== undefined ? sub.score : 85);
    setFeedbackInput(sub.feedback || '');
  };

  const handleSaveGrade = () => {
    if (!selectedAsg || !gradingSubmission) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updatedSubmissions = selectedAsg.submissions.map((s) => {
      if (s.id === gradingSubmission.id) {
        return {
          ...s,
          score: Number(scoreInput),
          feedback: feedbackInput.trim(),
          gradedAt: formattedDate,
        };
      }
      return s;
    });

    const updated = assignments.map((a) => {
      if (a.id === selectedAsg.id) {
        return {
          ...a,
          submissions: updatedSubmissions,
        };
      }
      return a;
    });

    onUpdateAssignments(updated);
    setGradingSubmission(null);
  };

  const handleCreateAssignment = () => {
    if (!newTitle.trim()) return;

    const defaultStudents = [
      { id: '20241042', name: '김민준', major: course.department },
      { id: '20241088', name: '이지은', major: course.department },
      { id: '20231005', name: '정우진', major: '컴퓨터공학전공' },
      { id: '20241019', name: '박서현', major: '인공지능융합전공' },
      { id: '20241055', name: '최동현', major: course.department },
      { id: '20241062', name: '강예은', major: course.department },
      { id: '20241071', name: '윤도현', major: '데이터사이언스학부' },
    ];

    const initialSubs: StudentSubmission[] = defaultStudents.map((st, i) => ({
      id: `sub-${Date.now()}-${i}`,
      studentId: st.id,
      studentName: st.name,
      studentMajor: st.major,
      status: i < 4 ? '제출완료' : '미제출',
      submittedAt: i < 4 ? '2026-04-05 14:20' : undefined,
      fileName: i < 4 ? `${st.id}_${st.name}_과제.zip` : undefined,
      fileSize: i < 4 ? '2.1 MB' : undefined,
    }));

    const newAssignment: AssignmentItem = {
      id: `asg-${Date.now()}`,
      courseId: course.id,
      weekNumber: newWeek,
      title: newTitle.trim(),
      description: newDesc.trim() || '해당 주차 핵심 실습 및 결과 보고서를 제출하세요.',
      deadline: newDeadline,
      totalPoints: newTotalPoints,
      allowedFileTypes: ['ZIP', 'PDF'],
      status: '진행중',
      createdAt: new Date().toISOString().split('T')[0],
      rubrics: [
        { id: 'r1', criterion: '알고리즘 구현의 정확성 및 동작 테스트 통과', maxPoints: 50 },
        { id: 'r2', criterion: '예외 처리 및 메모리 자원 관리', maxPoints: 30 },
        { id: 'r3', criterion: '보고서 문서화 및 코드 가독성', maxPoints: 20 },
      ],
      submissions: initialSubs,
    };

    const updated = [newAssignment, ...assignments];
    onUpdateAssignments(updated);
    setSelectedAsgId(newAssignment.id);
    setIsNewAsgModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleExportCsv = () => {
    if (!selectedAsg) return;
    const rows = [
      ['학번', '성명', '전공', '제출상태', '제출일시', '점수', '평가피드백'],
      ...selectedAsg.submissions.map((s) => [
        s.studentId,
        s.studentName,
        s.studentMajor,
        s.status,
        s.submittedAt || '-',
        s.score !== undefined ? String(s.score) : '미채점',
        `"${(s.feedback || '').replace(/"/g, '""')}"`,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${course.code}_${selectedAsg.title}_성적표.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats for selected assignment
  const totalStudents = selectedAsg?.submissions.length || 0;
  const submittedCount = selectedAsg?.submissions.filter((s) => s.status === '제출완료' || s.status === '지각제출').length || 0;
  const gradedCount = selectedAsg?.submissions.filter((s) => s.score !== undefined).length || 0;
  const unsubmittedCount = selectedAsg?.submissions.filter((s) => s.status === '미제출').length || 0;
  const submissionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
  const gradingRate = submittedCount > 0 ? Math.round((gradedCount / submittedCount) * 100) : 0;
  
  const gradedScores = selectedAsg?.submissions.filter((s) => s.score !== undefined).map((s) => s.score!) || [];
  const avgScore = gradedScores.length > 0 ? (gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length).toFixed(1) : '-';

  // Filtered submissions
  const filteredSubmissions = selectedAsg?.submissions.filter((s) => {
    if (statusFilter === '전체') return true;
    if (statusFilter === '미제출') return s.status === '미제출';
    if (statusFilter === '채점완료') return s.score !== undefined;
    if (statusFilter === '채점대기') return (s.status === '제출완료' || s.status === '지각제출') && s.score === undefined;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              학습 성과 평가 및 피드백
            </span>
            <span className="text-xs text-slate-500">한신대 {course.name}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">과제 제출 및 평가 진행 상황 확인</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            학생들의 과제 제출 현황(제출/지각/미제출)을 실시간으로 확인하고 루브릭 기준에 따라 점수와 맞춤형 피드백을 등록합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={!selectedAsg}
            className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            성적 CSV 내보내기
          </button>
          <button
            onClick={() => setIsNewAsgModalOpen(true)}
            className="bg-rose-700 hover:bg-rose-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            새 과제 등록
          </button>
        </div>
      </div>

      {/* Assignment Selector Pills */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-2 overflow-x-auto">
        {courseAssignments.map((asg) => {
          const isSelected = asg.id === selectedAsg?.id;
          return (
            <button
              key={asg.id}
              onClick={() => setSelectedAsgId(asg.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{asg.weekNumber}주차: {asg.title.split(':')[0]}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-rose-800 text-rose-100' : 'bg-slate-200 text-slate-600'
              }`}>
                {asg.totalPoints}점 만점
              </span>
            </button>
          );
        })}
      </div>

      {selectedAsg ? (
        <>
          {/* Assignment Overview & Metric Cards */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                    {selectedAsg.weekNumber}주차 과제
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    마감일시: <strong className="text-slate-800">{selectedAsg.deadline}</strong>
                  </span>
                  <span className="text-slate-500">
                    허용형식: {selectedAsg.allowedFileTypes.join(', ')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedAsg.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedAsg.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200">
                  배점: {selectedAsg.totalPoints}점
                </span>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-xs font-medium text-slate-500">총 수강 인원</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{totalStudents}명</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-xs font-medium text-slate-500">제출률</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {submissionRate}% <span className="text-xs font-normal text-slate-500">({submittedCount}명 제출)</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-xs font-medium text-slate-500">채점 진행률</div>
                <div className="text-lg font-bold text-indigo-700 mt-0.5">
                  {gradingRate}% <span className="text-xs font-normal text-slate-500">({gradedCount}/{submittedCount}명)</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-xs font-medium text-slate-500">채점 평균 점수</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">
                  {avgScore} <span className="text-xs font-normal text-slate-500">/ {selectedAsg.totalPoints}점</span>
                </div>
              </div>
            </div>

            {/* Rubrics Preview */}
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700 block mb-2">과제 평가 기준표 (Rubric)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {selectedAsg.rubrics.map((rb, idx) => (
                  <div key={rb.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>기준 {idx + 1}</span>
                      <span className="text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-sm text-[11px]">
                        {rb.maxPoints}점
                      </span>
                    </div>
                    <div className="text-slate-600 mt-1 text-[11px] leading-tight">
                      {rb.criterion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submissions Table with Filter */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden space-y-0">
            {/* Table Header Controls */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-slate-700" />
                <h4 className="text-sm font-bold text-slate-900">
                  학생별 과제 제출 및 채점 명단 ({filteredSubmissions.length}명)
                </h4>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                {(['전체', '채점대기', '채점완료', '미제출'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      statusFilter === filter
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">학번</th>
                    <th className="p-3">성명</th>
                    <th className="p-3">전공</th>
                    <th className="p-3">제출 현황</th>
                    <th className="p-3">제출 파일</th>
                    <th className="p-3">제출 시각</th>
                    <th className="p-3">점수</th>
                    <th className="p-3">피드백</th>
                    <th className="p-3 text-right">채점 작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredSubmissions.map((sub) => {
                    const isGraded = sub.score !== undefined;
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-mono text-slate-500">{sub.studentId}</td>
                        <td className="p-3 font-bold text-slate-900">{sub.studentName}</td>
                        <td className="p-3 text-slate-600">{sub.studentMajor}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              sub.status === '제출완료'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.status === '지각제출'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sub.status === '제출완료' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {sub.status === '지각제출' && <Clock className="w-3 h-3 text-amber-600" />}
                            {sub.status === '미제출' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {sub.fileName ? (
                            <span className="text-slate-700 flex items-center gap-1 font-mono text-[11px]">
                              <FileText className="w-3 h-3 text-slate-400" />
                              {sub.fileName}
                              <span className="text-slate-400">({sub.fileSize})</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500">{sub.submittedAt || '-'}</td>
                        <td className="p-3">
                          {isGraded ? (
                            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                              {sub.score}점
                            </span>
                          ) : sub.status === '미제출' ? (
                            <span className="text-slate-400">0점 (미제출)</span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                              채점 대기
                            </span>
                          )}
                        </td>
                        <td className="p-3 max-w-xs truncate text-slate-600">
                          {sub.feedback || (
                            <span className="text-slate-300 italic">등록된 피드백 없음</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {sub.status !== '미제출' ? (
                            <button
                              onClick={() => handleOpenGrading(sub)}
                              className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors ${
                                isGraded
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : 'bg-rose-700 hover:bg-rose-800 text-white shadow-2xs'
                              }`}
                            >
                              {isGraded ? '점수/피드백 수정' : '채점하기'}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">미제출</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-slate-400 text-xs">등록된 과제가 없습니다.</div>
      )}

      {/* Grading & Feedback Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  [{gradingSubmission.studentName}] 학생 과제 평가 및 피드백 입력
                </h3>
                <div className="text-xs text-slate-500">
                  학번: {gradingSubmission.studentId} · {gradingSubmission.studentMajor} · 파일: {gradingSubmission.fileName}
                </div>
              </div>
              <button onClick={() => setGradingSubmission(null)} className="text-slate-400 hover:text-slate-700 text-lg">
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Score Input */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-800 block text-sm">평가 점수 부여</label>
                  <span className="text-slate-500 text-[11px]">
                    만점 기준: {selectedAsg?.totalPoints || 100}점
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={selectedAsg?.totalPoints || 100}
                    value={scoreInput}
                    onChange={(e) => setScoreInput(Number(e.target.value))}
                    className="w-20 text-center font-bold text-base bg-white border border-slate-300 rounded-lg p-1.5 text-rose-700"
                  />
                  <span className="font-bold text-slate-600">점</span>
                </div>
              </div>

              {/* Quick Feedback Presets */}
              <div>
                <span className="font-semibold text-slate-700 block mb-1.5">자주 사용하는 피드백 빠른 입력:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '예외 처리와 메모리 해제 로직이 매우 깔끔합니다.',
                    '결과 벤치마크 그래프 분석 보고서가 충실합니다.',
                    '전반적인 동작은 우수하나 주석과 함수 모듈화를 보강하세요.',
                    'Null 포인터 예외 조건 처리가 누락되어 보완이 필요합니다.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFeedbackInput(preset)}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors text-left"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Textarea */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  교수자 맞춤형 학습 피드백 코멘트
                </label>
                <textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  rows={4}
                  placeholder="학생의 성장을 돕는 구체적인 강점과 개선점을 코멘트로 작성하세요."
                  className="w-full border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-rose-600 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-xs px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleSaveGrade}
                className="text-xs px-4 py-2 rounded-lg bg-rose-700 text-white font-bold hover:bg-rose-800 shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                평가 점수 및 피드백 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Assignment Modal */}
      {isNewAsgModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">새 과제 등록</h3>
              <button onClick={() => setIsNewAsgModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">과제명</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="예: 과제 3: 이진 탐색 트리(BST) 삭제 알고리즘 구현"
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">해당 주차</label>
                  <select
                    value={newWeek}
                    onChange={(e) => setNewWeek(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>{w}주차</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">총 배점</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newTotalPoints}
                    onChange={(e) => setNewTotalPoints(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">제출 마감 일시</label>
                <input
                  type="text"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  placeholder="2026-04-10 23:59"
                  className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">과제 설명 및 가이드라인</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={4}
                  placeholder="학생들이 과제를 수행할 때 유의해야 할 사항과 제출 요건을 작성하세요."
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsNewAsgModalOpen(false)}
                className="text-xs px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleCreateAssignment}
                className="text-xs px-4 py-2 rounded-lg bg-rose-700 text-white font-bold hover:bg-rose-800 shadow-xs"
              >
                과제 개설
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
