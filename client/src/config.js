// API 서버 주소 — 한 곳에서 관리한다.
// 배포 시 client 의 환경변수 VITE_API_URL 에 백엔드 주소를 넣으면 그걸 쓰고,
// 없으면(로컬 개발) localhost:5000 을 쓴다.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
