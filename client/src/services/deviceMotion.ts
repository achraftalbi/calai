/**
 * Device Motion Service
 * Provides step counting and activity detection using device sensors
 * Works without requiring Google Fit or external app setup
 */

interface DeviceMotionData {
  steps: number;
  isWalking: boolean;
  isRunning: boolean;
  lastActivity: Date | null;
}

interface MotionSensor {
  acceleration: number;
  timestamp: number;
}

class DeviceMotionService {
  private isTracking = false;
  private stepCount = 0;
  private lastStepTime = 0;
  private motionHistory: MotionSensor[] = [];
  private listeners: ((data: DeviceMotionData) => void)[] = [];
  private lastNotificationTime = 0;
  private currentActivity: 'idle' | 'walking' | 'running' = 'idle';
  private activityStartTime: Date | null = null;

  // Calibration constants
  private readonly STEP_THRESHOLD = 1.2;  // Acceleration threshold for step detection
  private readonly STEP_TIMEOUT = 2000;   // Max time between steps (ms)
  private readonly WALKING_CADENCE = 100; // Steps per minute for walking
  private readonly RUNNING_CADENCE = 160; // Steps per minute for running
  private readonly ACTIVITY_MIN_DURATION = 2 * 60 * 1000; // 2 minutes minimum activity

  constructor() {
    this.checkPermissions();
  }

  private async checkPermissions(): Promise<boolean> {
    if (!('DeviceMotionEvent' in window)) {
      console.warn('Device motion not supported');
      return false;
    }

    // For iOS 13+ devices, request permission
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.warn('Device motion permission denied:', error);
        return false;
      }
    }

    return true;
  }

  async startTracking(): Promise<boolean> {
    if (this.isTracking) return true;

    const hasPermission = await this.checkPermissions();
    if (!hasPermission) return false;

    this.isTracking = true;
    this.stepCount = 0;
    this.motionHistory = [];
    this.currentActivity = 'idle';

    window.addEventListener('devicemotion', this.handleMotion.bind(this), { passive: true });

    // Start background processing
    this.processMotionData();

    console.log('Device motion tracking started');
    return true;
  }

  stopTracking(): void {
    if (!this.isTracking) return;

    this.isTracking = false;
    window.removeEventListener('devicemotion', this.handleMotion.bind(this));
    
    console.log('Device motion tracking stopped');
  }

  private handleMotion(event: DeviceMotionEvent): void {
    if (!event.accelerationIncludingGravity) return;

    const { x, y, z } = event.accelerationIncludingGravity;
    if (x === null || y === null || z === null) return;

    // Calculate total acceleration magnitude
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    const timestamp = Date.now();

    // Store motion data
    this.motionHistory.push({ acceleration, timestamp });

    // Keep only last 5 seconds of data
    const fiveSecondsAgo = timestamp - 5000;
    this.motionHistory = this.motionHistory.filter(m => m.timestamp > fiveSecondsAgo);

    // Detect steps
    this.detectStep(acceleration, timestamp);
  }

  private detectStep(acceleration: number, timestamp: number): void {
    // Simple step detection algorithm
    if (acceleration > this.STEP_THRESHOLD && 
        timestamp - this.lastStepTime > 200) { // Minimum 200ms between steps
      
      this.stepCount++;
      this.lastStepTime = timestamp;

      // Detect activity type based on step cadence
      this.detectActivityType();

      // Notify listeners
      this.notifyListeners();
    }
  }

  private detectActivityType(): void {
    if (this.motionHistory.length < 10) return;

    // Calculate steps per minute from recent motion
    const oneMinuteAgo = Date.now() - 60000;
    const recentSteps = this.motionHistory.filter(m => m.timestamp > oneMinuteAgo).length;

    let newActivity: 'idle' | 'walking' | 'running' = 'idle';

    if (recentSteps >= this.RUNNING_CADENCE / 6) { // Running pace
      newActivity = 'running';
    } else if (recentSteps >= this.WALKING_CADENCE / 6) { // Walking pace
      newActivity = 'walking';
    }

    // Activity state change detection
    if (newActivity !== this.currentActivity) {
      if (newActivity !== 'idle') {
        this.activityStartTime = new Date();
        this.sendActivityNotification(newActivity);
      } else if (this.currentActivity !== 'idle' && this.activityStartTime) {
        // Activity ended - check if it was long enough to log
        const duration = Date.now() - this.activityStartTime.getTime();
        if (duration >= this.ACTIVITY_MIN_DURATION) {
          this.logActivity(this.currentActivity, this.activityStartTime, new Date(), Math.floor(duration / 1000 / 60));
        }
      }
      
      this.currentActivity = newActivity;
    }
  }

  private sendActivityNotification(activity: 'walking' | 'running'): void {
    const now = Date.now();
    
    // Throttle notifications - only send once per 5 minutes
    if (now - this.lastNotificationTime < 5 * 60 * 1000) return;
    
    this.lastNotificationTime = now;

    // Send browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      const activityName = activity === 'walking' ? 'Walking' : 'Running';
      new Notification(`CalAI: ${activityName} Detected!`, {
        body: `Started tracking your ${activity} activity. Keep it up!`,
        icon: '/icon-192.png',
        tag: 'calai-activity',
        silent: false
      });
    }
  }

  private async logActivity(
    activity: 'walking' | 'running', 
    startTime: Date, 
    endTime: Date, 
    durationMinutes: number
  ): Promise<void> {
    try {
      // Calculate estimated calories based on activity and duration
      const activityType = activity === 'walking' ? 'walk' : 'run';
      
      const response = await fetch('/api/device-motion/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activityType,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          duration: durationMinutes,
          steps: this.stepCount,
          source: 'device_motion'
        })
      });

      if (response.ok) {
        console.log(`Logged ${activity} activity: ${durationMinutes} minutes`);
        
        // Send success notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const activityName = activity === 'walking' ? 'walk' : 'run';
          new Notification(`CalAI: ${activityName.charAt(0).toUpperCase() + activityName.slice(1)} Logged!`, {
            body: `${durationMinutes} minutes of ${activity} has been added to your activity log.`,
            icon: '/icon-192.png',
            tag: 'calai-activity-logged'
          });
        }
      }
    } catch (error) {
      console.error('Failed to log device motion activity:', error);
    }
  }

  private notifyListeners(): void {
    const data: DeviceMotionData = {
      steps: this.stepCount,
      isWalking: this.currentActivity === 'walking',
      isRunning: this.currentActivity === 'running',
      lastActivity: this.activityStartTime
    };

    this.listeners.forEach(listener => listener(data));
  }

  private processMotionData(): void {
    if (!this.isTracking) return;

    // Process motion data every second
    setTimeout(() => {
      if (this.isTracking) {
        this.processMotionData();
      }
    }, 1000);
  }

  addListener(callback: (data: DeviceMotionData) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (data: DeviceMotionData) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  getCurrentData(): DeviceMotionData {
    return {
      steps: this.stepCount,
      isWalking: this.currentActivity === 'walking',
      isRunning: this.currentActivity === 'running',
      lastActivity: this.activityStartTime
    };
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') return true;

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  isSupported(): boolean {
    return 'DeviceMotionEvent' in window;
  }
}

export const deviceMotionService = new DeviceMotionService();