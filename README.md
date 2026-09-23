# PrepareLecture

한신대 교수 수업 준비 및 학사 관리 앱입니다.

## 실행 및 검증

Node.js 24를 사용합니다.

```sh
npm ci
npm run dev
```

```sh
npm run lint
npm run build
npm run preview
```

미리보기 주소의 `/PrepareLecture/` 경로에서 배포 결과를 확인합니다.

## GitHub Pages 배포

- 사이트: https://seokhee5hs.github.io/PrepareLecture/
- 저장소 Settings → Pages → Source는 **GitHub Actions**로 설정합니다.
- `main`에 변경 사항을 push하면 `.github/workflows/deploy.yml`이 설치, 타입 검사,
  Vite 빌드 후 `dist`를 배포합니다. PR에서는 설치, 타입 검사와 빌드만 수행합니다.
- `package-lock.json`을 함께 커밋하여 `npm ci`가 같은 의존성을 설치하게 합니다.
- 원본 `index.html`과 `src/main.tsx`를 그대로 배포하면 브라우저에서 앱을 실행할 수
  없습니다. 반드시 빌드 결과를 배포해야 합니다.
- `vite.config.ts`의 `base`는 `/PrepareLecture/`입니다. 저장소 이름이나 서비스 경로가
  바뀌면 이 설정도 변경해야 합니다.

## 데이터와 AI 기능

강의, 진도, Q&A, 퀴즈, 과제 데이터는 현재 브라우저의 localStorage에 저장됩니다.
다른 기기나 사용자와 자동으로 공유되지 않습니다.

GitHub Pages는 정적 파일만 제공하므로 `server/`의 Gemini API는 실행되지 않습니다.
Pages에서 AI 버튼은 기존 클라이언트의 대체 문항/답변을 사용하며 실제 Gemini 생성이
아닙니다. 실제 AI 연결은 서버 실행 환경과 서버 측 `GEMINI_API_KEY`가 필요합니다.
API 키를 프런트엔드 코드나 공개 저장소에 넣지 마세요.
