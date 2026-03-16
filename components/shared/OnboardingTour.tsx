"use client";

import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface OnboardingTourProps {
    userRole: string;
    isFirstLogin: boolean;
    onComplete: () => void;
}

export const OnboardingTour = ({ userRole, isFirstLogin, onComplete }: OnboardingTourProps) => {
    const [run, setRun] = useState(false);

    const steps: Step[] = [
        {
            target: 'body',
            placement: 'center',
            content: (
                <div className="text-left p-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Welcome to FoodBridge AI! 🍛</h3>
                    <p className="text-slate-600 dark:text-slate-300">Let's take a quick 1-minute tour to help you get started with saving food and lives.</p>
                </div>
            ),
            disableBeacon: true,
        },
        ...(userRole === 'donor' ? [
            {
                target: '#tour-post-donation',
                content: 'Click here to post new food donations. Simply snap a photo, and our AI will verify the quality!',
                placement: 'bottom' as const,
            },
            {
                target: '#tour-my-donations',
                content: 'Track all your active and past donations here. See when an NGO accepts your food!',
                placement: 'bottom' as const,
            }
        ] : [
            {
                target: '#tour-nearby-map',
                content: 'View real-time food donations on the map. Green markers show fresh food available near you!',
                placement: 'top' as const,
            },
            {
                target: '#tour-available-list',
                content: 'Browse all available donations in a list format and filter by food type or quantity.',
                placement: 'bottom' as const,
            }
        ]),
        {
            target: '#tour-notifications',
            content: 'Any updates about your donations or nearby alerts will appear here in real-time.',
            placement: 'bottom' as const,
        },
        {
            target: '#tour-profile',
            content: 'Manage your personal details and location settings here.',
            placement: 'bottom' as const,
        }
    ];

    useEffect(() => {
        if (isFirstLogin) {
            setRun(true);
        }
    }, [isFirstLogin]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
            setRun(false);
            onComplete();
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            scrollToFirstStep
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#4F46E5',
                    zIndex: 1000,
                },
                tooltipContainer: {
                    textAlign: 'left' as const,
                    borderRadius: '16px',
                    padding: '12px',
                },
                buttonNext: {
                    borderRadius: '8px',
                    padding: '10px 20px',
                },
                buttonBack: {
                    marginRight: 10,
                }
            }}
        />
    );
};
