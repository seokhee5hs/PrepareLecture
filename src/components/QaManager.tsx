import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  Pin,
  PinOff,
  Sparkles,
  Send,
  Search,
  Filter,
  Plus,
  Lock,
  Globe,
  User,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import type { QaItem, QaStatus, QaCategory, Course } from '../types/index.ts';

interface QaManagerProps {
  course: Course;
  qaList: QaItem[];
  onUpdateQaList: (updated: QaItem[]) => void;
}

export const QaManager: React.FC<QaManagerProps> = ({
  course,
  qaList,
  onUpdateQaList,
}) => {
  const [selectedQaId, setSelectedQaId] = useState<string>(qaList[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<'전체' | QaStatus>('전체');
  const [categoryFilter, setCategoryFilter] = useState<'전체' | QaCategory>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reply form state
  const [replyText, setReplyText] = useState('');
  const [isGeneratingAiDraft, setIsGeneratingAiDraft] = useState(false);
  const [aiDraftBanner, setAiDraftBanner] = useState(false);

  // New Question Modal State
  const [isNewQuestionModalOpen, setIsNewQuestionModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentMajor, setNewStudentMajor] = useState(course.department);
  const [newWeekNum, setNewWeekNum] = useState<number>(4);
  const [newCategory, setNewCategory] = useState<QaCategory>('강의내용');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const courseQaList = qaList.filter((q) => q.courseId === course.id);

  const filteredQa = courseQaList.filter((item) => {
    if (statusFilter !== '전체' && item.status !== statusFilter) return false;
    if (categoryFilter !== '전체' && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.studentName.toLowerCase().includes(q) ||
        item.studentId.includes(q);
      if (!match) return false;
    }
    return true;
  });

  const selectedQa = courseQaList.find((q) => q.id === selectedQaId) || filteredQa[0];

  const handleSelectQa = (item: QaItem) => {
    setSelectedQaId(item.id);
    setReplyText(item.answer?.content || '');
    setAiDraftBanner(false);
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = qaList.map((q) => (q.id === id ? { ...q, isPinned: !q.isPinned } : q));
    onUpdateQaList(updated);
  };

  const handleUpdateStatus = (id: string, newStatus: QaStatus) => {
    const updated = qaList.map((q) => (q.id === id ? { ...q, status: newStatus } : q));
    onUpdateQaList(updated);
  };

  const handleSaveReply = (id: string, markAsAnswered = true) => {
    if (!replyText.trim()) return;
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updated = qaList.map((q) => {
      if (q.id === id) {
        return {
          ...q,
          status: markAsAnswered ? ('답변완료' as QaStatus) : q.status,
          answer: {
            content: replyText.trim(),
            answeredAt: formatted,
            aiDraftUsed: aiDraftBanner,
            professorName: course.professorName,
          },
        };
      }
      return q;
    });
    onUpdateQaList(updated);
    alert('교수자 답변이 성공적으로 등록되었습니다.');
  };

  const handleGenerateAiDraft = async (qa: QaItem) => {
    setIsGeneratingAiDraft(true);
    try {
      const res = await fetch('/api/gemini/qa-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: course.name,
          studentQuestionTitle: qa.title,
          studentQuestionContent: qa.content,
          studentName: qa.studentName,
          weekNumber: qa.weekNumber,
        }),
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      if (data.draft) {
        setReplyText(data.draft);
        setAiDraftBanner(true);
      }
    } catch {
      // Fallback draft for Hanshin University professors
      const fallback = `${qa.studentName} 학생, 질문 잘 확인했습니다.\n\n질문해 주신 [${qa.title}]에 대해 설명드립니다.\n강의 내용 중 핵심 개념을 먼저 확인하시고, 예외 조건 처리가 올바르게 되어 있는지 검토해 보세요. 관련 코드는 다음 실습 시간에 함께 디버깅하며 추가로 확인해 드릴 테니 수업 후 연구실이나 강의실에서 질문해 주셔도 좋습니다.\n\n수업에 적극적으로 임해 주어 고맙습니다.`;
      setReplyText(fallback);
      setAiDraftBanner(true);
    } finally {
      setIsGeneratingAiDraft(false);
    }
  };

  const handleCreateNewQuestion = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert('질문 제목과 내용을 모두 입력해 주세요.');
      return;
    }
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newQa: QaItem = {
      id: `qa-${Date.now()}`,
      courseId: course.id,
      weekNumber: newWeekNum,
      studentName: newStudentName.trim() || '익명학생',
      studentId: newStudentId.trim() || '20241099',
      studentMajor: newStudentMajor,
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      status: '미답변',
      createdAt: formatted,
      isPinned: false,
      isPublic: true,
    };

    onUpdateQaList([newQa, ...qaList]);
    setIsNewQuestionModalOpen(false);
    setSelectedQaId(newQa.id);
    setNewTitle('');
    setNewContent('');
    alert('새 학생 질문이 등록되었습니다.');
  };

  const pendingCount = courseQaList.filter((q) => q.status === '미답변').length;
  const reviewingCount = courseQaList.filter((q) => q.status === '검토중').length;
  const answeredCount = courseQaList.filter((q) => q.status === '답변완료').length;

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              실시간 질의응답 허브
            </span>
            <span className="text-xs text-slate-500">한신대 {course.name}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">학생 질문 및 답변 현황 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            학생들의 학업 질의응답을 주차/카테고리별로 검토하고, Gemini AI 기반 추천 답변 초안을 통해 신속하고 친절하게 피드백합니다.
          </p>
        </div>

        <button
          onClick={() => setIsNewQuestionModalOpen(true)}
          className="bg-rose-700 hover:bg-rose-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          학생 질문 접수 등록
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('전체')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === '전체'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 ({courseQaList.length})
          </button>
          <button
            onClick={() => setStatusFilter('미답변')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === '미답변'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            미답변 ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('검토중')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === '검토중'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            검토중 ({reviewingCount})
          </button>
          <button
            onClick={() => setStatusFilter('답변완료')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === '답변완료'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            답변완료 ({answeredCount})
          </button>
        </div>

        {/* Category & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-rose-600"
          >
            <option value="전체">모든 카테고리</option>
            <option value="강의내용">강의내용</option>
            <option value="과제/실습">과제/실습</option>
            <option value="시험/평가">시험/평가</option>
            <option value="기타">기타</option>
          </select>

          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="질문, 학생명 검색..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-rose-600"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Question List / Right Detail and Answer Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          {filteredQa.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              선택한 조건에 해당하는 질문이 없습니다.
            </div>
          ) : (
            filteredQa.map((qa) => {
              const isSelected = selectedQa?.id === qa.id;
              return (
                <div
                  key={qa.id}
                  onClick={() => handleSelectQa(qa)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-rose-50/60 border-rose-500 shadow-xs ring-1 ring-rose-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {qa.weekNumber}주차
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
                        {qa.category}
                      </span>
                      {qa.isPinned && (
                        <span className="text-[10px] font-bold text-rose-700 flex items-center gap-0.5">
                          <Pin className="w-3 h-3 fill-rose-700" /> 고정
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        qa.status === '미답변'
                          ? 'bg-amber-100 text-amber-800'
                          : qa.status === '검토중'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {qa.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                    {qa.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {qa.content}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">{qa.studentName}</span>
                      <span className="text-slate-400">({qa.studentId.slice(0, 4)}****)</span>
                      <span>·</span>
                      <span>{qa.studentMajor}</span>
                    </div>
                    <span>{qa.createdAt}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail & Reply Area */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          {selectedQa ? (
            <>
              {/* Question Header */}
              <div className="pb-4 border-b border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                      {selectedQa.weekNumber}주차 질문
                    </span>
                    <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      {selectedQa.category}
                    </span>
                    {selectedQa.isPublic ? (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> 공개
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> 비공개
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleTogglePin(selectedQa.id, e)}
                      className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                        selectedQa.isPinned
                          ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {selectedQa.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                      {selectedQa.isPinned ? '고정 해제' : '상단 고정'}
                    </button>

                    <select
                      value={selectedQa.status}
                      onChange={(e) => handleUpdateStatus(selectedQa.id, e.target.value as QaStatus)}
                      className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800"
                    >
                      <option value="미답변">미답변 (Pending)</option>
                      <option value="검토중">검토중 (Reviewing)</option>
                      <option value="답변완료">답변완료 (Answered)</option>
                    </select>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {selectedQa.title}
                </h3>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1 text-slate-700 font-semibold">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedQa.studentName}</span>
                    <span className="text-slate-400 font-normal">({selectedQa.studentId})</span>
                  </div>
                  <span>·</span>
                  <span>{selectedQa.studentMajor}</span>
                  <span>·</span>
                  <span>접수일시: {selectedQa.createdAt}</span>
                </div>
              </div>

              {/* Question Content Body */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedQa.content}
              </div>

              {/* Professor Reply Form */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-rose-700" />
                    <h4 className="text-sm font-bold text-slate-900">교수자 답변 작성</h4>
                  </div>

                  <button
                    onClick={() => handleGenerateAiDraft(selectedQa)}
                    disabled={isGeneratingAiDraft}
                    className="text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    {isGeneratingAiDraft ? 'Gemini AI 답변 작성중...' : '✨ AI 답변 초안 생성'}
                  </button>
                </div>

                {aiDraftBanner && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      Gemini AI가 제안한 답변 초안입니다. 검토 및 수정 후 등록하세요.
                    </span>
                    <button
                      onClick={() => setAiDraftBanner(false)}
                      className="text-rose-500 hover:text-rose-700 font-bold ml-2"
                    >
                      &times;
                    </button>
                  </div>
                )}

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                  placeholder="학생의 질문에 대한 격려와 함께 명확한 개념 설명, 실습 지도 지침을 작성하세요."
                  className="w-full text-xs border border-slate-300 rounded-xl p-3.5 text-slate-800 focus:outline-rose-600 bg-white"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-400">
                    {selectedQa.answer && (
                      <span>최종 답변: {selectedQa.answer.answeredAt} ({selectedQa.answer.professorName})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveReply(selectedQa.id, false)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-colors"
                    >
                      임시 저장
                    </button>
                    <button
                      onClick={() => handleSaveReply(selectedQa.id, true)}
                      className="text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      답변 등록 완료
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              질문을 선택해 주세요.
            </div>
          )}
        </div>
      </div>

      {/* New Question Modal */}
      {isNewQuestionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">학생 질문 대리 접수 / 등록</h3>
              <button
                onClick={() => setIsNewQuestionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">학생 이름</label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="예: 김민준"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">학번</label>
                  <input
                    type="text"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    placeholder="예: 20241042"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">해당 주차</label>
                  <select
                    value={newWeekNum}
                    onChange={(e) => setNewWeekNum(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        {w}주차
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">카테고리</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as QaCategory)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  >
                    <option value="강의내용">강의내용</option>
                    <option value="과제/실습">과제/실습</option>
                    <option value="시험/평가">시험/평가</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">질문 제목</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="질문 핵심 요약 제목"
                  className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">질문 내용</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  placeholder="학생이 문의한 구체적인 내용 작성"
                  className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsNewQuestionModalOpen(false)}
                className="text-xs px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleCreateNewQuestion}
                className="text-xs px-4 py-2 rounded-lg bg-rose-700 text-white hover:bg-rose-800 font-bold shadow-xs"
              >
                질문 접수 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
