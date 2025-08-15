'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Shield, Users } from 'lucide-react'

export default function LocationSetupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [permissionGranted, setPermissionGranted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated and has completed onboarding
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user profile exists
      const { data: profile } = await supabase
        .from('app_user')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        router.push('/onboarding')
        return
      }
    }
    checkAuth()
  }, [router])

  const requestLocationPermission = async () => {
    setLoading(true)
    setError('')

    try {
      if (!navigator.geolocation) {
        throw new Error('이 브라우저는 위치 서비스를 지원하지 않습니다.')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        )
      })

      const { latitude, longitude } = position.coords

      // Save location to database
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.')
      }

      const { error: locationError } = await supabase
        .rpc('update_user_location', {
          user_id: user.id,
          lat: latitude,
          lng: longitude
        })

      if (locationError) {
        throw new Error('위치 정보 저장에 실패했습니다.')
      }

      // Track location permission granted
      await supabase
        .from('user_event')
        .insert({
          user_id: user.id,
          event_name: 'location_permission_granted',
          event_data: {
            accuracy: position.coords.accuracy,
            latitude: latitude,
            longitude: longitude
          }
        })

      setPermissionGranted(true)
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('위치 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.')
            break
          case err.POSITION_UNAVAILABLE:
            setError('위치 정보를 가져올 수 없습니다.')
            break
          case err.TIMEOUT:
            setError('위치 요청 시간이 초과되었습니다. 다시 시도해주세요.')
            break
        }
      } else {
        setError(err instanceof Error ? err.message : '위치 설정 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    router.push('/dashboard')
  }

  const handleSkip = async () => {
    // Track location permission skipped
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('user_event')
        .insert({
          user_id: user.id,
          event_name: 'location_permission_skipped',
          event_data: {}
        })
    }

    router.push('/dashboard')
  }

  if (permissionGranted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">설정 완료!</CardTitle>
            <CardDescription>
              이제 근처 동문을 찾을 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Alumni Connect가 준비되었습니다.
              <br />
              반경 6km 내 동창들과 연결해보세요!
            </p>
            <Button onClick={handleComplete} className="w-full">
              시작하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600">위치 권한 설정</CardTitle>
          <CardDescription>
            근처 동문을 찾기 위해 위치 접근을 허용해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">근처 동문 발견</h3>
                <p className="text-sm text-gray-600">
                  반경 6km 내 같은 학교나 회사 출신을 찾아드립니다
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">프라이버시 보호</h3>
                <p className="text-sm text-gray-600">
                  정확한 위치는 공개되지 않으며, 거리만 표시됩니다
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={requestLocationPermission}
              className="w-full"
              disabled={loading}
            >
              {loading ? '위치 확인 중...' : '위치 권한 허용'}
            </Button>

            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-gray-600"
            >
              나중에 설정하기
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            위치 정보는 동문 매칭 목적으로만 사용되며,
            <br />
            언제든지 설정에서 변경할 수 있습니다.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}