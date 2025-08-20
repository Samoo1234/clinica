import notificationService from './notifications';

class NotificationScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the notification scheduler
   * Processes pending notifications every minute
   */
  start(): void {
    if (this.isRunning) {
      console.log('Notification scheduler is already running');
      return;
    }

    console.log('Starting notification scheduler...');
    this.isRunning = true;

    // Process immediately on start
    this.processNotifications();

    // Then process every minute
    this.intervalId = setInterval(() => {
      this.processNotifications();
    }, 60 * 1000); // 1 minute

    console.log('Notification scheduler started successfully');
  }

  /**
   * Stop the notification scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Notification scheduler is not running');
      return;
    }

    console.log('Stopping notification scheduler...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('Notification scheduler stopped');
  }

  /**
   * Process pending notifications
   */
  private async processNotifications(): Promise<void> {
    try {
      await notificationService.processPendingNotifications();
    } catch (error) {
      console.error('Error processing notifications:', error);
    }
  }

  /**
   * Check if scheduler is running
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }
}

export default new NotificationScheduler();