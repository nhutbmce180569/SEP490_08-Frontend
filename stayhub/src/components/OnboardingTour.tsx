import React, { useEffect, useRef, useContext } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import axiosClient from '../utils/axiosClient';
import { AuthContext } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LocaleContext';

const OnboardingTour: React.FC = () => {
    const { user, updateUser } = useContext(AuthContext);
    const { t } = useTranslation();
    const hasStarted = useRef(false);

    useEffect(() => {
        if (!user || user.hasCompletedTour || hasStarted.current) return;

        hasStarted.current = true;

        const driverObj = driver({
            showProgress: true,
            allowClose: true,
            doneBtnText: t('common.confirm', { defaultValue: 'Bắt đầu ngay' }),
            closeBtnText: t('common.cancel', { defaultValue: 'Bỏ qua' }),
            nextBtnText: t('common.next', { defaultValue: 'Tiếp theo' }),
            prevBtnText: t('common.prev', { defaultValue: 'Quay lại' }),
            steps: [
                {
                    popover: {
                        title: t('onboarding.step1Title'),
                        description: t('onboarding.step1Desc'),
                        side: 'top',
                        align: 'center'
                    }
                },
                {
                    element: '#tour-ai-guide',
                    popover: {
                        title: t('onboarding.step3Title'),
                        description: t('onboarding.step3Desc'),
                        side: 'bottom',
                        align: 'end'
                    }
                },
                {
                    element: '#tour-moments',
                    popover: {
                        title: t('onboarding.stepMomentsTitle'),
                        description: t('onboarding.stepMomentsDesc'),
                        side: 'bottom',
                        align: 'center'
                    }
                },
                {
                    element: '#tour-friends',
                    popover: {
                        title: t('onboarding.stepFriendsTitle'),
                        description: t('onboarding.stepFriendsDesc'),
                        side: 'bottom',
                        align: 'center'
                    }
                },
                {
                    element: '#tour-notifications',
                    popover: {
                        title: t('onboarding.stepNotificationsTitle'),
                        description: t('onboarding.stepNotificationsDesc'),
                        side: 'bottom',
                        align: 'end'
                    }
                },
                {
                    element: '#tour-wishlist',
                    popover: {
                        title: t('onboarding.stepWishlistTitle'),
                        description: t('onboarding.stepWishlistDesc'),
                        side: 'bottom',
                        align: 'end'
                    }
                },
                {
                    element: '#tour-language-currency',
                    popover: {
                        title: t('onboarding.stepLangCurrTitle'),
                        description: t('onboarding.stepLangCurrDesc'),
                        side: 'bottom',
                        align: 'end'
                    }
                },
                {
                    element: '#tour-profile',
                    popover: {
                        title: t('onboarding.step6Title'),
                        description: t('onboarding.step6Desc'),
                        side: 'bottom',
                        align: 'end'
                    }
                },
                {
                    element: '#tour-search-box',
                    popover: {
                        title: t('onboarding.step2Title'),
                        description: t('onboarding.step2Desc'),
                        side: 'top',
                        align: 'start'
                    }
                },
                {
                    element: '#tour-chat',
                    popover: {
                        title: t('onboarding.step4Title'),
                        description: t('onboarding.step4Desc'),
                        side: 'left',
                        align: 'center'
                    }
                },
                {
                    element: '#tour-support',
                    popover: {
                        title: t('onboarding.step5Title'),
                        description: t('onboarding.step5Desc'),
                        side: 'left',
                        align: 'end'
                    }
                }
            ],
            onDestroyed: async () => {
                // Đã tắt hoặc hoàn thành tour
                try {
                    await axiosClient.put('/Auth/complete-tour');
                    updateUser({ hasCompletedTour: true });
                } catch (error) {
                    console.error('Failed to complete tour', error);
                }
            }
        });

        // Đợi DOM render xong rồi mới kích hoạt
        setTimeout(() => {
            driverObj.drive();
        }, 1000);

    }, [user, updateUser]);

    return null; // Component này chỉ chạy ngầm, không render UI
};

export default OnboardingTour;
