const cron = require('node-cron');
const Schedule = require('../models/Schedule');
const Device = require('../models/Device');

/**
 * Scheduler Service
 * Quản lý và thực thi các lịch tưới tự động
 */

class SchedulerService {
  constructor() {
    this.runningJobs = new Map(); // Map<scheduleId, cronJob>
    this.activeSchedules = new Map(); // Map<scheduleId, timeoutId> cho việc tắt máy bơm
    this.scheduleEndTimes = new Map(); // Map<scheduleId, endTime> để lưu thời gian kết thúc
  }

  /**
   * Khởi động scheduler service
   */
  async start() {
    console.log('🕐 Starting Scheduler Service...');
    
    // Chạy check lịch tưới mỗi phút
    cron.schedule('* * * * *', async () => {
      await this.checkAndExecuteSchedules();
    });

    // Chạy check device offline mỗi 30 giây (kiểm tra devices không nhận heartbeat trong 1 phút)
    cron.schedule('*/30 * * * * *', async () => {
      await this.checkOfflineDevices();
    });

    // Chạy check và tắt bơm khi hết thời lượng mỗi phút
    cron.schedule('* * * * *', async () => {
      await this.checkAndTurnOffPumps();
    });

    console.log('✅ Scheduler Service started');
  }

  /**
   * Kiểm tra và đánh dấu devices offline nếu không nhận heartbeat
   */
  async checkOfflineDevices() {
    try {
      await Device.markOfflineDevices(1); // 1 phút timeout
    } catch (error) {
      console.error('❌ Lỗi kiểm tra devices offline:', error);
    }
  }

  /**
   * Kiểm tra và thực thi các lịch cần chạy
   */
  async checkAndExecuteSchedules() {
    try {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Lấy tất cả lịch active
      const schedules = await Schedule.findActiveSchedules();

      for (const schedule of schedules) {
        // Kiểm tra xem hôm nay có trong daysOfWeek không
        if (!schedule.daysOfWeek.includes(currentDay)) {
          continue;
        }

        // Kiểm tra xem đã đến giờ chưa
        if (schedule.startTime !== currentTime) {
          continue;
        }

        // Kiểm tra xem lịch này đã chạy trong phút này chưa
        if (schedule.lastRun) {
          const lastRunTime = new Date(schedule.lastRun);
          const timeDiff = (now - lastRunTime) / 1000; // seconds
          if (timeDiff < 60) {
            continue; // Đã chạy trong phút này rồi
          }
        }

        // Thực thi lịch
        await this.executeSchedule(schedule);
      }
    } catch (error) {
      console.error('❌ Lỗi kiểm tra lịch:', error);
    }
  }

  /**
   * Thực thi một lịch cụ thể
   */
  async executeSchedule(schedule) {
    try {
      console.log(`🚿 Thực thi lịch: ${schedule.name} (ID: ${schedule._id})`);

      // Lấy thông tin device
      const device = await Device.findById(schedule.deviceId.toString(), schedule.userId);
      if (!device) {
        console.error(`❌ Không tìm thấy device cho lịch ${schedule._id}`);
        await Schedule.logExecution(
          schedule._id,
          schedule.userId,
          schedule.deviceId,
          false,
          'Device không tồn tại'
        );
        return;
      }

      // Kiểm tra device có đang ở chế độ schedule không
      if (device.mode !== 'schedule') {
        console.log(`⚠️  Device ${device.deviceId} không ở chế độ schedule (mode: ${device.mode}), bỏ qua lịch`);
        return;
      }

      // Gửi lệnh MQTT để bật máy bơm
      const mqttService = require('./mqttService');
      mqttService.sendCommand(device.deviceId, { action: 'pump_on', timestamp: new Date() });
      
      // Cập nhật trạng thái trong database
      const turned = await Device.updatePumpStatus(schedule.deviceId.toString(), schedule.userId, true);
      if (!turned) {
        console.error(`❌ Không thể bật máy bơm cho device ${device.deviceId}`);
        await Schedule.logExecution(
          schedule._id,
          schedule.userId,
          schedule.deviceId,
          false,
          'Không thể bật máy bơm'
        );
        return;
      }

      console.log(`✅ Đã bật máy bơm ${device.deviceId} - Thời lượng: ${schedule.duration} phút`);

      // Tính thời gian kết thúc (bắt đầu + duration phút)
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (schedule.duration * 60 * 1000));
      
      // Lưu thời gian kết thúc để cron job có thể kiểm tra
      this.scheduleEndTimes.set(schedule._id.toString(), endTime);

      // Tắt máy bơm sau duration phút (backup với setTimeout)
      const timeoutId = setTimeout(async () => {
        try {
          await this.turnOffPumpForSchedule(schedule, device);
        } catch (error) {
          console.error(`❌ Lỗi tắt máy bơm ${device.deviceId}:`, error);
        }
      }, schedule.duration * 60 * 1000);

      // Lưu timeout để có thể cancel nếu cần
      this.activeSchedules.set(schedule._id.toString(), timeoutId);

      // Cập nhật thời gian chạy
      const now = new Date();
      const nextRun = this.calculateNextRun(schedule);
      await Schedule.updateRunTimes(schedule._id, now, nextRun);

      // Log execution
      await Schedule.logExecution(
        schedule._id,
        schedule.userId,
        schedule.deviceId,
        true,
        `Bật máy bơm ${schedule.duration} phút`
      );

    } catch (error) {
      console.error(`❌ Lỗi thực thi lịch ${schedule._id}:`, error);
      await Schedule.logExecution(
        schedule._id,
        schedule.userId,
        schedule.deviceId,
        false,
        error.message
      );
    }
  }

  /**
   * Tính toán lần chạy tiếp theo
   */
  calculateNextRun(schedule) {
    const now = new Date();
    const [hours, minutes] = schedule.startTime.split(':').map(Number);
    
    // Tìm ngày tiếp theo có trong daysOfWeek
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    // Nếu giờ hôm nay đã qua, chuyển sang ngày mai
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    // Tìm ngày tiếp theo trong daysOfWeek
    let daysChecked = 0;
    while (daysChecked < 7) {
      if (schedule.daysOfWeek.includes(nextRun.getDay())) {
        return nextRun;
      }
      nextRun.setDate(nextRun.getDate() + 1);
      daysChecked++;
    }
    
    return null; // Không tìm thấy ngày phù hợp
  }

  /**
   * Hủy một lịch đang chạy
   */
  cancelSchedule(scheduleId) {
    const timeoutId = this.activeSchedules.get(scheduleId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activeSchedules.delete(scheduleId);
      console.log(`🛑 Đã hủy lịch đang chạy: ${scheduleId}`);
    }
  }

  /**
   * Hủy tất cả lịch đang chạy
   */
  cancelAllSchedules() {
    for (const [scheduleId, timeoutId] of this.activeSchedules) {
      clearTimeout(timeoutId);
      console.log(`🛑 Đã hủy lịch: ${scheduleId}`);
    }
    this.activeSchedules.clear();
    this.scheduleEndTimes.clear();
  }

  /**
   * Kiểm tra và tắt bơm khi hết thời lượng
   * Chạy mỗi phút để đảm bảo tắt đúng giờ
   */
  async checkAndTurnOffPumps() {
    try {
      const now = new Date();
      
      // Kiểm tra tất cả lịch đang chạy
      for (const [scheduleId, endTime] of this.scheduleEndTimes) {
        // Nếu đã đến hoặc qua thời gian kết thúc
        if (now >= endTime) {
          try {
            // Lấy thông tin schedule
            const schedule = await Schedule.findById(scheduleId);
            if (!schedule) {
              // Schedule không tồn tại, xóa khỏi map
              this.scheduleEndTimes.delete(scheduleId);
              this.activeSchedules.delete(scheduleId);
              continue;
            }

            // Lấy thông tin device
            const device = await Device.findById(schedule.deviceId.toString(), schedule.userId);
            if (!device) {
              this.scheduleEndTimes.delete(scheduleId);
              this.activeSchedules.delete(scheduleId);
              continue;
            }

            // Kiểm tra device có đang ở chế độ schedule không
            if (device.mode !== 'schedule') {
              // Device không còn ở chế độ schedule, xóa khỏi map
              this.scheduleEndTimes.delete(scheduleId);
              this.activeSchedules.delete(scheduleId);
              continue;
            }

            // Tắt máy bơm
            await this.turnOffPumpForSchedule(schedule, device);
            
          } catch (error) {
            console.error(`❌ Lỗi kiểm tra và tắt bơm cho schedule ${scheduleId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Lỗi kiểm tra và tắt bơm:', error);
    }
  }

  /**
   * Tắt máy bơm cho một schedule cụ thể
   */
  async turnOffPumpForSchedule(schedule, device) {
    const mqttService = require('./mqttService');
    
    // Gửi lệnh MQTT để tắt máy bơm
    mqttService.sendCommand(device.deviceId, { action: 'pump_off', timestamp: new Date() });
    
    // Cập nhật trạng thái trong database
    await Device.updateRelay1Status(schedule.deviceId.toString(), schedule.userId, false);
    console.log(`✅ Đã tắt máy bơm ${device.deviceId} sau ${schedule.duration} phút (lịch: ${schedule.name})`);
    
    // Xóa khỏi map
    this.activeSchedules.delete(schedule._id.toString());
    this.scheduleEndTimes.delete(schedule._id.toString());
  }
}

// Export singleton instance
const schedulerService = new SchedulerService();
module.exports = schedulerService;
