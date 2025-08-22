import { Capacitor } from '@capacitor/core';
import { nativeMotionTracker } from './nativeMotion';
import { DeviceMotionTracker } from './deviceMotion';

interface MotionCallbacks {
  onStepUpdate: (steps: number) => void;
  onActivityUpdate: (activity: 'idle' | 'walking' | 'running') => void;
}

export class HybridMotionTracker {
  private isTracking = false;
  private callbacks: MotionCallbacks[] = [];
  private currentSteps = 0;
  private currentActivity: 'idle' | 'walking' | 'running' = 'idle';
  private deviceMotionTracker = new DeviceMotionTracker();

  constructor() {
    this.setupTrackers();
  }

  private setupTrackers(): void {
    // Setup native motion tracker callbacks
    nativeMotionTracker.addListener({
      onStepUpdate: (data) => {
        this.currentSteps = data.steps;
        this.notifyStepUpdate(data.steps);
      },
      onActivityUpdate: (data) => {
        this.currentActivity = data.type;
        this.notifyActivityUpdate(data.type);
      }
    });

    // Setup web motion tracker callbacks
    this.deviceMotionTracker.addListener({
      onStepUpdate: (steps: number) => {
        // Only use web tracker if native is not available
        if (!Capacitor.isNativePlatform()) {
          this.currentSteps = steps;
          this.notifyStepUpdate(steps);
        }
      },
      onActivityUpdate: (activity: 'idle' | 'walking' | 'running') => {
        // Only use web tracker if native is not available
        if (!Capacitor.isNativePlatform()) {
          this.currentActivity = activity;
          this.notifyActivityUpdate(activity);
        }
      }
    });
  }

  async requestPermissions(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      return await nativeMotionTracker.requestPermissions();
    } else {
      // Web doesn't need explicit permissions for DeviceMotion
      return true;
    }
  }

  async startTracking(): Promise<boolean> {
    if (this.isTracking) return true;

    let success = false;

    if (Capacitor.isNativePlatform()) {
      console.log('HybridMotion: Starting native tracking');
      success = await nativeMotionTracker.startTracking();
    } else {
      console.log('HybridMotion: Starting web tracking');
      success = await this.deviceMotionTracker.startTracking();
    }

    if (success) {
      this.isTracking = true;
      console.log(`HybridMotion: Tracking started (${Capacitor.isNativePlatform() ? 'native' : 'web'} mode)`);
    }

    return success;
  }

  async stopTracking(): Promise<void> {
    if (!this.isTracking) return;

    if (Capacitor.isNativePlatform()) {
      await nativeMotionTracker.stopTracking();
    } else {
      this.deviceMotionTracker.stopTracking();
    }

    this.isTracking = false;
    this.currentSteps = 0;
    this.currentActivity = 'idle';
    console.log('HybridMotion: Tracking stopped');
  }

  addListener(callbacks: MotionCallbacks): void {
    this.callbacks.push(callbacks);
  }

  removeListener(callbacks: MotionCallbacks): void {
    const index = this.callbacks.indexOf(callbacks);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  private notifyStepUpdate(steps: number): void {
    this.callbacks.forEach(callback => callback.onStepUpdate(steps));
  }

  private notifyActivityUpdate(activity: 'idle' | 'walking' | 'running'): void {
    this.callbacks.forEach(callback => callback.onActivityUpdate(activity));
  }

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  getStepCount(): number {
    return this.currentSteps;
  }

  getCurrentActivity(): 'idle' | 'walking' | 'running' {
    return this.currentActivity;
  }

  getTrackingStatus(): boolean {
    return this.isTracking;
  }

  getPlatformInfo(): string {
    return Capacitor.isNativePlatform() ? 'Native Android' : 'Web Browser';
  }
}

export const hybridMotionTracker = new HybridMotionTracker();