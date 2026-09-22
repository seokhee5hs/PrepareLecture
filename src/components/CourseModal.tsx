import React, { useState } from 'react';
import { Plus, X, GraduationCap, Building2 } from 'lucide-react';
import { HANSHIN_COLLEGES_AND_MAJORS } from '../data/hanshinData.ts';
import type { Course } from '../types/index.ts';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCourse: (newCourse: Course) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onAddCourse,
}) => {
  const [selectedMajorIndex, setSelectedMajorIndex] = useState(0);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [grade, setGrade] = useState<number>(2);
  const [classroom, setClassroom] = useState('송암관 301호');
  const [schedule, setSchedule] = useState('화 10:00~12:00, 목 10:00~11:00');
  const [enrolledStudents, setEnrolledStudents] = useState<number>(40);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!courseName.trim()) {
      alert('교과목명을 입력해 주세요.');
      return;
    }

    const pickedMajor = HANSHIN_COLLEGES_AND_MAJORS[selectedMajorIndex];
    const generatedId = `course-${Date.now()}`;
    const code = courseCode.trim() || `${pickedMajor.code}-${Math.floor(100 + Math.random() * 900)}`;

    const newCourse: Course = {
      id: generatedId,
      code,
      name: courseName.trim(),
      college: pickedMajor.college,
      department: pickedMajor.department,
      grade,
      semester: '2026학년도 1학기',
      classroom: classroom.trim() || '강의실 미정',
      schedule: schedule.trim() || '시간 협의',
      professorName: '이한신 교수',
      enrolledStudents,
    };

    onAddCourse(newCourse);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-rose-700" />
            <h3 className="text-base font-bold text-slate-900">한신대학교 새 강좌 개설</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          한신대학교 단과대 및 학부 전공을 선택하여 새로운 학기 담당 강좌를 개설합니다. (16주차 진도표가 자동 생성됩니다.)
        </p>

        <div className="space-y-3.5 text-xs">
          {/* Major / Department selection */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              한신대학교 소속 단과대 및 학부/전공 선택
            </label>
            <select
              value={selectedMajorIndex}
              onChange={(e) => setSelectedMajorIndex(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-medium text-slate-900 focus:outline-rose-600"
            >
              {HANSHIN_COLLEGES_AND_MAJORS.map((m, idx) => (
                <option key={idx} value={idx}>
                  [{m.college}] {m.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">교과목명</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="예: 웹 프론트엔드 프로그래밍, 머신러닝 응용"
              className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900 focus:outline-rose-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">학수번호 (선택)</label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="예: SW305-01 (미입력시 자동생성)"
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900 focus:outline-rose-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">대상 학년</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900 focus:outline-rose-600"
              >
                <option value={1}>1학년</option>
                <option value={2}>2학년</option>
                <option value={3}>3학년</option>
                <option value={4}>4학년</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">강의실 (한신대 캠퍼스)</label>
              <input
                type="text"
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
                placeholder="예: 송암관 304호, 장공관 201호, 늦봄관 101호"
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900 focus:outline-rose-600"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">수강 정원 (명)</label>
              <input
                type="number"
                min="10"
                max="100"
                value={enrolledStudents}
                onChange={(e) => setEnrolledStudents(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900 focus:outline-rose-600"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">강의 요일 및 시간</label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="예: 월 10:00~12:00, 수 10:00~11:00 (3학점)"
              className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900 focus:outline-rose-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="text-xs px-4 py-2 rounded-xl bg-rose-700 text-white font-bold hover:bg-rose-800 shadow-xs"
          >
            강좌 개설 완료
          </button>
        </div>
      </div>
    </div>
  );
};
