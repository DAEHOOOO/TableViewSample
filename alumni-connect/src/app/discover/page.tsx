'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Candidate } from '@/types/database'
import { MapPin, MessageSquare, RefreshCw, User, Users } from 'lucide-react'

export default function DiscoverPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadCandidates()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCandidates = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get user's current location
      const { data: locationData } = await supabase
        .from('user_location')
        .select('coord')
        .eq('user_id', user.id)
        .single()

      if (!locationData?.coord) {
        setError('위치 정보가 필요합니다. 설정에서 위치를 업데이트해주세요.')
        return
      }

      // Extract coordinates from PostGIS POINT
      // coord format: "POINT(lng lat)"
      const coordMatch = locationData.coord.match(/POINT\(([-\d.]+) ([-\d.]+)\)/)
      if (!coordMatch) {
        setError('위치 정보 형식에 오류가 있습니다.')
        return
      }

      const lng = parseFloat(coordMatch[1])
      const lat = parseFloat(coordMatch[2])
      setUserLocation({ lat, lng })

      // Find candidates within 6km
      const response = await fetch(
        `/api/candidates?lat=${lat}&lng=${lng}`
      )

      if (!response.ok) {
        throw new Error('후보 조회에 실패했습니다.')
      }

      const data = await response.json()
      setCandidates(data.candidates || [])

      // Track candidate view event
      await supabase
        .from('user_event')
        .insert({
          user_id: user.id,
          event_name: 'view_candidates',
          event_data: {
            count: data.candidates?.length || 0,
            location: { lat, lng }
          }
        })

    } catch (error) {
      console.error('Error loading candidates:', error)
      setError(error instanceof Error ? error.message : '후보 로딩 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = async (candidateId: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Create chat room
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: candidateId
        })
      })

      if (!response.ok) {
        throw new Error('채팅방 생성에 실패했습니다.')
      }

      const data = await response.json()

      // Track start chat event
      await supabase
        .from('user_event')
        .insert({
          user_id: user.id,
          event_name: 'start_chat',
          event_data: {
            candidate_id: candidateId,
            room_id: data.roomId
          }
        })

      // Navigate to chat
      router.push(`/chat/${data.roomId}`)

    } catch (error) {
      console.error('Error starting chat:', error)
      alert(error instanceof Error ? error.message : '채팅 시작 중 오류가 발생했습니다.')
    }
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  const getCurrentLocationAndRefresh = async () => {
    setLoading(true)
    try {
      if (!navigator.geolocation) {
        throw new Error('위치 서비스를 지원하지 않는 브라우저입니다.')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const { latitude, longitude } = position.coords

      // Update location in database
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

             if (user) {
         await supabase
           .rpc('update_user_location', {
             user_id: user.id,
             lat: latitude,
             lng: longitude
           })
       }

      // Reload candidates with new location
      await loadCandidates()
         } catch {
       setError('위치 업데이트에 실패했습니다. 위치 권한을 확인해주세요.')
     }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600">근처 동문 찾기</h1>
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              돌아가기
            </Button>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">근처 동문을 찾고 있습니다...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-blue-600">근처 동문 찾기</h1>
            {userLocation && (
              <p className="text-sm text-gray-600">
                현재 위치 기준 반경 6km 내 검색
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={getCurrentLocationAndRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              돌아가기
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>{error}</p>
                <div className="mt-4 space-x-2">
                  <Button variant="outline" onClick={() => router.push('/location-setup')}>
                    위치 설정하기
                  </Button>
                  <Button onClick={loadCandidates}>
                    다시 시도
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!error && candidates.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                                 <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  주변에 동문이 없습니다
                </h3>
                <p className="text-gray-600 mb-4">
                  현재 반경 6km 내에 공통 소속을 가진 사용자가 없습니다.
                  <br />
                  나중에 다시 확인해보세요!
                </p>
                <div className="space-x-2">
                  <Button onClick={getCurrentLocationAndRefresh}>
                    위치 업데이트 후 재검색
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard')}>
                    대시보드로 돌아가기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {candidates.length > 0 && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                발견된 동문 {candidates.length}명
              </h2>
              <p className="text-sm text-gray-600">
                공통 소속을 가진 근처 사용자들입니다. 익명으로 대화를 시작해보세요!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {candidates.map((candidate) => (
                <Card key={candidate.candidate_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{candidate.nickname}</CardTitle>
                          <CardDescription className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{formatDistance(candidate.distance_meters)} 거리</span>
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Common Affiliations */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">공통 소속</h4>
                        <div className="flex flex-wrap gap-2">
                          {candidate.common_affiliations.map((affiliation, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {affiliation}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button 
                        className="w-full" 
                        onClick={() => handleStartChat(candidate.candidate_id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        말 걸기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tips */}
            <Card className="mt-8">
              <CardContent className="pt-6">
                <h3 className="font-medium text-gray-900 mb-2">💡 사용 팁</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 공통 소속이 많을수록 더 많은 대화 주제가 있을 수 있습니다</li>
                  <li>• 익명 채팅이므로 개인 정보는 공유되지 않습니다</li>
                  <li>• 불편한 상대방은 언제든 차단하거나 신고할 수 있습니다</li>
                  <li>• 위치는 실시간으로 업데이트되니 이동 후 새로고침해보세요</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}