// ============================================
//  회원(User) 라우트 — 주소(입구)를 컨트롤러에 연결하는 '안내데스크'
// ============================================
const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const auth = require('../middleware/auth') // 토큰 검사 미들웨어(검문소)

// 주소(입구)            요청 방식   →  처리할 일꾼(컨트롤러)
router.post('/', userController.createUser)      // POST   /api/users        회원가입(생성)
router.post('/login', userController.loginUser)  // POST   /api/users/login  로그인
router.get('/', userController.getAllUsers)       // GET    /api/users       전체 목록 조회
router.get('/me', auth, userController.getMe)     // GET    /api/users/me    토큰으로 내 정보 (검문소 통과 필요)
router.get('/:id', userController.getUserById)    // GET    /api/users/:id   한 명 조회
router.put('/:id', userController.updateUser)     // PUT    /api/users/:id   수정
router.delete('/:id', userController.deleteUser)  // DELETE /api/users/:id   삭제

module.exports = router
