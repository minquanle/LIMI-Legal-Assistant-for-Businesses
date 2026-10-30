'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X } from 'lucide-react';
import { RedlineSuggestion } from './extensions/AutoRedline';

interface FloatingSuggestionCardProps {
  suggestion: RedlineSuggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  position: { top: number; left: number } | null;
}

export function FloatingSuggestionCard({ suggestion, onAccept, onReject, position }: FloatingSuggestionCardProps) {
  if (!position) return null;

  return (
    <div 
      className="absolute z-50 w-80 shadow-xl animate-in fade-in zoom-in-95 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <Card className="border-red-200 shadow-red-100/50">
        <CardHeader className="bg-red-50/50 pb-3 pt-4 px-4 rounded-t-lg">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-700">
            <Sparkles className="h-4 w-4" />
            AI Suggestion
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-3 space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase">Lỗi Logic / Mâu Thuẫn</p>
            <p className="text-sm text-slate-700">{suggestion.reason}</p>
          </div>
          
          <div className="bg-slate-50 rounded-md p-2 border border-slate-100 space-y-2">
            <div className="text-sm line-through text-red-400 decoration-red-300">
              {suggestion.originalText}
            </div>
            <div className="text-sm font-medium text-green-700 flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5 text-green-500">+</span>
              {suggestion.suggestedText}
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-4 py-3 bg-slate-50 border-t border-slate-100 rounded-b-lg flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onReject(suggestion.id)} className="h-8">
            <X className="h-4 w-4 mr-1" />
            Bỏ qua
          </Button>
          <Button variant="default" size="sm" onClick={() => onAccept(suggestion.id)} className="h-8 bg-red-600 hover:bg-red-700 text-white">
            <Check className="h-4 w-4 mr-1" />
            Chấp nhận sửa
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
