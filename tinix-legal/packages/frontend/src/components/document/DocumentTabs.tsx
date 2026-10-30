'use client';

import React, { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch } from 'lucide-react';

interface DocumentTabsProps {
  contentTab: React.ReactNode;
  relationshipsTab: React.ReactNode;
  originalTab: React.ReactNode;
  lineageTab?: React.ReactNode;
}

export function DocumentTabs({ contentTab, relationshipsTab, originalTab, lineageTab }: DocumentTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentTab = searchParams.get('tab') || 'content';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <Tabs 
      value={currentTab} 
      onValueChange={handleTabChange} 
      className="w-full"
    >
      <TabsList variant="line" className="mb-6 flex-wrap">
        <TabsTrigger value="content" className="text-sm font-medium">
          Nội dung văn bản
        </TabsTrigger>
        <TabsTrigger value="lineage" className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
          Cây phả hệ Hiệu lực
        </TabsTrigger>
        <TabsTrigger value="relationships" className="text-sm font-medium">
          Lược đồ liên kết
        </TabsTrigger>
        <TabsTrigger value="original" className="text-sm font-medium text-blue-600 data-[state=active]:text-blue-700">
          Đồ thị mối quan hệ
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="content" className={isPending ? "opacity-70 transition-opacity" : ""}>
        {contentTab}
      </TabsContent>

      <TabsContent value="lineage" className={isPending ? "opacity-70 transition-opacity" : ""}>
        {lineageTab}
      </TabsContent>
      
      <TabsContent value="relationships" className={isPending ? "opacity-70 transition-opacity" : ""}>
        {relationshipsTab}
      </TabsContent>
      
      <TabsContent value="original" className={isPending ? "opacity-70 transition-opacity" : ""}>
        {originalTab}
      </TabsContent>
    </Tabs>
  );
}

