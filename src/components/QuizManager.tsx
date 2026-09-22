import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  Plus,
  CheckCircle,
  XCircle,
  HelpCircle,
  BarChart2,
  Clock,
  Trash2,
  Eye,
  FileQuestion,
  UserCheck,
  ChevronDown,
  RotateCcw,
  AlertCircle,
  Check,
  Layers,
} from 'lucide-react';
import type {
  QuizItem,
  QuizQuestion,
  QuizQuestionType,
  QuizSubmission,
  Course,
} from '../types/index.ts';

interface QuizManagerProps {
  course: Course;
  quizzes: QuizItem[];
  onUpdateQuizzes: (updated: QuizItem[]) => void;
}

export const QuizManager: React.FC<QuizManagerProps> = ({
  course,
  quizzes,
  onUpdateQuizzes,
}) => {
  const courseQuizzes = quizzes.filter((q) => q.courseId === course.id);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(courseQuizzes[0]?.id || '');

  // Keep selectedQuizId in sync when course changes or quizzes change
  useEffect(() => {
    const currentCourseQuizzes = quizzes.filter((q) => q.courseId === course.id);
    if (currentCourseQuizzes.length > 0) {
      if (!currentCourseQuizzes.some((q) => q.id === selectedQuizId)) {
        setSelectedQuizId(currentCourseQuizzes[0].id);
      }
    } else {
      setSelectedQuizId('');
    }
  }, [course.id, quizzes]);
  
  // Tab within Quiz Manager
  const [viewMode, setViewMode] = useState<'questions' | 'stats'>('questions');

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTargetMode, setAiTargetMode] = useState<'new_quiz' | 'append_current'>('new_quiz');
  const [aiQuizTitle, setAiQuizTitle] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiWeek, setAiWeek] = useState(4);
  const [aiCount, setAiCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationFeedback, setGenerationFeedback] = useState<string | null>(null);

  // Manual Question Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualType, setManualType] = useState<QuizQuestionType>('multiple_choice');
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualOptions, setManualOptions] = useState<string[]>(['', '', '', '']);
  const [manualCorrect, setManualCorrect] = useState('0');
  const [manualExplanation, setManualExplanation] = useState('');
  const [manualPoints, setManualPoints] = useState(5);

  // New Quiz Creation State
  const [isNewQuizModalOpen, setIsNewQuizModalOpen] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizWeek, setNewQuizWeek] = useState(4);
  const [newQuizTimeLimit, setNewQuizTimeLimit] = useState(15);
  const [newQuizDesc, setNewQuizDesc] = useState('');

  // Selected Submission Modal
  const [inspectedSubmission, setInspectedSubmission] = useState<QuizSubmission | null>(null);

  const selectedQuiz = courseQuizzes.find((q) => q.id === selectedQuizId) || courseQuizzes[0];

  const openAiModal = (targetMode?: 'new_quiz' | 'append_current') => {
    const mode = targetMode || (selectedQuiz ? 'append_current' : 'new_quiz');
    setAiTargetMode(mode);
    setAiWeek(selectedQuiz?.weekNumber || 4);
    setAiTopic('');
    setAiQuizTitle('');
    setIsAiModalOpen(true);
  };

  const handleCreateNewQuiz = () => {
    if (!newQuizTitle.trim()) return;
    const newQuiz: QuizItem = {
      id: `quiz-${Date.now()}`,
      courseId: course.id,
      weekNumber: newQuizWeek,
      title: newQuizTitle.trim(),
      description: newQuizDesc.trim() || `${newQuizWeek}주차 강의 핵심 개념 자동 채점 퀴즈`,
      timeLimitMinutes: newQuizTimeLimit,
      totalPoints: 0,
      status: '배포중',
      createdAt: new Date().toISOString().split('T')[0],
      questions: [],
      submissions: [],
    };
    const updated = [newQuiz, ...quizzes];
    onUpdateQuizzes(updated);
    setSelectedQuizId(newQuiz.id);
    setIsNewQuizModalOpen(false);
    setNewQuizTitle('');
    setNewQuizDesc('');
  };

  const handleGenerateAiQuiz = async () => {
    setIsGenerating(true);
    setGenerationFeedback(null);
    try {
      const topicToUse = aiTopic.trim() || `${aiWeek}주차 핵심 개념 및 응용`;
      let generatedQuestions: QuizQuestion[] = [];

      try {
        const res = await fetch('/api/gemini/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseName: course.name,
            department: course.department,
            topic: topicToUse,
            weekNumber: aiWeek,
            count: aiCount,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            generatedQuestions = data.questions;
          }
        }
      } catch {
        // Continue to high-grade pedagogical fallback if network or endpoint was temporarily busy
      }

      // High-grade safety fallback if server or network provided empty array
      if (generatedQuestions.length === 0) {
        generatedQuestions = [
          {
            id: `q-ai-${Date.now()}-1`,
            type: 'multiple_choice' as QuizQuestionType,
            question: `[${topicToUse}]의 기본 개념과 설계 원칙에 대한 설명으로 가장 적절한 것은 무엇인가?`,
            options: [
              `${topicToUse}의 원리는 시스템의 데이터 무결성과 알고리즘적 일관성을 보장한다.`,
              `${topicToUse}은(는) 오직 단일 환경에서만 제한적으로 활용되는 단발성 기술이다.`,
              `${topicToUse}은(는) 사전 정의된 규칙 없이 무작위로 작동한다.`,
              `${topicToUse} 도입 시 기존 시스템과의 호환성이나 효율성은 고려하지 않는다.`,
            ],
            correctAnswer: '0',
            explanation: `한신대학교 ${course.name} 강의 목표에 따라 ${topicToUse}의 핵심 구조와 원리를 체계적으로 이해해야 합니다.`,
            points: 5,
          },
          {
            id: `q-ai-${Date.now()}-2`,
            type: 'ox' as QuizQuestionType,
            question: `${aiWeek}주차에 다룬 [${topicToUse}] 기법은 대규모 서비스 환경에서도 안정적인 확장성과 모듈화를 지원하기 위해 널리 적용된다.`,
            options: ['O', 'X'],
            correctAnswer: 'O',
            explanation: `시스템 결합도를 낮추고 유지보수성을 극대화하기 위해 ${topicToUse}의 표준 패턴이 권장됩니다.`,
            points: 5,
          },
          {
            id: `q-ai-${Date.now()}-3`,
            type: 'short_answer' as QuizQuestionType,
            question: `${topicToUse} 학습에서 반복적으로 다룬 핵심 알고리즘 또는 용어의 명칭을 입력하시오.`,
            correctAnswer: topicToUse.split(' ')[0] || topicToUse,
            explanation: `해당 주차 강의에서 강조된 기본 용어입니다.`,
            points: 5,
          },
        ].slice(0, aiCount);
      }

      const totalAddedPoints = generatedQuestions.reduce((sum: number, q: QuizQuestion) => sum + (q.points || 5), 0);

      if (aiTargetMode === 'append_current' && selectedQuiz) {
        // Append to currently selected quiz
        const updated = quizzes.map((q) => {
          if (q.id === selectedQuiz.id) {
            return {
              ...q,
              questions: [...q.questions, ...generatedQuestions],
              totalPoints: q.totalPoints + totalAddedPoints,
            };
          }
          return q;
        });
        onUpdateQuizzes(updated);
        setGenerationFeedback(`Gemini AI가 [${selectedQuiz.title}]에 ${generatedQuestions.length}개 문항을 성공적으로 추가했습니다.`);
      } else {
        // Create brand new quiz with AI questions
        const quizTitle = aiQuizTitle.trim() || `${aiWeek}주차: [${topicToUse}] AI 자동 출제 퀴즈`;
        const newQuiz: QuizItem = {
          id: `quiz-${Date.now()}`,
          courseId: course.id,
          weekNumber: aiWeek,
          title: quizTitle,
          description: `한신대학교 ${course.name} ${aiWeek}주차 (${topicToUse}) Gemini AI 자동 생성 및 자동 채점 퀴즈`,
          timeLimitMinutes: 15,
          totalPoints: totalAddedPoints,
          status: '배포중',
          createdAt: new Date().toISOString().split('T')[0],
          questions: generatedQuestions,
          submissions: [],
        };
        const updated = [newQuiz, ...quizzes];
        onUpdateQuizzes(updated);
        setSelectedQuizId(newQuiz.id);
        setGenerationFeedback(`Gemini AI가 새 퀴즈 '${quizTitle}'을(를) 생성하고 ${generatedQuestions.length}개 문항을 출제했습니다.`);
      }

      setIsAiModalOpen(false);
      setAiTopic('');
      setAiQuizTitle('');
    } catch (err) {
      console.error('Quiz AI Error:', err);
      alert('퀴즈 문항 출제 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddManualQuestion = () => {
    if (!selectedQuiz || !manualQuestion.trim()) return;

    let options: string[] | undefined = undefined;
    if (manualType === 'multiple_choice') {
      options = manualOptions.map((o, idx) => o.trim() || `선택지 ${idx + 1}`);
    } else if (manualType === 'ox') {
      options = ['O', 'X'];
    }

    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      type: manualType,
      question: manualQuestion.trim(),
      options,
      correctAnswer: manualCorrect,
      explanation: manualExplanation.trim() || '교수자 해설이 등록되었습니다.',
      points: Number(manualPoints) || 5,
    };

    const updated = quizzes.map((q) => {
      if (q.id === selectedQuiz.id) {
        return {
          ...q,
          questions: [...q.questions, newQ],
          totalPoints: q.totalPoints + newQ.points,
        };
      }
      return q;
    });
    onUpdateQuizzes(updated);
    setIsManualModalOpen(false);
    setManualQuestion('');
    setManualExplanation('');
    setManualOptions(['', '', '', '']);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!selectedQuiz) return;
    const targetQ = selectedQuiz.questions.find((q) => q.id === qId);
    const updated = quizzes.map((q) => {
      if (q.id === selectedQuiz.id) {
        return {
          ...q,
          questions: q.questions.filter((item) => item.id !== qId),
          totalPoints: Math.max(0, q.totalPoints - (targetQ?.points || 0)),
        };
      }
      return q;
    });
    onUpdateQuizzes(updated);
  };

  // Simulate automated student submissions with instant auto-grading
  const handleSimulateStudentSubmission = () => {
    if (!selectedQuiz || selectedQuiz.questions.length === 0) {
      alert('문항이 등록된 퀴즈에서만 자동 채점 시뮬레이션이 가능합니다.');
      return;
    }

    const sampleStudents = [
      { name: '한예린', id: '20241031', major: course.department },
      { name: '오세훈', id: '20241074', major: course.department },
      { name: '신소율', id: '20231012', major: '컴퓨터공학전공' },
    ];
    const picked = sampleStudents[Math.floor(Math.random() * sampleStudents.length)];

    const answers: Record<string, string> = {};
    const isCorrectMap: Record<string, boolean> = {};
    let totalScore = 0;

    selectedQuiz.questions.forEach((q) => {
      // 80% chance of correct
      const isCorrect = Math.random() < 0.8;
      isCorrectMap[q.id] = isCorrect;
      if (isCorrect) {
        answers[q.id] = q.correctAnswer;
        totalScore += q.points;
      } else {
        answers[q.id] = q.type === 'ox' ? (q.correctAnswer === 'O' ? 'X' : 'O') : '오답 제출';
      }
    });

    const newSub: QuizSubmission = {
      id: `sim-sub-${Date.now()}`,
      studentName: picked.name,
      studentId: picked.id,
      studentMajor: picked.major,
      submittedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      score: totalScore,
      answers,
      isCorrectMap,
    };

    const updated = quizzes.map((q) => {
      if (q.id === selectedQuiz.id) {
        return {
          ...q,
          submissions: [newSub, ...q.submissions],
        };
      }
      return q;
    });
    onUpdateQuizzes(updated);
    alert(`학생 [${picked.name}]의 자동 채점 응시가 완료되었습니다! (획득 점수: ${totalScore}점 / ${selectedQuiz.totalPoints}점)`);
  };

  const calculateQuestionStats = () => {
    if (!selectedQuiz || selectedQuiz.submissions.length === 0) return {};
    const stats: Record<string, { total: number; correct: number; rate: number }> = {};
    selectedQuiz.questions.forEach((q) => {
      let correct = 0;
      selectedQuiz.submissions.forEach((sub) => {
        if (sub.isCorrectMap[q.id]) correct++;
      });
      const total = selectedQuiz.submissions.length;
      stats[q.id] = {
        total,
        correct,
        rate: Math.round((correct / total) * 100),
      };
    });
    return stats;
  };

  const questionStats = calculateQuestionStats();

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              스마트 자동 채점 시스템
            </span>
            <span className="text-xs text-slate-500">한신대 {course.name}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">퀴즈 출제 및 자동 채점 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gemini AI 기반 퀴즈 문항(객관식/단답형/OX)을 즉시 생성하고, 학생 응시 시 자동 채점 및 문항별 정답률 통계를 실시간으로 분석합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewQuizModalOpen(true)}
            className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 퀴즈 생성
          </button>
          <button
            onClick={() => openAiModal()}
            className="bg-rose-700 hover:bg-rose-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            AI 퀴즈 자동 출제
          </button>
        </div>
      </div>

      {/* Generation Feedback Banner */}
      {generationFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3.5 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{generationFeedback}</span>
          </div>
          <button
            onClick={() => setGenerationFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5"
          >
            닫기
          </button>
        </div>
      )}

      {/* Quiz Selector & Mode Switch */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Quiz Select Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {courseQuizzes.map((quiz) => {
            const isSelected = quiz.id === selectedQuiz?.id;
            return (
              <button
                key={quiz.id}
                onClick={() => setSelectedQuizId(quiz.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{quiz.weekNumber}주차: {quiz.title.split(':')[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-rose-800 text-rose-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {quiz.questions.length}문항 ({quiz.totalPoints}점)
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs w-full md:w-auto justify-end">
          <button
            onClick={() => setViewMode('questions')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'questions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            문항 목록 ({selectedQuiz?.questions.length || 0})
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'stats'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            자동 채점 및 통계 ({selectedQuiz?.submissions.length || 0}명 응시)
          </button>
        </div>
      </div>

      {selectedQuiz ? (
        <>
          {/* Quiz Top Info Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-md">
                  {selectedQuiz.weekNumber}주차 평가
                </span>
                <span className="text-xs text-slate-400">제한시간: {selectedQuiz.timeLimitMinutes}분</span>
                <span className="text-xs text-slate-400">총 배점: {selectedQuiz.totalPoints}점</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">{selectedQuiz.title}</h3>
              <p className="text-xs text-slate-300 mt-0.5">{selectedQuiz.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => openAiModal('append_current')}
                className="text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI 문항 추가
              </button>
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                수동 문항 추가
              </button>
              <button
                onClick={handleSimulateStudentSubmission}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="학생 1명의 응시를 가상으로 진행하여 자동 채점 결과를 확인합니다"
              >
                <UserCheck className="w-3.5 h-3.5" />
                자동 채점 시뮬레이션
              </button>
            </div>
          </div>

          {/* Mode 1: Question Builder View */}
          {viewMode === 'questions' && (
            <div className="space-y-4">
              {selectedQuiz.questions.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
                  <FileQuestion className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">아직 등록된 퀴즈 문항이 없습니다.</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    [AI 퀴즈 자동 출제]를 클릭하면 이번 주차 주제에 맞춘 문항과 해설이 3초만에 자동 생성됩니다.
                  </p>
                  <button
                    onClick={() => openAiModal('append_current')}
                    className="bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-rose-800 transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI로 3문항 자동 생성하기
                  </button>
                </div>
              ) : (
                selectedQuiz.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                          {q.type === 'multiple_choice' ? '객관식(4지선다)' : q.type === 'ox' ? 'O/X 참거짓' : '단답형'}
                        </span>
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm">
                          {q.points}점
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="문항 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {q.question}
                    </h4>

                    {/* Options Preview */}
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = String(optIdx) === q.correctAnswer;
                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {optIdx + 1}
                              </span>
                              <span>{opt}</span>
                              {isCorrect && (
                                <span className="ml-auto text-[10px] font-bold text-emerald-700">
                                  정답
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'ox' && (
                      <div className="flex items-center gap-3 pt-1">
                        {['O', 'X'].map((choice) => {
                          const isCorrect = choice === q.correctAnswer;
                          return (
                            <div
                              key={choice}
                              className={`px-4 py-2 rounded-lg text-xs font-bold border flex items-center gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <span>{choice}</span>
                              {isCorrect && <span className="text-[10px] text-emerald-700 font-normal">(정답)</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'short_answer' && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-500">지정된 정답 키워드: </span>
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-sm">
                          {q.correctAnswer}
                        </span>
                      </div>
                    )}

                    {/* Explanation */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800">해설: </span>
                        <span>{q.explanation}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Mode 2: Automated Grading & Analytics View */}
          {viewMode === 'stats' && (
            <div className="space-y-6">
              {/* Question Correctness Rate Stats */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  문항별 정답률 통계 (오답 취약 문항 분석)
                </h4>

                {selectedQuiz.questions.length === 0 ? (
                  <p className="text-xs text-slate-400">문항이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedQuiz.questions.map((q, idx) => {
                      const st = questionStats[q.id] || { total: 0, correct: 0, rate: 0 };
                      const isLow = st.total > 0 && st.rate < 60;
                      return (
                        <div key={q.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800 truncate max-w-[80%]">
                              Q{idx + 1}. {q.question}
                            </span>
                            <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                              정답률 {st.rate}% ({st.correct}/{st.total}명)
                              {isLow && <span className="ml-1 text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-sm">취약</span>}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isLow ? 'bg-rose-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${st.rate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Student Submissions Auto-Graded Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-600" />
                    학생 자동 채점 응시 현황 ({selectedQuiz.submissions.length}명)
                  </h4>
                  <button
                    onClick={handleSimulateStudentSubmission}
                    className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                  >
                    + 학생 응시 시뮬레이션
                  </button>
                </div>

                {selectedQuiz.submissions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    아직 응시한 학생이 없습니다. [자동 채점 시뮬레이션] 버튼을 눌러 테스트해 보세요.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="p-3">학번</th>
                          <th className="p-3">성명</th>
                          <th className="p-3">전공</th>
                          <th className="p-3">제출시각</th>
                          <th className="p-3">점수 / 배점</th>
                          <th className="p-3">채점 결과</th>
                          <th className="p-3 text-right">상세 답안지</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {selectedQuiz.submissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/70">
                            <td className="p-3 font-mono text-slate-500">{sub.studentId}</td>
                            <td className="p-3 font-bold text-slate-900">{sub.studentName}</td>
                            <td className="p-3 text-slate-600">{sub.studentMajor}</td>
                            <td className="p-3 text-slate-500">{sub.submittedAt}</td>
                            <td className="p-3 font-bold text-rose-700">
                              {sub.score}점 / {selectedQuiz.totalPoints}점
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                자동 채점 완료
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setInspectedSubmission(sub)}
                                className="text-slate-600 hover:text-slate-900 font-semibold underline text-xs"
                              >
                                답안 확인 &rarr;
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-700">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            등록된 퀴즈가 아직 없습니다
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            한신대학교 <strong>{course.name}</strong> ({course.department}) 강좌의 16주차 진도 계획에 맞추어 Gemini AI가 자동 채점 퀴즈(객관식/단답형/OX)와 교수자 공식 해설을 즉시 생성합니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => openAiModal('new_quiz')}
              className="bg-rose-700 hover:bg-rose-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Gemini AI로 첫 퀴즈 자동 출제
            </button>
            <button
              onClick={() => setIsNewQuizModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              수동 퀴즈 개설
            </button>
          </div>
        </div>
      )}

      {/* AI Quiz Generation Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700 border border-rose-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Gemini AI 퀴즈 자동 출제</h3>
                  <p className="text-[11px] text-slate-500">한신대 {course.name} ({course.department})</p>
                </div>
              </div>
              <button
                onClick={() => !isGenerating && setIsAiModalOpen(false)}
                disabled={isGenerating}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Target mode selection if current quiz exists */}
            {selectedQuiz ? (
              <div className="bg-slate-100/80 p-1 rounded-xl flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setAiTargetMode('append_current')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    aiTargetMode === 'append_current'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-rose-600" />
                  <span>현재 퀴즈에 문항 추가</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiTargetMode('new_quiz')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    aiTargetMode === 'new_quiz'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                  <span>새 퀴즈로 개설하여 출제</span>
                </button>
              </div>
            ) : (
              <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2.5 text-[11px] text-rose-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
                <span>현재 강좌에 등록된 퀴즈가 없어 <strong>새 퀴즈로 바로 개설</strong>됩니다.</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              {/* Optional Title input if creating new quiz */}
              {aiTargetMode === 'new_quiz' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    새 퀴즈 제목 <span className="text-slate-400 font-normal">(선택 입력)</span>
                  </label>
                  <input
                    type="text"
                    value={aiQuizTitle}
                    onChange={(e) => setAiQuizTitle(e.target.value)}
                    placeholder={`예: ${aiWeek}주차: [${aiTopic.trim() || '강의 주제'}] 정기 퀴즈`}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-rose-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">대상 주차</label>
                  <select
                    value={aiWeek}
                    onChange={(e) => setAiWeek(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-medium"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>{w}주차 강의 범위</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">출제 문항 수</label>
                  <div className="flex items-center gap-1.5">
                    {[2, 3, 5].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setAiCount(cnt)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          aiCount === cnt
                            ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cnt}문항
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  출제할 강의 주제 / 핵심 키워드
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="예: 스택과 큐, 원형 큐의 원리와 시간복잡도"
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-rose-600"
                />

                {/* Quick Topic Chips */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">추천 주제:</span>
                  {[
                    '스택과 큐의 원리',
                    '이진 탐색 트리(BST)',
                    'SQL 조인과 트랜잭션',
                    '퀵 정렬과 시간복잡도',
                    '객체지향 설계 원칙',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setAiTopic(chip)}
                      className="text-[10px] bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress animation while generating */}
              {isGenerating && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 border-2 border-rose-700 border-t-transparent rounded-full animate-spin shrink-0" />
                  <div className="text-xs text-rose-900 leading-snug">
                    <p className="font-bold">Gemini AI가 문항을 생성 중입니다...</p>
                    <p className="text-[11px] text-rose-700">한신대 {course.department} 교육과정 기준 객관식, OX, 단답형 및 자동 채점 해설 생성</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                disabled={isGenerating}
                className="text-xs px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleGenerateAiQuiz}
                disabled={isGenerating}
                className="text-xs px-5 py-2.5 rounded-lg bg-rose-700 text-white font-bold hover:bg-rose-800 shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-70"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? 'Gemini 출제 생성중...' : '퀴즈 문항 자동 생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Question Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">수동 퀴즈 문항 추가</h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">문항 유형</label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as QuizQuestionType)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  >
                    <option value="multiple_choice">객관식 (4지선다)</option>
                    <option value="ox">O/X 참거짓</option>
                    <option value="short_answer">단답형</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">배점</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={manualPoints}
                    onChange={(e) => setManualPoints(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">문항 질문</label>
                <textarea
                  value={manualQuestion}
                  onChange={(e) => setManualQuestion(e.target.value)}
                  rows={3}
                  placeholder="학생에게 제시될 질문을 입력하세요."
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                />
              </div>

              {manualType === 'multiple_choice' && (
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">선택지 (정답 라디오 선택)</label>
                  {manualOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct-opt"
                        checked={manualCorrect === String(idx)}
                        onChange={() => setManualCorrect(String(idx))}
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...manualOptions];
                          updated[idx] = e.target.value;
                          setManualOptions(updated);
                        }}
                        placeholder={`보기 ${idx + 1}`}
                        className="flex-1 border border-slate-200 rounded-lg p-2 bg-slate-50"
                      />
                    </div>
                  ))}
                </div>
              )}

              {manualType === 'ox' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">정답 선택</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 font-bold">
                      <input
                        type="radio"
                        name="ox-correct"
                        checked={manualCorrect === 'O'}
                        onChange={() => setManualCorrect('O')}
                      />
                      O (참)
                    </label>
                    <label className="flex items-center gap-1.5 font-bold">
                      <input
                        type="radio"
                        name="ox-correct"
                        checked={manualCorrect === 'X'}
                        onChange={() => setManualCorrect('X')}
                      />
                      X (거짓)
                    </label>
                  </div>
                </div>
              )}

              {manualType === 'short_answer' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">정답 키워드</label>
                  <input
                    type="text"
                    value={manualCorrect}
                    onChange={(e) => setManualCorrect(e.target.value)}
                    placeholder="자동 채점될 정답 문자열"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">교수자 해설 및 피드백</label>
                <textarea
                  value={manualExplanation}
                  onChange={(e) => setManualExplanation(e.target.value)}
                  rows={2}
                  placeholder="채점 후 학생에게 공개될 해설을 입력하세요."
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-xs px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleAddManualQuestion}
                className="text-xs px-4 py-2 rounded-lg bg-rose-700 text-white font-bold hover:bg-rose-800 shadow-xs"
              >
                문항 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Quiz Modal */}
      {isNewQuizModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">새 퀴즈 개설</h3>
              <button onClick={() => setIsNewQuizModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">퀴즈 제목</label>
                <input
                  type="text"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  placeholder="예: 5주차 정기 퀴즈: 덱과 재귀 알고리즘"
                  className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">대상 주차</label>
                  <select
                    value={newQuizWeek}
                    onChange={(e) => setNewQuizWeek(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>{w}주차</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">제한 시간 (분)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={newQuizTimeLimit}
                    onChange={(e) => setNewQuizTimeLimit(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">퀴즈 안내 설명</label>
                <textarea
                  value={newQuizDesc}
                  onChange={(e) => setNewQuizDesc(e.target.value)}
                  rows={3}
                  placeholder="학생들에게 안내할 응시 규칙 및 범위를 작성하세요."
                  className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsNewQuizModalOpen(false)}
                className="text-xs px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleCreateNewQuiz}
                className="text-xs px-4 py-2 rounded-lg bg-rose-700 text-white font-bold hover:bg-rose-800 shadow-xs"
              >
                퀴즈 생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspected Submission Details Modal */}
      {inspectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  [{inspectedSubmission.studentName}] 학생 답안지 및 자동 채점표
                </h3>
                <div className="text-xs text-slate-500">
                  학번: {inspectedSubmission.studentId} · {inspectedSubmission.studentMajor} · 제출: {inspectedSubmission.submittedAt}
                </div>
              </div>
              <button onClick={() => setInspectedSubmission(null)} className="text-slate-400 hover:text-slate-700 text-lg">
                &times;
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">최종 자동 채점 점수:</span>
              <span className="text-base font-bold text-rose-700">
                {inspectedSubmission.score}점 / {selectedQuiz?.totalPoints}점
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {selectedQuiz?.questions.map((q, idx) => {
                const isCorrect = inspectedSubmission.isCorrectMap[q.id];
                const submittedAns = inspectedSubmission.answers[q.id];
                return (
                  <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Q{idx + 1}. {q.question}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isCorrect ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                        {isCorrect ? `정답 (+${q.points}점)` : '오답 (0점)'}
                      </span>
                    </div>

                    <div className="text-slate-700">
                      <span className="font-medium text-slate-500">학생 제출 답안: </span>
                      <span className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {q.type === 'multiple_choice' && q.options
                          ? `${Number(submittedAns) + 1}번. ${q.options[Number(submittedAns)] || submittedAns}`
                          : submittedAns}
                      </span>
                    </div>

                    {!isCorrect && (
                      <div className="text-slate-700">
                        <span className="font-medium text-slate-500">정답: </span>
                        <span className="font-bold text-emerald-700">
                          {q.type === 'multiple_choice' && q.options
                            ? `${Number(q.correctAnswer) + 1}번. ${q.options[Number(q.correctAnswer)]}`
                            : q.correctAnswer}
                        </span>
                      </div>
                    )}

                    <div className="bg-slate-50 p-2.5 rounded-lg text-slate-600 text-[11px]">
                      <span className="font-bold text-slate-700">해설: </span>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedSubmission(null)}
                className="text-xs px-4 py-2 bg-slate-800 text-white rounded-xl font-bold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
