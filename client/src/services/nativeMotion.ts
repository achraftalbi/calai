import { Capacitor } from '@capacitor/core';

interface StepData {
  steps: number;
  timestamp: number;
}

interface ActivityData {
  type: 'walking' | 'running' | 'idle';
  confidence: number;
  timestamp: number;
}

interface NativeMotionCallbacks {
  onStepUpdate: (data: StepData) => void;
  onActivityUpdate: (data: ActivityData) => void;
}

export class NativeMotionTracker {
  private isTracking = false;
  private callbacks: NativeMotionCallbacks[] = [];
  private stepCount = 0;
  private currentActivity: 'idle' | 'walking' | 'running' = 'idle';

  constructor() {
    this.setupNativeListeners();
  }

  private setupNativeListeners(): void {
    if (!Capacitor.isNativePlatform()) return;

    // Listen for native step counter events
    window.addEventListener('nativeStepUpdate', (event: any) => {
      const stepData: StepData = event.detail;
      this.stepCount = stepData.steps;
      this.notifyStepUpdate(stepData);
    });

    // Listen for native activity recognition events
    window.addEventListener('nativeActivityUpdate', (event: any) => {
      const activityData: ActivityData = event.detail;
      this.currentActivity = activityData.type;
      this.notifyActivityUpdate(activityData);
    });
  }

  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('NativeMotion: Not on native platform, skipping permission request');
      return false;
    }

    try {
      // Call native permission request
      const result = await (window as any).StepTracker?.requestPermission?.();
      console.log('NativeMotion: Permission result:', result);
      return result?.granted === true;
    } catch (error) {
      console.error('NativeMotion: Permission request failed:', error);
      return false;
    }
  }

  async startTracking(): Promise<boolean> {
    if (this.isTracking) return true;

    if (!Capacitor.isNativePlatform()) {
      console.log('NativeMotion: Not on native platform');
      return false;
    }

    try {
      const success = await (window as any).StepTracker?.start?.();
      if (success) {
        this.isTracking = true;
        console.log('NativeMotion: Native tracking started');
      }
      return success === true;
    } catch (error) {
      console.error('NativeMotion: Failed to start tracking:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    if (!this.isTracking) return;

    if (Capacitor.isNativePlatform()) {
      try {
        await (window as any).StepTracker?.stop?.();
        console.log('NativeMotion: Native tracking stopped');
      } catch (error) {
        console.error('NativeMotion: Failed to stop tracking:', error);
      }
    }

    this.isTracking = false;
    this.stepCount = 0;
    this.currentActivity = 'idle';
  }

  addListener(callbacks: NativeMotionCallbacks): void {
    this.callbacks.push(callbacks);
  }

  removeListener(callbacks: NativeMotionCallbacks): void {
    const index = this.callbacks.indexOf(callbacks);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  private notifyStepUpdate(data: StepData): void {
    this.callbacks.forEach(callback => callback.onStepUpdate(data));
  }

  private notifyActivityUpdate(data: ActivityData): void {
    this.callbacks.forEach(callback => callback.onActivityUpdate(data));
  }

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  getStepCount(): number {
    return this.stepCount;
  }

  getCurrentActivity(): 'idle' | 'walking' | 'running' {
    return this.currentActivity;
  }

  getTrackingStatus(): boolean {
    return this.isTracking;
  }
}

export const nativeMotionTracker = new NativeMotionTracker();