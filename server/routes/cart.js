// ============================================
//  장바구니(Cart) 라우트 — '주소(입구)'만 정의하고, 실제 일은 컨트롤러에 맡긴다.
//  모든 장바구니 기능은 '로그인한 회원'만 사용 가능 → auth 미들웨어를 통과해야 함.
//  (관리자 전용 아님! 일반 회원도 담아야 하므로 adminOnly 는 붙이지 않는다.)
// ============================================
const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cartController')
const auth = require('../middleware/auth') // 로그인 확인 검문소

router.get('/', auth, cartController.getCart)                       // 내 장바구니 보기
router.post('/', auth, cartController.addToCart)                    // 담기
router.put('/items/:itemId', auth, cartController.updateCartItem)   // 수량 변경
router.delete('/items/:itemId', auth, cartController.removeCartItem) // 한 항목 빼기
router.delete('/', auth, cartController.clearCart)                   // 장바구니 전체 비우기

module.exports = router
