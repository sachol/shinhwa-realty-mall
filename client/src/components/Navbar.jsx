import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config'

// 상단바(네비게이션) — 로그인 상태에 따라 다르게 표시.
// 여러 페이지에서 재사용할 수 있도록 별도 컴포넌트로 분리했다.
function Navbar() {
  // 로그인한 회원 정보 (없으면 null = 비로그인 상태)
  // 페이지 이동·새로고침 시 깜빡임 방지: 저장해둔 회원 정보로 먼저 표시한 뒤,
  // 아래 useEffect 의 /me 호출로 서버에서 다시 확인(만료·위조면 로그아웃 처리).
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  // 드롭다운 메뉴 열림/닫힘 상태
  const [menuOpen, setMenuOpen] = useState(false)
  // 장바구니에 담긴 총 개수 (🛒 뱃지에 표시)
  // 화면 전환 시 숫자가 깜빡이지 않도록, 저장해둔 개수로 먼저 표시한 뒤 아래에서 서버로 보정.
  const [cartCount, setCartCount] = useState(() => {
    const saved = Number(localStorage.getItem('cartCount'))
    return Number.isFinite(saved) ? saved : 0
  })
  // 메뉴 영역(바깥 클릭 감지에 사용)
  const menuRef = useRef(null)

  // 처음 그려질 때 1번: 토큰이 있으면 '내 정보'를 가져온다
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return // 토큰 없으면 비로그인 → 아무것도 안 함

    // 토큰을 들고 검문소(/me)에 "나 누구야?" 물어보기
    fetch(API_BASE + '/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('유효하지 않은 토큰')
        return res.json()
      })
      .then((data) => setUser(data)) // 성공 → 회원 정보 저장
      .catch(() => {
        // 토큰이 만료/위조됐으면 → 보관함 비우고 비로그인 상태로
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      })
  }, [])

  // 장바구니 개수를 서버에서 가져와 뱃지에 반영 (여러 곳에서 재사용하는 함수)
  const fetchCartCount = () => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(API_BASE + '/api/cart', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((cart) => {
        const n = cart?.totalItems || 0
        setCartCount(n)
        localStorage.setItem('cartCount', String(n)) // 다음 화면 전환 때 바로 보여주려고 저장
      })
      .catch(() => {}) // 실패해도 화면은 그대로 (개수만 0)
  }

  // 로그인된 회원이면 장바구니 개수를 가져온다
  useEffect(() => {
    if (user) fetchCartCount()
  }, [user])

  // 다른 화면에서 담기/빼기가 일어나면 'cart-updated' 신호를 받아 개수를 다시 불러온다
  useEffect(() => {
    const handler = () => fetchCartCount()
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  // (보너스) 드롭다운 바깥 클릭 시 메뉴 닫기 — 열려 있을 때만 감지
  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  // 로그아웃: 토큰(영화표)을 버리고 비로그인 상태로
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCartCount(0)    // 장바구니 개수도 초기화
    localStorage.removeItem('cartCount') // 저장된 개수도 비우기
    setMenuOpen(false) // 메뉴도 닫기
  }

  return (
    <header className="home-nav">
      {/* 로고 클릭 시 메인으로 이동 — 공인중개사 정체성 + 올인원 뱃지 (3D 남색 버튼) */}
      <Link to="/" className="home-logo" aria-label="공인중개사 올인원 홈">
        <span className="logo-icon" aria-hidden="true">🏠</span>
        <span className="logo-name">공인중개사</span>
        <span className="logo-badge">올인원</span>
      </Link>

      <div className="home-nav-actions">
        {user ? (
          // ── 로그인 상태: 장바구니 + (admin 버튼) + 인사말 드롭다운 ──
          <>
            {/* 장바구니 — 로그인한 회원 누구나 사용 (담긴 개수가 있으면 뱃지 표시) */}
            <Link to="/cart" className="cart-btn" aria-label="장바구니" title="장바구니">
              🛒
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {/* admin 권한(user_type === 'admin')일 때만 보이는 버튼 — role 아님! */}
            {user.user_type === 'admin' && (
              <Link to="/admin" className="btn btn-ghost">admin</Link>
            )}

            <div className="user-menu" ref={menuRef}>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)} // 누를 때마다 열고/닫기
              >
                {user.name}님 환영합니다! {menuOpen ? '▲' : '▾'}
              </button>

              {menuOpen && (
                <div className="user-menu-dropdown">
                  {user.user_type === 'admin' ? (
                    // 관리자: 일반 손님처럼 '내 주문'이 아니라 관리 동선으로
                    <>
                      <Link to="/admin" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                        🛠 관리자 대시보드
                      </Link>
                      <Link to="/admin/orders" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                        📋 주문 관리
                      </Link>
                    </>
                  ) : (
                    // 일반 회원: 내 주문 목록
                    <Link to="/orders" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                      📦 내 주문 목록
                    </Link>
                  )}
                  <button type="button" className="user-menu-item danger" onClick={handleLogout}>
                    🚪 로그아웃
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          // ── 비로그인 상태: 로그인 + 회원가입 ──
          <>
            <Link to="/login" className="btn btn-ghost">로그인</Link>
            <Link to="/signup" className="btn btn-primary">회원가입</Link>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar
