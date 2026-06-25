// ============================================
//  회원(User) 컨트롤러 — 실제 일을 처리하는 '요리사'
//  models/user.js (스키마)를 가져와서 DB 작업을 한다.
// ============================================
const User = require('../models/user')
const bcrypt = require('bcryptjs') // 비밀번호 암호화(해시) 라이브러리
const jwt = require('jsonwebtoken') // JWT 토큰(로그인 증명서) 발급 라이브러리

// JWT 서명용 비밀키 — 코드에 직접 쓰지 않고 .env 의 JWT_SECRET 에서 읽어온다.
// (index.js 맨 위 require('dotenv').config() 가 .env 를 먼저 불러오므로 여기서 읽을 수 있음)
const JWT_SECRET = process.env.JWT_SECRET

// [Create] 회원 생성 (회원가입)  ─ POST /api/users
exports.createUser = async (req, res) => {
  try {
    // 비밀번호를 평문 대신 '해시(암호문)'로 변환 (salt rounds: 10)
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    // 평문 비번 대신 해시된 비번으로 회원 생성
    const user = await User.create({ ...req.body, password: hashedPassword })
    res.status(201).json(user)               // 201 = '새로 만들어짐'
  } catch (err) {
    res.status(400).json({ message: err.message }) // 입력값 문제 등
  }
}

// [Login] 로그인  ─ POST /api/users/login
//  회원가입(hash)의 '짝꿍': 입력한 비번을 저장된 해시와 compare로 대조한다.
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // 1) 이메일로 회원 찾기
    const user = await User.findOne({ email })

    // 2) 회원이 없거나 / 비번이 틀리면 → '같은 메시지'로 응답
    //    (어느 쪽이 틀렸는지 알려주면 "이 이메일은 가입돼 있구나"가 노출되어 보안에 불리)
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    }

    // 3) 로그인 성공 → JWT 토큰(영화표) 발급
    //    티켓에 담는 정보(payload)는 userId·user_type 만! (비밀번호는 절대 X)
    const token = jwt.sign(
      { userId: user._id, user_type: user.user_type },
      JWT_SECRET,
      { expiresIn: '1h' } // 유효기간 1시간 (영화표 만료시간)
    )

    // 4) 안전한 정보 + 토큰을 함께 응답 (비밀번호 해시는 절대 내보내지 않음)
    res.status(200).json({
      message: '로그인 성공',
      token, // ← 프론트가 이 토큰을 저장해두고, 이후 인증에 사용
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// [Me] 토큰으로 '내 정보' 조회  ─ GET /api/users/me  (auth 미들웨어 통과 필요)
//  auth 미들웨어가 토큰을 검증하고 req.user 에 넣어준 정보를 사용한다.
exports.getMe = async (req, res) => {
  try {
    // 토큰에서 꺼낸 userId 로 회원 찾기 — 비밀번호는 빼고(select '-password')
    const user = await User.findById(req.user.userId).select('-password')
    if (!user) return res.status(404).json({ message: '회원을 찾을 수 없습니다.' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// [Read] 전체 회원 목록  ─ GET /api/users  (관리자 전용: 라우트에서 auth+adminOnly 통과)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password') // 비밀번호 해시는 절대 내보내지 않음
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// [Read] 특정 회원 1명  ─ GET /api/users/:id  (본인 또는 관리자만)
exports.getUserById = async (req, res) => {
  try {
    // 본인 또는 관리자만 조회 가능 (남의 개인정보 열람 차단)
    if (req.user.user_type !== 'admin' && req.user.userId !== req.params.id) {
      return res.status(403).json({ message: '권한이 없습니다.' })
    }
    const user = await User.findById(req.params.id).select('-password') // 비밀번호 해시 제외
    if (!user) return res.status(404).json({ message: '회원을 찾을 수 없습니다.' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// [Update] 회원 정보 수정  ─ PUT /api/users/:id  (본인 또는 관리자만)
exports.updateUser = async (req, res) => {
  try {
    // 본인 또는 관리자만 수정 가능
    if (req.user.user_type !== 'admin' && req.user.userId !== req.params.id) {
      return res.status(403).json({ message: '권한이 없습니다.' })
    }
    // 일반 회원은 권한(user_type)을 스스로 바꿀 수 없음 (관리자 권한 탈취 방지)
    const updates = { ...req.body }
    if (req.user.user_type !== 'admin') delete updates.user_type
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }, // new: 수정된 결과를 돌려줌 / runValidators: 스키마 규칙 검사
    ).select('-password') // 비밀번호 해시 제외
    if (!user) return res.status(404).json({ message: '회원을 찾을 수 없습니다.' })
    res.json(user)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// [Delete] 회원 삭제  ─ DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ message: '회원을 찾을 수 없습니다.' })
    res.json({ message: '회원이 삭제되었습니다.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
