'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AffiliationType } from '@/types/database'
import { Plus, X } from 'lucide-react'

interface Affiliation {
  type: AffiliationType
  name: string
  startYear?: number
  endYear?: number
  department?: string
  major?: string
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Step 1: Basic Info
  const [nickname, setNickname] = useState('')
  const [birthYear, setBirthYear] = useState('')

  // Step 2: Affiliations
  const [affiliations, setAffiliations] = useState<Affiliation[]>([
    { type: 'univ', name: '', startYear: undefined, endYear: undefined }
  ])

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  const addAffiliation = () => {
    setAffiliations([...affiliations, { type: 'univ', name: '' }])
  }

  const removeAffiliation = (index: number) => {
    if (affiliations.length > 1) {
      setAffiliations(affiliations.filter((_, i) => i !== index))
    }
  }

  const updateAffiliation = (index: number, field: keyof Affiliation, value: string | number | undefined) => {
    const updated = [...affiliations]
    updated[index] = { ...updated[index], [field]: value }
    setAffiliations(updated)
  }

  const handleStep1Submit = () => {
    setError('')
    
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.')
      return
    }

    if (!birthYear) {
      setError('출생연도를 입력해주세요.')
      return
    }

    const currentYear = new Date().getFullYear()
    const age = currentYear - parseInt(birthYear)

    if (age < 19) {
      setError('만 19세 이상만 가입할 수 있습니다.')
      return
    }

    if (age > 100) {
      setError('올바른 출생연도를 입력해주세요.')
      return
    }

    setStep(2)
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.')
      }

      // Create user profile
      const { error: userError } = await supabase
        .from('app_user')
        .insert({
          user_id: user.id,
          nickname: nickname.trim(),
          birth_year: parseInt(birthYear)
        })

      if (userError) {
        throw new Error('사용자 정보 저장에 실패했습니다.')
      }

      // Save affiliations
      const validAffiliations = affiliations.filter(a => a.name.trim())
      if (validAffiliations.length > 0) {
        const { error: affiliationError } = await supabase
          .from('affiliation')
          .insert(
            validAffiliations.map(affiliation => ({
              user_id: user.id,
              type: affiliation.type,
              name: affiliation.name.trim(),
              start_year: affiliation.startYear,
              end_year: affiliation.endYear,
              department: affiliation.department?.trim(),
              major: affiliation.major?.trim()
            }))
          )

        if (affiliationError) {
          throw new Error('소속 정보 저장에 실패했습니다.')
        }
      }

      // Track onboarding completion
      await supabase
        .from('user_event')
        .insert({
          user_id: user.id,
          event_name: 'onboarding_completed',
          event_data: {
            affiliations_count: validAffiliations.length,
            age: new Date().getFullYear() - parseInt(birthYear)
          }
        })

      router.push('/location-setup')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getAffiliationTypeLabel = (type: AffiliationType) => {
    const labels = {
      elementary: '초등학교',
      middle: '중학교', 
      high: '고등학교',
      univ: '대학교',
      grad: '대학원',
      company: '회사'
    }
    return labels[type]
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-600">프로필 설정</CardTitle>
            <CardDescription>
              기본 정보를 입력해주세요 (1/2)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                placeholder="사용할 닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
              />
              <p className="text-xs text-gray-500">다른 사용자에게 표시되는 이름입니다</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthYear">출생연도</Label>
              <Input
                id="birthYear"
                type="number"
                placeholder="예: 1990"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                min="1920"
                max={new Date().getFullYear() - 19}
              />
              <p className="text-xs text-gray-500">만 19세 이상만 가입 가능합니다</p>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <Button onClick={handleStep1Submit} className="w-full">
              다음 단계
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">소속 정보</CardTitle>
          <CardDescription>
            학교나 회사 정보를 입력해주세요 (2/2)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {affiliations.map((affiliation, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">소속 {index + 1}</h3>
                  {affiliations.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAffiliation(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>종류</Label>
                    <Select
                      value={affiliation.type}
                      onValueChange={(value: AffiliationType) =>
                        updateAffiliation(index, 'type', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elementary">초등학교</SelectItem>
                        <SelectItem value="middle">중학교</SelectItem>
                        <SelectItem value="high">고등학교</SelectItem>
                        <SelectItem value="univ">대학교</SelectItem>
                        <SelectItem value="grad">대학원</SelectItem>
                        <SelectItem value="company">회사</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>이름</Label>
                    <Input
                      placeholder={`${getAffiliationTypeLabel(affiliation.type)} 이름`}
                      value={affiliation.name}
                      onChange={(e) =>
                        updateAffiliation(index, 'name', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>시작년도</Label>
                    <Input
                      type="number"
                      placeholder="예: 2010"
                      value={affiliation.startYear || ''}
                      onChange={(e) =>
                        updateAffiliation(index, 'startYear', parseInt(e.target.value) || undefined)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>종료년도 (선택)</Label>
                    <Input
                      type="number"
                      placeholder="예: 2014"
                      value={affiliation.endYear || ''}
                      onChange={(e) =>
                        updateAffiliation(index, 'endYear', parseInt(e.target.value) || undefined)
                      }
                    />
                  </div>
                </div>

                {(affiliation.type === 'univ' || affiliation.type === 'grad') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>학과 (선택)</Label>
                      <Input
                        placeholder="전공 학과"
                        value={affiliation.major || ''}
                        onChange={(e) =>
                          updateAffiliation(index, 'major', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>단과대학 (선택)</Label>
                      <Input
                        placeholder="소속 대학"
                        value={affiliation.department || ''}
                        onChange={(e) =>
                          updateAffiliation(index, 'department', e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}

                {affiliation.type === 'company' && (
                  <div className="space-y-2">
                    <Label>부서 (선택)</Label>
                    <Input
                      placeholder="소속 부서"
                      value={affiliation.department || ''}
                      onChange={(e) =>
                        updateAffiliation(index, 'department', e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={addAffiliation}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            소속 추가
          </Button>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              이전
            </Button>
            <Button 
              onClick={handleFinalSubmit} 
              className="flex-1"
              disabled={loading}
            >
              {loading ? '저장 중...' : '완료'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}