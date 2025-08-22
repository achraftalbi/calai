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
  private baselineAcceleration = 0;
  private recentPeaks: number[] = [];
  private lastStepCandidateTime = 0;

  // Calibration constants - more conservative to reduce false positives
  private readonly STEP_THRESHOLD = 2.5;  // Higher threshold for step detection
  private readonly STEP_TIMEOUT = 2000;   // Max time between steps (ms)
  private readonly MIN_STEP_INTERVAL = 300; // Minimum 300ms between steps (realistic walking pace)
  private readonly MAX_STEP_INTERVAL = 1500; // Maximum 1.5s between steps
  private readonly WALKING_CADENCE = 80;  // Minimum steps per minute for walking
  private readonly RUNNING_CADENCE = 140; // Minimum steps per minute for running
  private readonly ACTIVITY_MIN_DURATION = 2 * 60 * 1000; // 2 minutes minimum activity
  private readonly BASELINE_GRAVITY = 9.8; // Earth's gravity for baseline comparison

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
    
    // Reset all tracking state
    this.stepCount = 0;
    this.motionHistory = [];
    this.recentPeaks = [];
    this.currentActivity = 'idle';
    this.activityStartTime = null;
    this.baselineAcceleration = 0;
    
    console.log('Device motion tracking stopped and reset');
  }

  private handleMotion(event: DeviceMotionEvent): void {
    if (!event.accelerationIncludingGravity) return;

    const { x, y, z } = event.accelerationIncludingGravity;
    if (x === null || y === null || z === null) return;

    // Calculate total acceleration magnitude
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    const timestamp = Date.now();

    // Initialize baseline if needed (first 50 readings)
    if (this.motionHistory.length < 50) {
      this.baselineAcceleration = (this.baselineAcceleration * this.motionHistory.length + acceleration) / (this.motionHistory.length + 1);
    }

    // Store motion data
    this.motionHistory.push({ acceleration, timestamp });

    // Keep only last 10 seconds of data for better pattern analysis
    const tenSecondsAgo = timestamp - 10000;
    this.motionHistory = this.motionHistory.filter(m => m.timestamp > tenSecondsAgo);

    // Only start detecting steps after we have a baseline
    if (this.motionHistory.length >= 50) {
      this.detectStep(acceleration, timestamp);
    }
  }

  private detectStep(acceleration: number, timestamp: number): void {
    // More sophisticated step detection with noise filtering
    const deviationFromBaseline = Math.abs(acceleration - this.baselineAcceleration);
    
    // Check if this could be a step (significant deviation from baseline)
    if (deviationFromBaseline > this.STEP_THRESHOLD && 
        timestamp - this.lastStepCandidateTime > this.MIN_STEP_INTERVAL) {
      
      // Look for step pattern: need consistent rhythm
      this.recentPeaks.push(timestamp);
      
      // Keep only last 6 peaks (about 3-6 seconds of walking)
      if (this.recentPeaks.length > 6) {
        this.recentPeaks.shift();
      }
      
      // Validate this is a real step by checking rhythm consistency
      if (this.validateStepPattern(timestamp)) {
        this.stepCount++;
        this.lastStepTime = timestamp;
        this.lastStepCandidateTime = timestamp;

        // Detect activity type based on step cadence
        this.detectActivityType();

        // Notify listeners
        this.notifyListeners();
      }
    }
  }

  private validateStepPattern(currentTime: number): boolean {
    if (this.recentPeaks.length < 3) return false; // Need at least 3 peaks to validate pattern
    
    // Calculate intervals between recent peaks
    const intervals: number[] = [];
    for (let i = 1; i < this.recentPeaks.length; i++) {
      intervals.push(this.recentPeaks[i] - this.recentPeaks[i-1]);
    }
    
    // Check if intervals are within reasonable walking/running range
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const validInterval = avgInterval >= this.MIN_STEP_INTERVAL && avgInterval <= this.MAX_STEP_INTERVAL;
    
    // Check for rhythm consistency (intervals shouldn't vary too wildly)
    const maxVariation = Math.max(...intervals) - Math.min(...intervals);
    const consistentRhythm = maxVariation < 400; // Allow 400ms variation in step timing
    
    // Additional check: make sure we have enough recent motion (not just sitting and tapping phone)
    const recentMotion = this.motionHistory.slice(-20); // Last 2 seconds
    const motionVariability = this.calculateMotionVariability(recentMotion);
    const hasMotion = motionVariability > 0.5; // Some threshold for actual movement
    
    return validInterval && consistentRhythm && hasMotion;
  }

  private calculateMotionVariability(motionData: MotionSensor[]): number {
    if (motionData.length < 5) return 0;
    
    const accelerations = motionData.map(m => m.acceleration);
    const avg = accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
    const variance = accelerations.reduce((sum, acc) => sum + Math.pow(acc - avg, 2), 0) / accelerations.length;
    
    return Math.sqrt(variance); // Standard deviation
  }

  private detectActivityType(): void {
    if (this.recentPeaks.length < 3) return;

    // Calculate steps per minute from actual detected steps (not raw motion data)
    const oneMinuteAgo = Date.now() - 60000;
    const recentStepTimes = this.recentPeaks.filter(time => time > oneMinuteAgo);
    const stepsPerMinute = recentStepTimes.length;

    let newActivity: 'idle' | 'walking' | 'running' = 'idle';

    // More conservative thresholds based on actual step detection
    if (stepsPerMinute >= this.RUNNING_CADENCE) {
      newActivity = 'running';
    } else if (stepsPerMinute >= this.WALKING_CADENCE) {
      newActivity = 'walking';
    }

    // Additional validation: make sure we have sustained activity
    const lastTenSeconds = Date.now() - 10000;
    const recentSteps = this.recentPeaks.filter(time => time > lastTenSeconds);
    
    // If no steps in last 10 seconds, mark as idle
    if (recentSteps.length === 0) {
      newActivity = 'idle';
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