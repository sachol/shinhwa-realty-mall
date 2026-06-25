// ============================================
//  회원(User) 라우트 — 주소(입구)를 컨트롤러에 연결하는 '안내데스크'
// ============================================
const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const auth = require('../middleware/auth') // 토큰 검사 미들웨어(검문소)
const adminOnly = require('../middleware/adminOnly') // 관리자 권한 확인 미들웨어

// 주소(입구)            요청 방식   →  처리할 일꾼(컨트롤러)
router.post('/', userController.createUser)      // POST   /api/users        회원가입(생성)
router.post('/login', userController.loginUser)  // POST   /api/users/login  로그인
router.get('/', auth, adminOnly, userController.getAllUsers)      // GET    /api/users       전체 목록 — 관리자 전용
router.get('/me', auth, userController.getMe)                     // GET    /api/users/me    토큰으로 내 정보
router.get('/:id', auth, userController.getUserById)              // GET    /api/users/:id   한 명 조회 — 로그인(본인/관리자)
router.put('/:id', auth, userController.updateUser)               // PUT    /api/users/:id   수정 — 로그인(본인/관리자)
router.delete('/:id', auth, adminOnly, userController.deleteUser) // DELETE /api/users/:id   삭제 — 관리자 전용

module.exports = router
