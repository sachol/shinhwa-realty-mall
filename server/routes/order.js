// ============================================
//  주문(Order) 라우트 — '주소(입구)'만 정의하고 실제 일은 컨트롤러에 맡긴다.
//  모든 주문 기능은 로그인한 회원만 사용 가능 → auth 미들웨어를 통과해야 함.
// ============================================
const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')
const auth = require('../middleware/auth')           // 로그인 확인 검문소
const adminOnly = require('../middleware/adminOnly')  // 관리자(admin) 권한 검문소

router.post('/', auth, orderController.createOrder)    // 주문 생성 (장바구니 → 주문)
router.get('/', auth, orderController.getMyOrders)     // 내 주문 목록
router.get('/all', auth, adminOnly, orderController.getAllOrders) // 전체 주문 (관리자 전용) — '/:id' 보다 먼저 둬야 함!
router.get('/:id', auth, orderController.getOrderById) // 주문 상세 1건
router.put('/:id/status', auth, adminOnly, orderController.updateOrderStatus) // 주문 상태 변경 (관리자 전용)

module.exports = router
