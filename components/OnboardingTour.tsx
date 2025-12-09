import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Camera, Globe, Image, Play, Cloud, Sparkles } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightArea?: 'camera' | 'destinations' | 'media' | 'golive' | 'cloudvm' | 'ai';
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to StreamHub Pro!',
    description: 'Your professional browser-based streaming studio. Let\'s take a quick tour to get you started.',
    icon: <Sparkles className="text-brand-400" size={32} />,
  },
  {
    id: 'camera',
    title: 'Enable Your Camera',
    description: 'Click the camera button to start capturing video. You can also share your screen for presentations or gaming.',
    icon: <Camera className="text-green-400" size={32} />,
    highlightArea: 'camera',
  },
  {
    id: 'destinations',
    title: 'Add Streaming Destinations',
    description: 'Connect to YouTube, Facebook, Twitch, or any custom RTMP server. Stream to multiple platforms simultaneously!',
    icon: <Globe className="text-blue-400" size={32} />,
    highlightArea: 'destinations',
  },
  {
    id: 'media',
    title: 'Import Media Assets',
    description: 'Upload images, videos, and audio. Import directly from Google Drive, Dropbox, and more using Cloud Import.',
    icon: <Image className="text-purple-400" size={32} />,
    highlightArea: 'media',
  },
  {
    id: 'cloudvm',
    title: 'Cloud VM Streaming',
    description: 'Use Cloud VM mode to stream directly from our servers - saving your bandwidth and ensuring stable broadcasts.',
    icon: <Cloud className="text-emerald-400" size={32} />,
    highlightArea: 'cloudvm',
  },
  {
    id: 'golive',
    title: 'Go Live!',
    description: 'When you\'re ready, hit the "GO LIVE" button to broadcast to all your enabled destinations. Happy streaming!',
    icon: <Play className="text-red-400" size={32} />,
    highlightArea: 'golive',
  },
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Position the tooltip based on what area we're highlighting
  const getTooltipPosition = () => {
    switch (step.highlightArea) {
      case 'camera':
        return 'bottom-32 left-1/2 -translate-x-1/2';
      case 'destinations':
        return 'top-1/2 left-80 -translate-y-1/2';
      case 'media':
        return 'top-1/2 right-80 -translate-y-1/2';
      case 'golive':
        return 'bottom-32 right-48';
      case 'cloudvm':
        return 'bottom-32 right-64';
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop with spotlight effect */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleSkip} />

      {/* Spotlight highlights (visual cue for what to look at) */}
      {step.highlightArea === 'camera' && (
        <div className="absolute bottom-24 left-8 w-40 h-16 border-2 border-brand-400 rounded-lg animate-pulse pointer-events-none" />
      )}
      {step.highlightArea === 'destinations' && (
        <div className="absolute top-20 left-0 w-80 h-96 border-2 border-brand-400 rounded-lg animate-pulse pointer-events-none" />
      )}
      {step.highlightArea === 'media' && (
        <div className="absolute top-20 right-0 w-80 h-96 border-2 border-brand-400 rounded-lg animate-pulse pointer-events-none" />
      )}
      {step.highlightArea === 'golive' && (
        <div className="absolute bottom-24 right-8 w-36 h-14 border-2 border-red-400 rounded-lg animate-pulse pointer-events-none" />
      )}
      {step.highlightArea === 'cloudvm' && (
        <div className="absolute bottom-24 right-48 w-48 h-14 border-2 border-green-400 rounded-lg animate-pulse pointer-events-none" />
      )}

      {/* Tooltip Card */}
      <div className={`absolute ${getTooltipPosition()} w-full max-w-md mx-4`}>
        <div className="bg-dark-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-900 to-purple-900 p-6 relative">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-dark-800/50 rounded-xl flex items-center justify-center">
                {step.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{step.title}</h2>
                <div className="text-sm text-gray-300 mt-1">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-300 leading-relaxed">{step.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 pb-4">
            {ONBOARDING_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-brand-500 w-6'
                    : index < currentStep
                    ? 'bg-brand-700'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-4 bg-dark-900 border-t border-gray-800">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg transition-all"
              >
                {isLastStep ? 'Get Started' : 'Next'}
                {!isLastStep && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
