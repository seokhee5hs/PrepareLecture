import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Resilient Gemini text caller with model rotation (gemini-3.8-flash -> gemini-3.1-flash-lite)
async function callGeminiResilient(prompt: string, isJson = false): Promise<string | null> {
  const ai = getAiClient();
  if (!ai) return null;

  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  for (const model of models) {
    try {
      const callPromise = ai.models.generateContent({
        model,
        contents: prompt,
        config: isJson ? { responseMimeType: 'application/json' } : undefined,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );

      const response = await Promise.race([callPromise, timeoutPromise]);
      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch {
      // If primary model encounters high demand (503) or timeout, silently attempt next model
      continue;
    }
  }

  return null;
}

export async function generateQuizQuestionsAI(params: {
  courseName: string;
  department: string;
  topic: string;
  weekNumber: number;
  count?: number;
}) {
  const count = params.count || 3;

  const prompt = `한신대학교 ${params.department} 전공의 [${params.courseName}] 교과목 ${params.weekNumber}주차(주제: ${params.topic})를 위한 대학 수준의 자동 채점용 퀴즈 문항 ${count}개를 JSON으로 생성해줘.

문항 형식:
- 객관식(4지선다, type: "multiple_choice"), 단답형(type: "short_answer"), O/X형(type: "ox")을 골고루 혼합
- correctAnswer는 객관식인 경우 선택지 인덱스("0", "1", "2", "3" 중 하나), 단답형인 경우 정답 키워드 문자열, OX인 경우 "O" 또는 "X"
- 각 문항마다 상세하고 명확한 해설(explanation)과 5점 배점(points)을 부여할 것.

반드시 다음 JSON 배열 형식으로만 응답해:
[
  {
    "type": "multiple_choice",
    "question": "문항 질문 내용",
    "options": ["보기1", "보기2", "보기3", "보기4"],
    "correctAnswer": "0",
    "explanation": "해설 내용",
    "points": 5
  }
]`;

  try {
    const rawText = await callGeminiResilient(prompt, true);
    if (rawText) {
      let cleanText = rawText;
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      }

      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, count).map((item, idx) => ({
          id: `q-ai-${Date.now()}-${idx + 1}`,
          type: item.type || 'multiple_choice',
          question: item.question,
          options: item.options || (item.type === 'ox' ? ['O', 'X'] : ['보기1', '보기2', '보기3', '보기4']),
          correctAnswer: String(item.correctAnswer ?? '0'),
          explanation: item.explanation || '교수자 공식 해설이 등록되었습니다.',
          points: Number(item.points) || 5,
        }));
      }
    }
  } catch {
    // Graceful fallback without dumping error objects to console
  }

  return generateFallbackQuiz(params.courseName, params.department, params.topic, params.weekNumber, count);
}

export async function generateQaAnswerDraftAI(params: {
  courseName: string;
  studentQuestionTitle: string;
  studentQuestionContent: string;
  studentName: string;
  weekNumber?: number;
}) {
  const prompt = `당신은 한신대학교 [${params.courseName}] 강좌를 담당하는 온화하고 전문적인 교수자입니다.
학생(${params.studentName})이 다음과 같은 질문을 등록했습니다:
질문 제목: ${params.studentQuestionTitle}
질문 내용: ${params.studentQuestionContent}
${params.weekNumber ? `해당 주차: ${params.weekNumber}주차` : ''}

교수자 입장에서 학생의 질문 의도를 정확히 파악하고, 격려와 함께 학술적/실무적 지침을 담은 친절하고 완성도 높은 답변 초안을 1인칭 교수 어투(~입니다, ~바랍니다)로 작성해 주세요.`;

  try {
    const text = await callGeminiResilient(prompt, false);
    if (text) {
      return text;
    }
  } catch {
    // Graceful fallback
  }

  return generateFallbackQaDraft(params);
}

function generateFallbackQuiz(course: string, department: string, topic: string, week: number, count: number) {
  const cleanTopic = topic.trim() || `${week}주차 핵심 개념`;
  const t = cleanTopic.toLowerCase();

  // Tailored specialized question pools based on topic keywords
  const questions: Array<{
    type: 'multiple_choice' | 'ox' | 'short_answer';
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
    points: number;
  }> = [];

  if (t.includes('스택') || t.includes('stack') || t.includes('큐') || t.includes('queue')) {
    questions.push({
      type: 'multiple_choice',
      question: `스택(Stack)과 큐(Queue)의 자료 입출력 원칙(LIFO vs FIFO)에 대한 설명으로 가장 옳은 것은?`,
      options: [
        '스택은 가장 먼저 들어온 데이터가 가장 먼저 나가는 FIFO 방식이다.',
        '스택은 나중에 삽입된 요소가 먼저 제거되는 LIFO, 큐는 먼저 삽입된 요소가 먼저 제거되는 FIFO 구조이다.',
        '큐는 양 끝단에서 자유롭게 삽입과 삭제가 임의로 일어나는 비선형 구조이다.',
        '스택의 push 연산은 시간복잡도 O(N), 큐의 enqueue 연산은 O(N^2)이다.',
      ],
      correctAnswer: '1',
      explanation: '스택은 후입선출(Last-In, First-Out, LIFO)이며, 큐는 선입선출(First-In, First-Out, FIFO) 방식으로 동작합니다. 두 구조 모두 기본 삽입/삭제는 O(1)에 수행됩니다.',
      points: 5,
    });
    questions.push({
      type: 'ox',
      question: '배열 기반 원형 큐(Circular Queue)에서 포화(Full) 상태와 공백(Empty) 상태를 구분하기 위해 일반적으로 1칸의 빈 공간을 유지한다.',
      options: ['O', 'X'],
      correctAnswer: 'O',
      explanation: 'front == rear 조건이 공백을 의미하므로, 한 칸을 비워두고 (rear + 1) % MAX == front 상태를 포화 상태로 정의함으로써 공백과 포화를 명확히 판별합니다.',
      points: 5,
    });
    questions.push({
      type: 'short_answer',
      question: '스택이 최대 허용 용량을 초과하여 더 이상 요소를 push할 수 없을 때 발생하는 런타임 오류의 명칭은 무엇인가?',
      correctAnswer: 'Stack Overflow',
      explanation: '할당된 스택 메모리가 초과될 때 Stack Overflow(스택 오버플로우) 예외가 발생합니다.',
      points: 5,
    });
    questions.push({
      type: 'multiple_choice',
      question: '중위 표기식 "A + B * C"를 스택을 활용하여 후위 표기식(Postfix)으로 올바르게 변환한 결과는?',
      options: ['+ A * B C', 'A B C * +', 'A B + C *', 'A B * C +'],
      correctAnswer: '1',
      explanation: '연산자 우선순위에 따라 B * C가 먼저 묶여 BC*가 되고, 이후 A와 덧셈으로 결합하여 ABC*+가 됩니다.',
      points: 5,
    });
    questions.push({
      type: 'ox',
      question: '함수 호출 시 복귀 주소(Return Address)와 지역 변수를 저장하는 시스템 콜 스택(Call Stack)은 큐(Queue) 구조로 관리된다.',
      options: ['O', 'X'],
      correctAnswer: 'X',
      explanation: '가장 최근에 호출된 함수가 먼저 반환되어 종료되어야 하므로 스택(Stack) 구조로 관리됩니다.',
      points: 5,
    });
  } else if (t.includes('트리') || t.includes('tree') || t.includes('bst') || t.includes('이진')) {
    questions.push({
      type: 'multiple_choice',
      question: `이진 탐색 트리(Binary Search Tree)의 노드 검색 평균 시간복잡도와 최악 시간복잡도의 올바른 조합은?`,
      options: [
        '평균 O(log N), 최악(편향 트리) O(N)',
        '평균 O(1), 최악 O(log N)',
        '평균 O(N), 최악 O(N^2)',
        '평균 O(N log N), 최악 O(N^2)',
      ],
      correctAnswer: '0',
      explanation: '균형 잡힌 BST에서는 트리의 높이가 log N이므로 평균 O(log N)이지만, 한쪽으로 치우친 편향 트리(Skewed Tree)에서는 연결 리스트처럼 O(N)으로 저하됩니다.',
      points: 5,
    });
    questions.push({
      type: 'ox',
      question: '이진 트리를 중위 순회(Inorder Traversal: Left -> Root -> Right)하면 BST에 저장된 모든 키를 오름차순으로 정렬된 순서로 방문할 수 있다.',
      options: ['O', 'X'],
      correctAnswer: 'O',
      explanation: 'BST의 성질(왼쪽 자식 < 루트 < 오른쪽 자식)로 인해 중위 순회를 수행하면 자동으로 키의 오름차순 정렬 순서로 출력됩니다.',
      points: 5,
    });
    questions.push({
      type: 'short_answer',
      question: '이진 트리 순회 방식 중 루트 노드를 가장 먼저 방문하고 왼쪽, 오른쪽 서브트리를 순회하는 방식의 명칭은?',
      correctAnswer: '전위 순회',
      explanation: '루트 -> 왼쪽 -> 오른쪽 순서로 방문하는 방식을 전위 순회(Preorder Traversal)라고 부릅니다.',
      points: 5,
    });
    questions.push({
      type: 'multiple_choice',
      question: '노드의 개수가 N개인 완전 이진 트리(Complete Binary Tree)의 최대 높이(Height)는?',
      options: ['floor(log2 N)', 'N - 1', 'N / 2', '2^N'],
      correctAnswer: '0',
      explanation: '완전 이진 트리의 높이는 O(log2 N)에 비례하며 정확한 레벨 높이는 floor(log2 N)입니다.',
      points: 5,
    });
  } else if (t.includes('sql') || t.includes('데이터베이스') || t.includes('db') || t.includes('정규화')) {
    questions.push({
      type: 'multiple_choice',
      question: `관계형 데이터베이스의 트랜잭션 4대 특성(ACID)에 해당하지 않는 것은 무엇인가?`,
      options: [
        '원자성 (Atomicity)',
        '일관성 (Consistency)',
        '비동기성 (Asynchrony)',
        '지속성 (Durability)',
      ],
      correctAnswer: '2',
      explanation: 'ACID는 Atomicity(원자성), Consistency(일관성), Isolation(격리성/고립성), Durability(지속성)의 머리글자입니다. 비동기성은 ACID 특성이 아닙니다.',
      points: 5,
    });
    questions.push({
      type: 'ox',
      question: 'SQL에서 HAVING 절은 WHERE 절과 달리 GROUP BY로 그룹화된 결과 집계 함수에 대한 조건을 지정할 때 사용된다.',
      options: ['O', 'X'],
      correctAnswer: 'O',
      explanation: 'WHERE 절은 개별 행에 조건을 적용하고, HAVING 절은 그룹화된 집계 결과(SUM, COUNT, AVG 등)에 조건을 적용합니다.',
      points: 5,
    });
    questions.push({
      type: 'short_answer',
      question: '관계형 데이터베이스에서 테이블 내 각 행(튜플)을 유일하게 식별할 수 있는 최소성과 유일성을 만족하는 키의 명칭은?',
      correctAnswer: '기본키',
      explanation: '유일성과 최소성을 만족하며 각 레코드를 고유하게 식별하는 키를 기본키(Primary Key)라고 부릅니다.',
      points: 5,
    });
  } else if (t.includes('정렬') || t.includes('sort') || t.includes('알고리즘') || t.includes('복잡도')) {
    questions.push({
      type: 'multiple_choice',
      question: `퀵 정렬(Quick Sort)의 평균 시간복잡도와 최악 시간복잡도의 올바른 조합은?`,
      options: [
        '평균 O(N log N), 최악 O(N^2)',
        '평균 O(N), 최악 O(N log N)',
        '평균 O(N log N), 최악 O(N log N)',
        '평균 O(N^2), 최악 O(N^3)',
      ],
      correctAnswer: '0',
      explanation: '퀵 정렬은 피벗이 고르게 분할될 때 O(N log N)이지만, 이미 정렬된 배열에서 최악의 피벗을 선택하면 O(N^2)까지 성능이 저하됩니다.',
      points: 5,
    });
    questions.push({
      type: 'ox',
      question: '병합 정렬(Merge Sort)은 데이터의 정렬 상태와 무관하게 최선, 평균, 최악 모두 O(N log N)의 안정적인 시간복잡도를 보장한다.',
      options: ['O', 'X'],
      correctAnswer: 'O',
      explanation: '병합 정렬은 분할 정복(Divide & Conquer) 기법을 사용하여 항상 정확히 절반으로 분할하므로 안정적으로 O(N log N)을 유지합니다.',
      points: 5,
    });
    questions.push({
      type: 'short_answer',
      question: '알고리즘의 입력 크기 N이 증가할 때 실행 시간의 상한선(Worst-case)을 수학적으로 표기하는 점근 표기법은?',
      correctAnswer: 'Big-O',
      explanation: '점근적 상한을 나타내는 가장 보편적인 표기법은 Big-O(빅오 표기법)입니다.',
      points: 5,
    });
  } else {
    // General high-quality pedagogical questions contextualized to Hanshin University course topic
    questions.push({
      type: 'multiple_choice',
      question: `[${cleanTopic}]의 핵심 개념과 설계 목적에 대한 설명으로 가장 올바른 것은?`,
      options: [
        `${cleanTopic}은(는) 데이터의 무결성과 효율적인 처리 흐름을 보장하기 위한 핵심 이론 및 기법이다.`,
        `${cleanTopic}은(는) 임의의 사전 설계나 규칙 없이 무작위로 동작하는 단발성 기법이다.`,
        `${cleanTopic} 적용 시 시스템 확장성이나 유지보수성은 전혀 고려하지 않는다.`,
        `${cleanTopic}은(는) 현대 소프트웨어 개발 환경에서는 더 이상 적용되지 않는 기법이다.`,
      ],
      correctAnswer: '0',
      explanation: `한신대학교 ${course} 강의에서 강조한 바와 같이, ${cleanTopic}의 핵심 목적은 데이터 구조의 정합성과 알고리즘적 실행 효율성을 체계적으로 확보하는 데 있습니다.`,
      points: 5,
    });
    questions.push({
      type: 'ox',
      question: `${week}주차에 학습한 [${cleanTopic}]의 기본 원리는 대규모 트래픽 및 확장성 환경에서도 신뢰성을 유지하기 위해 권장되는 표준 방식이다.`,
      options: ['O', 'X'],
      correctAnswer: 'O',
      explanation: `${cleanTopic} 원리를 정확히 적용하면 시스템의 결합도를 낮추고 모듈화 수준을 높여 유지보수 및 확장에 유리합니다.`,
      points: 5,
    });
    questions.push({
      type: 'short_answer',
      question: `${cleanTopic} 학습 과정에서 다룬 핵심 제약조건 및 이론의 기본 명칭을 작성하시오.`,
      correctAnswer: cleanTopic.split(' ')[0] || cleanTopic,
      explanation: `해당 단원에서 지속적으로 강조된 ${cleanTopic}의 핵심 용어입니다.`,
      points: 5,
    });
    questions.push({
      type: 'multiple_choice',
      question: `[${cleanTopic}]을(를) 실제 소프트웨어 시스템에 적용할 때 가장 우선적으로 고려해야 할 사항은?`,
      options: [
        '시간/공간 자원 효율성과 예외 상황(Edge Case)에 대한 안전한 처리',
        '코드의 복잡도를 무조건 최대화하여 타인이 읽지 못하게 암호화',
        '테스트나 검증 절차를 생략하고 즉시 배포하는 속도',
        '기존 하드웨어 아키텍처와의 연계성을 배제하는 것',
      ],
      correctAnswer: '0',
      explanation: '실무 소프트웨어 공학 관점에서 시간 및 메모리 자원의 효율성, 그리고 경계값/Null 예외 처리가 가장 핵심적인 평가 척도입니다.',
      points: 5,
    });
    questions.push({
      type: 'ox',
      question: `[${cleanTopic}] 구현 시 모듈화(Modularity)를 적용하면 코드 재사용성과 단위 테스트 용이성이 대폭 향상된다.`,
      options: ['O', 'X'],
      correctAnswer: 'O',
      explanation: '독립된 모듈 단위로 기능을 분리하면 버그 추적이 용이해지고 컴포넌트 재사용성이 크게 증가합니다.',
      points: 5,
    });
  }

  return questions.slice(0, count).map((q, idx) => ({
    id: `q-ai-${Date.now()}-${idx + 1}`,
    type: q.type,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    points: q.points,
  }));
}

function generateFallbackQaDraft(params: {
  courseName: string;
  studentName: string;
  studentQuestionTitle: string;
}) {
  return `${params.studentName} 학생, 질문 잘 확인했습니다.\n\n질문해 주신 [${params.studentQuestionTitle}]에 대해 설명드립니다.\n강의 내용 중 핵심 원리를 다시 한 번 상기해 보면, 기본 구조와 예외 상황을 나누어 접근하는 것이 좋습니다. 수업 자료 슬라이드 및 실습 가이드를 참고하시고, 코드 또는 추가 의문점이 있다면 연구실 방문 시간(오피스 아워)이나 다음 강의 질의응답 시간에 함께 확인해 봅시다.\n\n수업에 적극적으로 참여해 주어 고맙습니다.`;
}

