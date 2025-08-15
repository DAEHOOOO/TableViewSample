'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppUser } from '@/types/database'
import { MessageSquare, Users, MapPin, Settings } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/login')
          return
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('app_user')
          .select('*')
          .eq('user_id', authUser.id)
          .single()

        if (!profile) {
          router.push('/onboarding')
          return
        }

        setUser(profile)

        // Track dashboard view
        await supabase
          .from('user_event')
          .insert({
            user_id: authUser.id,
            event_name: 'dashboard_view',
            event_data: {}
          })
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Alumni Connect</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">안녕하세요, {user?.nickname}님!</span>
            <Button variant="ghost" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Find Candidates */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/discover')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                근처 동문 찾기
              </CardTitle>
              <CardDescription>
                반경 6km 내 같은 소속 출신들을 찾아보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push('/discover')}>
                동문 둘러보기
              </Button>
            </CardContent>
          </Card>

          {/* My Chats */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                내 채팅
              </CardTitle>
              <CardDescription>
                진행 중인 대화를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                채팅 목록
              </Button>
            </CardContent>
          </Card>

          {/* Location Settings */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                위치 설정
              </CardTitle>
              <CardDescription>
                위치 권한 및 검색 범위 설정
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                위치 관리
              </Button>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                프로필 설정
              </CardTitle>
              <CardDescription>
                닉네임, 소속 정보 등을 수정하거나 계정을 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline">
                  프로필 수정
                </Button>
                <Button variant="outline">
                  소속 관리
                </Button>
                <Button variant="outline">
                  계정 설정
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Alumni Connect에 오신 것을 환영합니다! 🎉
              </h2>
              <p className="text-gray-600 mb-4">
                이제 근처 동창·동문들과 익명으로 대화를 시작할 수 있습니다.
                <br />
                &ldquo;근처 동문 찾기&rdquo;를 클릭해서 첫 만남을 시작해보세요!
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => router.push('/discover')}>
                  동문 찾기 시작
                </Button>
                <Button variant="outline">
                  사용법 알아보기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}