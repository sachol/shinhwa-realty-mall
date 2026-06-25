// ============================================
//  주문(Order) 컨트롤러 — 장바구니를 '주문서'로 확정하는 곳
//  로그인 회원(req.user.userId)의 주문을 생성·조회한다. (auth 미들웨어가 먼저 통과시킴)
//  ※ 우리 방식: 모델은 순수하게 두고, 번호 생성·총액 계산·조회 로직은 여기(컨트롤러)에서 처리
// ============================================
const Order = require('../models/order')
const Cart = require('../models/cart')

// 오늘 날짜 기반 주문번호 생성 (예: ORD-20260622-001) — 그날 순번을 붙인다
async function makeOrderNumber() {
  const now = new Date()
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  // 오늘 만들어진 주문 수 + 1 = 오늘의 순번
  const countToday = await Order.countDocuments({ orderNumber: new RegExp('^ORD-' + dateStr) })
  return 'ORD-' + dateStr + '-' + String(countToday + 1).padStart(3, '0')
}

// [Create] 주문 생성 ─ POST /api/orders
//  body: { orderer:{name,email,phone}, shipping:{recipient,phone,address,detailAddress,zipcode}, memo }
exports.createOrder = async (req, res) => {
  try {
    const { orderer, shipping, memo, paymentMethod, orderNumber, impUid } = req.body

    // 1) 주문자 기본 정보 확인 (이름·이메일 필수 — 이메일은 디지털 전달·영수증에 사용)
    if (!orderer || !orderer.name || !orderer.email) {
      return res.status(400).json({ message: '주문자 이름과 이메일을 입력해 주세요.' })
    }

    // 1-1) 더블주문 확인 — 같은 결제번호로 이미 만든 주문이 있으면 막는다 (강사 강조)
    if (orderNumber) {
      const dup = await Order.findOne({ orderNumber })
      if (dup) return res.status(409).json({ message: '이미 처리된 주문입니다.' })
    }

    // 2) 내 장바구니 가져오기 (상품 정보 포함)
    const cart = await Cart.findOne({ user: req.user.userId }).populate('items.product')
    const validItems = (cart?.items || []).filter((it) => it.product) // 삭제된 상품 제외
    if (validItems.length === 0) {
      return res.status(400).json({ message: '장바구니가 비어 있습니다.' })
    }

    // 3) 장바구니 → 주문 항목으로 '스냅샷' (그때의 정보를 박제해 보존)
    const items = validItems.map((it) => ({
      product: it.product._id,
      title: it.product.title,
      price: it.price, // 담을 당시 가격(스냅샷)
      quantity: it.quantity,
      type: it.product.type,
    }))

    // 4) 금액 계산 (장바구니 규칙과 동일: 실물 있으면 배송비 3,000 / 디지털만이면 0)
    const totalAmount = items.reduce((s, it) => s + it.price * it.quantity, 0)
    const hasPhysical = items.some((it) => it.type === 'physical')
    const shippingFee = hasPhysical ? 3000 : 0
    const finalAmount = totalAmount + shippingFee

    // 5) 실물이 있으면 배송지 필수 (디지털·서비스만이면 배송지 없이 진행)
    if (hasPhysical) {
      if (!shipping || !shipping.recipient || !shipping.address) {
        return res.status(400).json({ message: '실물 상품은 받는 분과 주소가 필요합니다.' })
      }
    }

    // 5-1) 결제 검증 (포트원 V2) — 위변조 방지: 포트원 서버에 "진짜 결제됐는지·금액이 맞는지" 되묻는다.
    //   ※ 강사님은 V1(api.iamport.kr + IAMPORT_API_KEY/SECRET) 방식이지만, 우리는 V2 채널이라 V2로 검증한다.
    //   ※ PORTONE_V2_API_SECRET 이 .env 에 있을 때만 검증 — 없으면(미발급) 테스트 단계로 보고 건너뛴다.
    //   ※ 개발 중 검증만 끄고 싶으면 .env 에 SKIP_PAYMENT_VERIFICATION=true (Secret 은 그대로 둔 채). 강사님 권장.
    const apiSecret = process.env.PORTONE_V2_API_SECRET
    const skipVerify = process.env.SKIP_PAYMENT_VERIFICATION === 'true'
    if (apiSecret && orderNumber && !skipVerify) {
      // 결제 식별번호(orderNumber=paymentId)로 포트원에 결제 내역을 조회한다
      const verifyRes = await fetch(
        `https://api.portone.io/payments/${encodeURIComponent(orderNumber)}`,
        { headers: { Authorization: `PortOne ${apiSecret}` } },
      )
      if (!verifyRes.ok) {
        const errText = await verifyRes.text() // 실패 원인(인증 오류·없는 결제 등)을 서버 콘솔에 남겨 디버깅
        console.warn('⚠️ 포트원 결제 조회 실패:', verifyRes.status, errText)
        return res.status(400).json({ message: '결제 정보를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.' })
      }
      const paid = await verifyRes.json()
      // (a) 실제로 결제가 완료된 건인가?
      if (paid.status !== 'PAID') {
        return res.status(400).json({ message: '아직 결제가 완료되지 않았습니다. (상태: ' + paid.status + ')' })
      }
      // (b) 결제된 금액이 우리가 계산한 주문 금액과 같은가? (금액 조작 방지)
      if (paid.amount?.total !== finalAmount) {
        return res.status(400).json({ message: '결제 금액이 주문 금액과 일치하지 않습니다.' })
      }
      console.log(`✅ 결제 검증 통과: ${orderNumber} / ${finalAmount}원 (포트원 V2)`)
    }

    // 6) 결제가 끝난 뒤 호출되므로 '결제완료(paid)' 상태로 주문을 만든다 (강사 강조: 결제 확인 후 생성)
    const order = await Order.create({
      orderNumber: orderNumber || (await makeOrderNumber()), // 결제 식별번호 사용(없으면 자동 생성)
      user: req.user.userId,
      items,
      orderer,
      shipping: hasPhysical ? shipping : undefined,
      memo,
      totalAmount,
      shippingFee,
      finalAmount,
      payment: { method: paymentMethod || '신용카드', status: 'paid', paidAt: new Date(), impUid },
      // 결제 완료 = '주문접수'로 시작. 이후 관리자가 어드민에서 단계를 올린다.
      //  (실물=제작→배송→완료 / 디지털=발송 후 완료 / 서비스=일정조율 후 완료)
      status: 'placed',
    })

    // 결제까지 끝났으니 장바구니를 비운다
    cart.items = []
    cart.totalItems = 0
    cart.totalAmount = 0
    await cart.save()

    res.status(201).json(order)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// [Read] 내 주문 목록 ─ GET /api/orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .populate('items.product', 'title image type category')
      .sort({ createdAt: -1 }) // 최신 주문순
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// [Read] 전체 주문 목록 ─ GET /api/orders/all  (관리자 전용: auth → adminOnly 통과해야 도달)
//  모든 회원의 주문을 최신순으로 돌려준다. 어드민 '주문 관리' 페이지에서 사용.
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product', 'title image type category')
      .sort({ createdAt: -1 }) // 최신 주문순
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// [Read] 주문 상세 1건 ─ GET /api/orders/:id
//  기본은 '본인 주문만' 조회. 단, 관리자(user_type==='admin')는 모든 주문을 볼 수 있다
//  (어드민 '주문 관리 → 주문 상세보기'에서 고객 주문을 열어봐야 하기 때문).
exports.getOrderById = async (req, res) => {
  try {
    // 관리자면 주인 조건 없이, 일반 회원이면 본인 주문으로 한정
    const query =
      req.user.user_type === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, user: req.user.userId }
    const order = await Order.findOne(query)
      .populate('items.product', 'title image type category')
    if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// 우리 주문 상태 값(영문 코드) — 화면엔 한글 라벨로 보여준다
const VALID_STATUS = ['placed', 'making', 'shipping', 'completed', 'cancelled']

// [Update] 주문 상태 변경 ─ PUT /api/orders/:id/status  (관리자 전용: auth → adminOnly 통과)
//  body: { status } — 허용된 상태값만. 어드민 주문관리의 상태 드롭다운에서 호출.
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({ message: '유효하지 않은 주문 상태입니다.' })
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }, // 변경 후 문서 반환 + 스키마 검증
    )
    if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' })
    res.json(order)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
