// ============================================
//  상품(Product) 라우트
//  조회(GET)는 누구나 / 등록·수정·삭제는 'admin'만 (auth → adminOnly 순서로 통과)
// ============================================
const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')
const auth = require('../middleware/auth')         // 1차 검문소: 로그인 확인
const adminOnly = require('../middleware/adminOnly') // 2차 검문소: 관리자 확인

// ── 조회: 로그인 없이 누구나 ──
router.get('/', productController.getAllProducts)     // GET  /api/products      전체 목록
router.get('/:id', productController.getProductById)  // GET  /api/products/:id  상세

// ── 쓰기: 로그인(auth) + 관리자(adminOnly) 통과해야 함 ──
router.post('/', auth, adminOnly, productController.createProduct)      // 등록
router.put('/:id', auth, adminOnly, productController.updateProduct)    // 수정
router.delete('/:id', auth, adminOnly, productController.deleteProduct) // 삭제

module.exports = router
