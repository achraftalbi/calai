/**
 * Device Motion Service - VERSION CORRIGÉE
 * Provides accurate step counting and activity detection using device sensors
 * Résout le problème de sensibilité excessive (1 → 36 pas)
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
  private currentActivity: "idle" | "walking" | "running" = "idle";
  private activityStartTime: Date | null = null;
  private baselineAcceleration = 0;
  private recentPeaks: number[] = [];
  private lastStepCandidateTime = 0;
  private calibrationCount = 0;
  private isCalibrated = false;

  // CONSTANTES CORRIGÉES - Beaucoup moins sensibles
  private readonly STEP_THRESHOLD = 2.8; // 🔧 AUGMENTÉ : Plus restrictif pour éviter les faux pas
  private readonly STEP_TIMEOUT = 2000;
  private readonly MIN_STEP_INTERVAL = 400; // 🔧 AUGMENTÉ : 400ms minimum entre pas (évite double-comptage)
  private readonly MAX_STEP_INTERVAL = 2000;
  private readonly WALKING_CADENCE = 80; // 🔧 AUGMENTÉ : Cadence plus réaliste
  private readonly RUNNING_CADENCE = 140;
  private readonly ACTIVITY_MIN_DURATION = 2 * 60 * 1000;
  private readonly BASELINE_GRAVITY = 9.8;
  private readonly CALIBRATION_SAMPLES = 50; // 🔧 NOUVEAU : Plus d'échantillons pour calibrage
  private readonly MOTION_STABILITY_THRESHOLD = 0.8; // 🔧 NOUVEAU : Seuil de stabilité motion
  private readonly STEP_PATTERN_VALIDATION = 3; // 🔧 NOUVEAU : Validation sur 3 pas consécutifs

  constructor() {
    this.checkPermissions();
  }

  private async checkPermissions(): Promise<boolean> {
    if (!("DeviceMotionEvent" in window)) {
      console.warn("Device motion not supported");
      return false;
    }

    // For iOS 13+ devices, request permission
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === "granted";
      } catch (error) {
        console.warn("Device motion permission denied:", error);
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
    this.recentPeaks = [];
    this.currentActivity = "idle";
    this.calibrationCount = 0;
    this.isCalibrated = false;
    this.baselineAcceleration = 0;
    this.lastStepCandidateTime = 0;

    window.addEventListener("devicemotion", this.handleMotion.bind(this), {
      passive: true,
    });

    // Start background processing
    this.processMotionData();

    console.log("🔧 DeviceMotion: Tracking started with improved sensitivity");
    return true;
  }

  stopTracking(): void {
    if (!this.isTracking) return;

    this.isTracking = false;
    window.removeEventListener("devicemotion", this.handleMotion.bind(this));

    // Reset all tracking state
    this.stepCount = 0;
    this.motionHistory = [];
    this.recentPeaks = [];
    this.currentActivity = "idle";
    this.activityStartTime = null;
    this.baselineAcceleration = 0;
    this.lastStepCandidateTime = 0;
    this.calibrationCount = 0;
    this.isCalibrated = false;

    console.log("🔧 DeviceMotion: Tracking stopped and reset");
  }

  private handleMotion(event: DeviceMotionEvent): void {
    if (!event.accelerationIncludingGravity) return;

    const { x, y, z } = event.accelerationIncludingGravity;
    if (x === null || y === null || z === null) return;

    // Calculate total acceleration magnitude
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    const timestamp = Date.now();

    // 🔧 CALIBRAGE AMÉLIORÉ - Plus d'échantillons pour une baseline stable
    if (this.calibrationCount < this.CALIBRATION_SAMPLES) {
      this.baselineAcceleration =
        (this.baselineAcceleration * this.calibrationCount + acceleration) /
        (this.calibrationCount + 1);
      this.calibrationCount++;

      if (this.calibrationCount === this.CALIBRATION_SAMPLES) {
        this.isCalibrated = true;
        console.log(
          `🔧 DeviceMotion: Calibration completed. Baseline: ${this.baselineAcceleration.toFixed(2)}`,
        );
      }
      return; // Ne pas détecter les pas pendant le calibrage
    }

    // Store motion data
    this.motionHistory.push({ acceleration, timestamp });

    // Keep only last 10 seconds of data
    const tenSecondsAgo = timestamp - 10000;
    this.motionHistory = this.motionHistory.filter(
      (m) => m.timestamp > tenSecondsAgo,
    );

    // 🔧 DÉTECTION AMÉLIORÉE - Seulement après calibrage complet
    if (this.isCalibrated) {
      this.detectStep(acceleration, timestamp);
    }
  }

  private detectStep(acceleration: number, timestamp: number): void {
    const deviationFromBaseline = Math.abs(
      acceleration - this.baselineAcceleration,
    );

    // 🔧 SEUIL PLUS RESTRICTIF et vérification de stabilité
    if (
      deviationFromBaseline > this.STEP_THRESHOLD &&
      timestamp - this.lastStepCandidateTime > this.MIN_STEP_INTERVAL
    ) {
      console.log(
        `🔧 DeviceMotion: Step candidate - deviation: ${deviationFromBaseline.toFixed(2)} > ${this.STEP_THRESHOLD}`,
      );

      // 🔧 VALIDATION RENFORCÉE avant d'accepter le pas
      if (this.validateAdvancedStepPattern(acceleration, timestamp)) {
        this.lastStepCandidateTime = timestamp;
        this.recentPeaks.push(timestamp);

        // Keep only last 10 peaks
        if (this.recentPeaks.length > 10) {
          this.recentPeaks.shift();
        }

        this.stepCount++;
        this.lastStepTime = timestamp;

        console.log(`✅ DeviceMotion: Step ${this.stepCount} CONFIRMED!`);

        // Detect activity type based on step cadence
        this.detectActivityType();

        // Notify listeners
        this.notifyListeners();
      } else {
        console.log("❌ DeviceMotion: Step REJECTED by advanced validation");
      }
    }
  }

  // 🔧 NOUVELLE FONCTION - Validation avancée des patterns de pas
  private validateAdvancedStepPattern(
    acceleration: number,
    timestamp: number,
  ): boolean {
    // Toujours permettre les premiers pas pour démarrer
    if (this.recentPeaks.length < 2) {
      console.log("🔧 DeviceMotion: Allowing initial steps");
      return true;
    }

    // 1. Vérification du timing entre pas
    const lastInterval =
      timestamp - this.recentPeaks[this.recentPeaks.length - 1];
    if (
      lastInterval < this.MIN_STEP_INTERVAL ||
      lastInterval > this.MAX_STEP_INTERVAL
    ) {
      console.log(
        `❌ Step rejected - bad timing: ${lastInterval}ms (should be ${this.MIN_STEP_INTERVAL}-${this.MAX_STEP_INTERVAL}ms)`,
      );
      return false;
    }

    // 2. 🔧 NOUVELLE VALIDATION - Vérifier la consistance des intervalles
    if (this.recentPeaks.length >= 3) {
      const intervals = [];
      for (let i = 1; i < Math.min(4, this.recentPeaks.length); i++) {
        intervals.push(
          this.recentPeaks[this.recentPeaks.length - i] -
            this.recentPeaks[this.recentPeaks.length - i - 1],
        );
      }

      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const maxDeviation = Math.max(
        ...intervals.map((i) => Math.abs(i - avgInterval)),
      );

      // Les intervals entre pas ne doivent pas varier de plus de 60%
      if (maxDeviation > avgInterval * 0.6) {
        console.log(
          `❌ Step rejected - inconsistent timing pattern: ${maxDeviation.toFixed(0)}ms deviation`,
        );
        return false;
      }
    }

    // 3. 🔧 VALIDATION DE LA STABILITÉ DU MOUVEMENT
    const recent = this.motionHistory.slice(-15); // Dernière 1.5 seconde
    if (recent.length >= 10) {
      const motionStability = this.calculateMotionStability(recent);
      if (motionStability < this.MOTION_STABILITY_THRESHOLD) {
        console.log(
          `❌ Step rejected - insufficient motion stability: ${motionStability.toFixed(2)}`,
        );
        return false;
      }
    }

    // 4. 🔧 VALIDATION DE L'AMPLITUDE du mouvement
    const recentAccelerations = this.motionHistory
      .slice(-8)
      .map((m) => m.acceleration);
    if (recentAccelerations.length >= 5) {
      const range =
        Math.max(...recentAccelerations) - Math.min(...recentAccelerations);
      if (range < 1.2) {
        // Amplitude minimale requise
        console.log(
          `❌ Step rejected - insufficient motion range: ${range.toFixed(2)}`,
        );
        return false;
      }
    }

    console.log(
      `✅ Step ACCEPTED - interval: ${lastInterval}ms, good pattern detected`,
    );
    return true;
  }

  // 🔧 NOUVELLE FONCTION - Calculer la stabilité du mouvement
  private calculateMotionStability(motionData: MotionSensor[]): number {
    if (motionData.length < 5) return 0;

    const accelerations = motionData.map((m) => m.acceleration);
    const avg = accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
    const variance =
      accelerations.reduce((sum, acc) => sum + Math.pow(acc - avg, 2), 0) /
      accelerations.length;

    return Math.sqrt(variance); // Standard deviation = stabilité du mouvement
  }

  private detectActivityType(): void {
    if (this.recentPeaks.length < 3) return; // 🔧 Attendre 3 pas minimum

    // Calculate steps per minute from actual detected steps
    const oneMinuteAgo = Date.now() - 60000;
    const recentStepTimes = this.recentPeaks.filter(
      (time) => time > oneMinuteAgo,
    );
    const stepsPerMinute = recentStepTimes.length;

    // Also check recent activity in last 30 seconds for more responsive detection
    const thirtySecondsAgo = Date.now() - 30000;
    const last30SecSteps = this.recentPeaks.filter(
      (time) => time > thirtySecondsAgo,
    );
    const projected30SecRate = (last30SecSteps.length / 30) * 60;

    // Use the higher of the two rates for more responsive detection
    const effectiveRate = Math.max(stepsPerMinute, projected30SecRate);

    let newActivity: "idle" | "walking" | "running" = "idle";

    // 🔧 SEUILS AJUSTÉS pour éviter les fausses détections
    if (effectiveRate >= this.RUNNING_CADENCE) {
      newActivity = "running";
    } else if (effectiveRate >= this.WALKING_CADENCE) {
      newActivity = "walking";
    }

    // Check for recent activity to avoid going idle too quickly
    const lastTwentySeconds = Date.now() - 20000; // 🔧 Augmenté à 20 secondes
    const veryRecentSteps = this.recentPeaks.filter(
      (time) => time > lastTwentySeconds,
    );

    // If no steps in last 20 seconds, mark as idle
    if (veryRecentSteps.length === 0) {
      newActivity = "idle";
    }

    // Activity state change detection
    if (newActivity !== this.currentActivity) {
      if (newActivity !== "idle") {
        this.activityStartTime = new Date();
        this.sendActivityNotification(newActivity);
      } else if (this.currentActivity !== "idle" && this.activityStartTime) {
        // Activity ended - check if it was long enough to log
        const duration = Date.now() - this.activityStartTime.getTime();
        if (duration >= this.ACTIVITY_MIN_DURATION) {
          this.logActivity(
            this.currentActivity,
            this.activityStartTime,
            new Date(),
            Math.floor(duration / 1000 / 60),
          );
        }
      }

      this.currentActivity = newActivity;
    }
  }

  private sendActivityNotification(activity: "walking" | "running"): void {
    const now = Date.now();

    // Throttle notifications - only send once per 5 minutes
    if (now - this.lastNotificationTime < 5 * 60 * 1000) return;

    this.lastNotificationTime = now;

    // Send browser notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
      const activityName = activity === "walking" ? "Walking" : "Running";
      new Notification(`CalAI: ${activityName} Detected!`, {
        body: `Started tracking your ${activity} activity. Keep it up!`,
        icon: "/icon-192.png",
        tag: "calai-activity",
        silent: false,
      });
    }
  }

  private async logActivity(
    activity: "walking" | "running",
    startTime: Date,
    endTime: Date,
    durationMinutes: number,
  ): Promise<void> {
    try {
      // Calculate estimated calories based on activity and duration
      const activityType = activity === "walking" ? "walk" : "run";

      const response = await fetch("/api/device-motion/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activityType,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          duration: durationMinutes,
          steps: this.stepCount,
          source: "device_motion",
        }),
      });

      if (response.ok) {
        console.log(
          `✅ Logged ${activity} activity: ${durationMinutes} minutes, ${this.stepCount} steps`,
        );

        // Send success notification
        if ("Notification" in window && Notification.permission === "granted") {
          const activityName = activity === "walking" ? "walk" : "run";
          new Notification(
            `CalAI: ${activityName.charAt(0).toUpperCase() + activityName.slice(1)} Logged!`,
            {
              body: `${durationMinutes} minutes of ${activity} has been added to your activity log.`,
              icon: "/icon-192.png",
              tag: "calai-activity-logged",
            },
          );
        }
      }
    } catch (error) {
      console.error("Failed to log device motion activity:", error);
    }
  }

  private notifyListeners(): void {
    const data: DeviceMotionData = {
      steps: this.stepCount,
      isWalking: this.currentActivity === "walking",
      isRunning: this.currentActivity === "running",
      lastActivity: this.activityStartTime,
    };

    this.listeners.forEach((listener) => listener(data));
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
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  getCurrentData(): DeviceMotionData {
    return {
      steps: this.stepCount,
      isWalking: this.currentActivity === "walking",
      isRunning: this.currentActivity === "running",
      lastActivity: this.activityStartTime,
    };
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false;

    if (Notification.permission === "granted") return true;

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }

  isSupported(): boolean {
    return "DeviceMotionEvent" in window;
  }
}

export const deviceMotionService = new DeviceMotionService();
