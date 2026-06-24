// ============================================
//  장바구니(Cart) 컨트롤러 — 실제 일을 처리하는 '요리사'
//  로그인한 회원(req.user.userId)의 장바구니를 다룬다.
//  ※ 인증은 auth 미들웨어가 먼저 처리해 req.user 에 { userId, user_type } 를 넣어준다.
// ============================================
const Cart = require('../models/cart')
const Product = require('../models/product')

// 합계(요약) 다시 계산 — items가 바뀔 때마다 호출해 totalItems/totalAmount 를 최신으로 유지
// (price 는 '담을 당시 가격' 이므로, 나중에 상품 가격이 바뀌어도 장바구니 합계는 흔들리지 않음)
function recalc(cart) {
  cart.totalItems = cart.items.reduce((sum, it) => sum + it.quantity, 0)
  cart.totalAmount = cart.items.reduce((sum, it) => sum + it.price * it.quantity, 0)
}

// [Read] 내 장바구니 보기 ─ GET /api/cart
exports.getCart = async (req, res) => {
  try {
    // 내 장바구니를 찾고, 담긴 상품의 상세정보(title·image 등)까지 함께 가져온다(populate)
    const cart = await Cart.findOne({ user: req.user.userId }).populate('items.product')
    // 아직 장바구니가 없으면 '빈 장바구니' 모양으로 응답 (프론트가 다루기 쉽게)
    if (!cart) {
      return res.json({ items: [], totalItems: 0, totalAmount: 0 })
    }
    // 관리자가 삭제한 상품(product=null)은 장바구니에서 자동 정리 — '유령 합계' 방지
    const before = cart.items.length
    cart.items = cart.items.filter((it) => it.product != null)
    if (cart.items.length !== before) {
      recalc(cart)
      await cart.save()
    }
    res.json(cart)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// [Create] 장바구니에 담기 ─ POST /api/cart   body: { productId, quantity }
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body

    // 1) 담을 상품이 실제로 있는지 확인 + 현재 가격을 가져온다(스냅샷용)
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' })

    // 2) 내 장바구니 찾기 — 없으면 새로 만든다 (회원당 1개)
    let cart = await Cart.findOne({ user: req.user.userId })
    if (!cart) {
      cart = new Cart({ user: req.user.userId, items: [] })
    }

    // 3) 디지털·서비스(type=digital)는 '1개만' — 실물만 수량 가변
    const isDigital = product.type === 'digital'
    const existing = cart.items.find((it) => it.product.toString() === productId)
    let alreadyAdded = false
    if (existing) {
      if (isDigital) {
        alreadyAdded = true // 디지털은 이미 있으면 수량을 늘리지 않는다 (중복 누적 방지)
      } else {
        existing.quantity += Number(quantity) // 실물만 수량 누적
      }
    } else {
      cart.items.push({
        product: product._id,
        quantity: isDigital ? 1 : Number(quantity), // 디지털은 무조건 1
        price: product.price, // 담을 당시 가격을 박제(스냅샷)
      })
    }

    // 4) 합계 다시 계산 후 저장
    recalc(cart)
    await cart.save()

    // 5) 상품 상세까지 채워서 응답 (이미 담긴 디지털이면 alreadyAdded=true)
    await cart.populate('items.product')
    res.status(201).json({ cart, alreadyAdded })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// [Update] 항목 수량 변경 ─ PUT /api/cart/items/:itemId   body: { quantity }
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: '수량은 1개 이상이어야 합니다.' })
    }

    const cart = await Cart.findOne({ user: req.user.userId }).populate('items.product')
    if (!cart) return res.status(404).json({ message: '장바구니가 비어 있습니다.' })

    // 임베드 배열에서 해당 항목(itemId) 찾기 — DocumentArray 의 .id() 사용
    const item = cart.items.id(req.params.itemId)
    if (!item) return res.status(404).json({ message: '장바구니 항목을 찾을 수 없습니다.' })

    // 디지털·서비스는 수량 1 고정이라 변경 불가 (실물만 수량 조절)
    if (item.product && item.product.type === 'digital') {
      return res.status(400).json({ message: '디지털·서비스 상품은 수량을 변경할 수 없습니다.' })
    }

    item.quantity = Number(quantity)
    recalc(cart)
    await cart.save()

    await cart.populate('items.product')
    res.json(cart)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// [Delete] 항목 빼기 ─ DELETE /api/cart/items/:itemId
exports.removeCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.userId })
    if (!cart) return res.status(404).json({ message: '장바구니가 비어 있습니다.' })

    const item = cart.items.id(req.params.itemId)
    if (!item) return res.status(404).json({ message: '장바구니 항목을 찾을 수 없습니다.' })

    cart.items.pull(req.params.itemId) // _id 로 해당 항목 제거
    recalc(cart)
    await cart.save()

    await cart.populate('items.product')
    res.json(cart)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// [Delete] 장바구니 통째로 비우기 ─ DELETE /api/cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.userId })
    // 장바구니가 없으면 이미 빈 것이나 마찬가지 → 빈 모양으로 응답
    if (!cart) return res.json({ items: [], totalItems: 0, totalAmount: 0 })

    cart.items = [] // 담긴 상품 전부 제거
    recalc(cart)    // 합계도 0으로 다시 계산
    await cart.save()
    res.json(cart)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
