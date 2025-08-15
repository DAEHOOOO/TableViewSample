import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Alumni Connect</h1>
          <div className="space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">회원가입</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
              내 근처 동창·동문과
              <br />
                              <span className="text-blue-600">가볍게 연결되세요</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              반경 6km 내 같은 학교나 회사 출신들과 익명으로 대화를 시작할 수 있는 가장 쉬운 방법
            </p>
          </div>

          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link href="/onboarding">시작하기</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/about">더 알아보기</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  📍
                </div>
                근처 동문 발견
              </CardTitle>
              <CardDescription>
                6km 반경 내에서 같은 학교나 회사 출신을 자동으로 찾아드립니다
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  💬
                </div>
                익명 채팅
              </CardTitle>
              <CardDescription>
                실명 부담 없이 1:1로 가볍게 대화를 시작할 수 있습니다
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  🛡️
                </div>
                안전한 환경
              </CardTitle>
              <CardDescription>
                차단과 신고 기능으로 안전하고 건전한 만남을 보장합니다
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How it works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">어떻게 동작하나요?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "가입 및 소속 입력",
                description: "나이 확인 후 학교나 회사 정보를 입력합니다"
              },
              {
                step: "2", 
                title: "위치 권한 허용",
                description: "주변 동문을 찾기 위해 위치 접근을 허용합니다"
              },
              {
                step: "3",
                title: "후보 확인",
                description: "공통 소속이 있는 근처 사람들을 확인합니다"
              },
              {
                step: "4",
                title: "대화 시작",
                description: "'말 걸기'를 눌러 익명 채팅을 시작합니다"
              }
            ].map((item) => (
              <div key={item.step} className="text-center space-y-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto">
                  {item.step}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; 2024 Alumni Connect. All rights reserved.</p>
            <div className="mt-4 space-x-4">
              <Link href="/privacy" className="hover:underline">개인정보처리방침</Link>
              <Link href="/terms" className="hover:underline">이용약관</Link>
              <Link href="/contact" className="hover:underline">문의하기</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
