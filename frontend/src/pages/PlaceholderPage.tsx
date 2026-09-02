/**
 * PlaceholderPage — Generic placeholder for workflow pages not yet implemented in Sprint 1.
 *
 * Future sprints will replace this component with the actual page for each route.
 * The component shows which step is current in the workflow so the progress
 * indicator is always accurate even on placeholder pages.
 */

import { Link } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import ProgressStepper from '../components/ProgressStepper';
import { buildStepStatuses } from '../utils/workflowSteps';
import { ROUTES } from '../utils/routes';

interface PlaceholderPageProps {
  stepIndex: number;
  pageTitle: string;
  sprintNote: string;
}

export default function PlaceholderPage({ stepIndex, pageTitle, sprintNote }: PlaceholderPageProps) {
  const steps = buildStepStatuses(stepIndex);

  return (
    <PageContainer narrow>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-siet-navy mb-1">{pageTitle}</h1>
        <p className="text-siet-slate text-sm">
          This page is a placeholder. It will be implemented in a future sprint.
        </p>
      </div>

      <ProgressStepper steps={steps} className="mb-8" />

      <div className="surface-card p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-siet-silver flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-siet-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-siet-navy">{pageTitle}</h2>
          <p className="text-sm text-siet-slate mt-1 max-w-sm mx-auto">
            {sprintNote}
          </p>
        </div>
        <Link to={ROUTES.HOME} className="btn-secondary inline-flex">
          Return to Home
        </Link>
      </div>
    </PageContainer>
  );
}
