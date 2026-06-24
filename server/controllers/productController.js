// ============================================
//  상품(Product) 컨트롤러 — 회원(User) 컨트롤러와 똑같은 CRUD 패턴
// ============================================
const Product = require('../models/product')

// [Create] 상품 등록  ─ POST /api/products  (admin만)
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body)
    res.status(201).json(product)
  } catch (err) {
    // 중복 SKU(유니크 위반)면 친절한 메시지로 안내
    if (err.code === 11000) {
      return res.status(400).json({ message: '이미 사용 중인 SKU입니다. 다른 값을 입력해 주세요.' })
    }
    res.status(400).json({ message: err.message }) // 필수값 누락·enum 위반 등
  }
}

// [Read] 전체 상품 목록  ─ GET /api/products  (누구나)
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }) // 최신 등록순
    res.json(products)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// [Read] 상품 1개  ─ GET /api/products/:id  (누구나)
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// [Update] 상품 수정  ─ PUT /api/products/:id  (admin만)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!product) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' })
    res.json(product)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// [Delete] 상품 삭제  ─ DELETE /api/products/:id  (admin만)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' })
    res.json({ message: '상품이 삭제되었습니다.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
