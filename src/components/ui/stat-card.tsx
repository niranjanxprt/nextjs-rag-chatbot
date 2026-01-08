/**
 * Stat Card Component
 * Displays statistics with optional trend indicator
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  trend?: {
    value: number
    direction: 'up' | 'down'
    period?: string
  }
  icon?: React.ReactNode
  className?: string
  valueClassName?: string
}

export function StatCard({
  label,
  value,
  trend,
  icon,
  className,
  valueClassName,
}: StatCardProps) {
  const isTrendPositive = trend?.direction === 'up'

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div
            className={`text-2xl font-bold ${
              valueClassName || 'text-foreground'
            }`}
          >
            {value}
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              {isTrendPositive ? (
                <>
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    +{trend.value}% {trend.period || 'from last period'}
                  </span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">
                    -{trend.value}% {trend.period || 'from last period'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
