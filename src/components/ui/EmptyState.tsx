import React from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-dashed border-[#E5E7EB] rounded-xl my-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FAFAFA] text-[#6B7280] mb-4 border border-[#E5E7EB]">
        {icon || <FolderOpen className="w-6 h-6 text-[#9CA3AF]" />}
      </div>
      <h3 className="text-base font-semibold text-[#111827] mb-1">{title}</h3>
      <p className="text-xs text-[#6B7280] max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
