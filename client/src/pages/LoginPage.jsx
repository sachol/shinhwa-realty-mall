import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from '../config'

function LoginPage() {
  const navigate = useNavigate() // 로그인 성공 후 페이지 이동에 사용

  // 입력값 (로그인은 이메일·비밀번호만)
  const [form, setForm] = useState({ email: '', password: '' })

  // 이미 로그인된 상태(유효한 토큰 보유)면 → 로그인 페이지 대신 메인으로 보냄
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return // 토큰 없으면 그대로 로그인 페이지에 머무름

    // 토큰이 진짜 유효한지 /me 로 확인 → 유효하면 메인으로 이동
    fetch(API_BASE + '/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) navigate('/') // 유효한 토큰 → 이미 로그인 상태 → 메인으로
      })
      .catch(() => {
        // 네트워크 오류 등은 무시하고 로그인 페이지에 머무름
      })
  }, [navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 백엔드(포트 5000)로 로그인 요청
    try {
      const res = await fetch(API_BASE + '/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form), // { email, password }
      })

      const data = await res.json()

      if (res.ok) {
        // 로그인 성공 → 받은 '티켓(토큰)'을 브라우저 보관함에 저장
        localStorage.setItem('token', data.token)
        // 유저 정보도 보관 ('OO님 환영합니다'에 사용 예정)
        localStorage.setItem('user', JSON.stringify(data.user))
        alert(`${data.user.name}님 환영합니다! 🎉`)
        navigate('/') // 메인으로 이동
      } else {
        // 401 등 — 서버가 보낸 에러 메시지 표시
        alert('로그인 실패: ' + (data.message || '다시 시도해 주세요.'))
      }
    } catch (err) {
      // 서버가 꺼져있거나 인터넷이 끊긴 경우
      alert('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand" aria-label="공인중개사 올인원 홈">
          <span className="logo-icon" aria-hidden="true">🏠</span>
          <span className="logo-name">공인중개사</span>
          <span className="logo-badge">올인원</span>
        </Link>
        <h1 className="auth-title">로그인</h1>
        <p className="auth-subtitle">다시 오신 것을 환영합니다.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            이메일
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              required
            />
          </label>

          <label className="auth-label">
            비밀번호
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </label>

          <button type="submit" className="auth-button">로그인</button>
        </form>

        <p className="auth-footer">
          아직 회원이 아니신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
