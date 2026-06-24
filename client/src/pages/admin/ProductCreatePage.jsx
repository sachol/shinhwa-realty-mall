import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'

function ProductCreatePage() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false) // admin 확인 전엔 화면 숨김

  // 입력값 (우리 상품 필드)
  const [form, setForm] = useState({
    sku: '',
    title: '',
    price: '',
    type: 'physical',
    category: 'office_supply',
    image: '',
    description: '',
  })

  // 관리자만 입장 (페이지 보호)
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetch('http://localhost:5000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((user) => {
        if (user.user_type !== 'admin') {
          navigate('/') // 관리자가 아니면 메인으로
          return
        }
        setAllowed(true)
      })
      .catch(() => navigate('/login'))
  }, [navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // admin 토큰 첨부 (auth + adminOnly 통과)
        },
        body: JSON.stringify({ ...form, price: Number(form.price) }), // 가격은 숫자로 변환
      })
      const data = await res.json()
      if (res.ok) {
        alert('상품이 등록되었습니다! 🎉')
        navigate('/admin')
      } else {
        alert('등록 실패: ' + (data.message || '다시 시도해 주세요.'))
      }
    } catch (err) {
      alert('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  // Cloudinary 업로드 위젯 열기 → 업로드 성공하면 이미지 URL을 form.image 에 저장
  const openUploadWidget = () => {
    if (!window.cloudinary) {
      alert('이미지 업로더를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,     // .env 에서 읽음
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET, // .env 에서 읽음
        sources: ['local', 'url', 'camera'], // 내 파일·웹주소·카메라
        multiple: false,                       // 한 장만
        language: 'ko',                        // 한국어 UI
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          // 업로드된 이미지의 HTTPS 주소를 저장 → 미리보기 + 상품 등록에 사용
          setForm((prev) => ({ ...prev, image: result.info.secure_url }))
        }
      }
    )
    widget.open()
  }

  if (!allowed) return null

  return (
    <div className="home">
      <Navbar />

      <main className="product-create">
        <h1 className="product-create-title">새 상품 등록</h1>
        <p className="product-create-sub">공인중개사 올인원 마켓에 등록할 상품 정보를 입력하세요.</p>

        <div className="product-create-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-label">
              SKU (상품 식별코드)
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="예: OFC-001"
                required
              />
            </label>

            <label className="auth-label">
              상품명
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="상품명을 입력하세요"
                required
              />
            </label>

            <label className="auth-label">
              가격 (원)
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="가격을 입력하세요"
                min="0"
                required
              />
            </label>

            <label className="auth-label">
              유형
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="physical">실물 (배송)</option>
                <option value="digital">디지털 (다운로드)</option>
              </select>
            </label>

            <label className="auth-label">
              카테고리
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="office_supply">사무용품</option>
                <option value="education">교육콘텐츠</option>
                <option value="auction">경매 컨설팅</option>
                <option value="coaching">AI 과정·코칭</option>
              </select>
            </label>

            <label className="auth-label">
              대표 이미지 <span className="label-optional">(선택)</span>
              <button type="button" className="upload-btn" onClick={openUploadWidget}>
                {form.image ? '이미지 변경' : 'Cloudinary로 이미지 업로드'}
              </button>
            </label>

            {/* 업로드 성공 시 미리보기 */}
            {form.image && (
              <div className="image-preview">
                <img src={form.image} alt="상품 이미지 미리보기" />
              </div>
            )}

            <label className="auth-label">
              상품 설명 <span className="label-optional">(선택)</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="상품 설명을 입력하세요"
                rows="4"
              />
            </label>

            <button type="submit" className="auth-button">상품 등록</button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ProductCreatePage
