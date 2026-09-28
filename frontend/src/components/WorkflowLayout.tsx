import type { ReactNode } from 'react';
import PageContainer from './PageContainer';
import ProgressStepper from './ProgressStepper';
import { buildStepStatuses } from '../utils/workflowSteps';

interface WorkflowLayoutProps {
  stepIndex: number;
  title: string;
  description: string;
  children: ReactNode;
  narrowContent?: boolean;
}

export default function WorkflowLayout({
  stepIndex,
  title,
  description,
  children,
  narrowContent = false,
}: WorkflowLayoutProps) {
  const steps = buildStepStatuses(stepIndex);

  return (
    <PageContainer>
      <div className="w-full max-w-5xl mx-auto">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-siet-navy mb-1">{title}</h1>
          <p className="text-siet-slate text-sm">{description}</p>
        </div>

        {/* Consistent Progress Indicator */}
        <div className="w-full mb-8">
          <ProgressStepper steps={steps} />
        </div>

        {/* Page Content */}
        <div className={narrowContent ? "max-w-2xl mx-auto w-full" : "w-full"}>
          {children}
        </div>
      </div>
    </PageContainer>
  );
}
