# 신화 부동산몰 (shinhwa-realty-mall)

공인중개사를 위한 올인원 마켓 — 사무용품·교육콘텐츠·경매 컨설팅·AI 코칭을 한 곳에서.

## 구조 (모노레포)
- `client/` — 프론트엔드 (React + Vite)
- `server/` — 백엔드 (Express + MongoDB / Mongoose)

## 배포
- 프론트: Vercel (Root Directory = `client`)
- 백엔드: Heroku (루트 `package.json`이 `server/index.js` 실행)
- DB: MongoDB Atlas

> 환경변수(.env)는 보안을 위해 저장소에 올리지 않습니다. 각 배포 플랫폼의 환경변수 설정에 직접 입력합니다.
