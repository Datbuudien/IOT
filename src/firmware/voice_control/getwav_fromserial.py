import serial
import wave
import numpy as np
import time
import os

# --- CẤU HÌNH ---
SERIAL_PORT = 'COM3'   # <--- SỬA LẠI CỔNG COM CỦA BẠN
BAUD_RATE = 921600     # Phải khớp với ESP32
SAMPLE_RATE = 16000    # Tần số lấy mẫu mục tiêu
DURATION = 2.0         # Thời gian thu (giây) - Nên để 2s cho từ đơn
OUTPUT_FOLDER = "dataset_final"

if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

LABELS = ['on', 'off', 'noise']
for label in LABELS:
    os.makedirs(os.path.join(OUTPUT_FOLDER, label), exist_ok=True)

def record_audio(label, filename):
    print(f"🎙️  Đang thu âm '{label}' ({DURATION}s)...", end='', flush=True)
    
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        time.sleep(2) # Chờ ESP32 reset
        ser.reset_input_buffer()
        
        # Gửi lệnh BẮT ĐẦU ('R')
        ser.write(b'R')
        
    except Exception as e:
        print(f"\n❌ Lỗi Serial: {e}")
        return

    raw_values = []
    num_samples_expected = int(SAMPLE_RATE * DURATION)
    
    # Thu dữ liệu
    start_time = time.time()
    while len(raw_values) < num_samples_expected:
        # Timeout an toàn
        if time.time() - start_time > (DURATION + 3.0):
             print(" -> Timeout!")
             break

        try:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if line.isdigit():
                raw_values.append(int(line))
        except:
            continue
            
    # Gửi lệnh DỪNG ('S')
    ser.write(b'S')
    ser.close()
    
    print(f" Xong! ({len(raw_values)} mẫu)")

     # --- XỬ LÝ ÂM THANH (KHỬ NHIỄU & CHUẨN HÓA) ---
     if len(raw_values) < 100:
         print("❌ Lỗi: Không thu được dữ liệu!")
         return
 
     data = np.array(raw_values, dtype=np.float32)
     
     print(f"   📊 Raw ADC: min={np.min(data):.0f}, max={np.max(data):.0f}, mean={np.mean(data):.1f}")
     
     # 1. Trừ DC Offset (Quan trọng nhất để hết tiếng 'bụp'/'rè' nền)
     dc_offset = np.mean(data)
     data = data - dc_offset
     print(f"   📊 Sau DC removal: min={np.min(data):.1f}, max={np.max(data):.1f}, mean={np.mean(data):.1f}")
     
     # 2. LOW-PASS FILTER: Loại bỏ nhiễu tần số cao (quan trọng!)
     # Simple moving average filter để làm mượt tín hiệu
     window_size = 3  # Kích thước cửa sổ filter
     if len(data) > window_size:
         filtered_data = np.zeros_like(data)
         for i in range(len(data)):
             start = max(0, i - window_size // 2)
             end = min(len(data), i + window_size // 2 + 1)
             filtered_data[i] = np.mean(data[start:end])
         data = filtered_data
         print(f"   📊 Sau low-pass filter: min={np.min(data):.1f}, max={np.max(data):.1f}")
     
     # 3. HIGH-PASS FILTER: Loại bỏ nhiễu tần số thấp (drift, hum)
     # Simple high-pass: trừ đi moving average dài hạn
     if len(data) > 100:
         # Tính moving average với window lớn (100 mẫu ~ 6ms)
         ma_window = 100
         ma = np.convolve(data, np.ones(ma_window)/ma_window, mode='same')
         data = data - ma
         print(f"   📊 Sau high-pass filter: min={np.min(data):.1f}, max={np.max(data):.1f}")
     
     # 4. Chuẩn hóa biên độ (Normalize) - Giúp âm thanh to rõ
     max_val = np.max(np.abs(data))
     if max_val > 0:
         # Normalize nhưng không quá mạnh để tránh khuếch đại nhiễu
         data = data / max_val
         print(f"   📊 Sau normalize: max_abs={np.max(np.abs(data)):.3f}")
     else:
         print(f"   ⚠️  Cảnh báo: Không có tín hiệu sau khi filter!")
         data = data * 0
     
     # 5. Giảm volume chút để an toàn (tránh clipping)
     data = data * 0.9
     
     # 6. Chuyển sang 16-bit PCM
     data_int16 = (data * 32767).astype(np.int16)
     
     # Thống kê cuối cùng
     rms = np.sqrt(np.mean(data_int16.astype(np.float32) ** 2))
     max_audio = np.max(np.abs(data_int16))
     print(f"   📊 Audio final: max={max_audio}, RMS={rms:.0f}")
    
    # --- LƯU FILE WAV ---
    try:
        with wave.open(filename, 'w') as wf:
            wf.setnchannels(1) 
            wf.setsampwidth(2)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(data_int16.tobytes())
        print(f"✅ Đã lưu: {filename}")
    except Exception as e:
        print(f"❌ Lỗi lưu file: {e}")

# --- MENU ---
print(f"--- TOOL THU ÂM KHỬ NHIỄU ---")
while True:
    print("\nChọn lệnh:")
    for i, lbl in enumerate(LABELS):
        count = len(os.listdir(os.path.join(OUTPUT_FOLDER, lbl)))
        print(f"  {i+1}. {lbl} ({count} files)")
    print("  q. Thoát")
    
    choice = input(">> ").strip()
    if choice == 'q': break
    
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(LABELS):
            label = LABELS[idx]
            timestamp = int(time.time())
            filename = f"{OUTPUT_FOLDER}/{label}/{label}.{timestamp}.wav"
            
            print("3... 2... 1... NÓI!")
            time.sleep(0.5)
            record_audio(label, filename)
        else:
            print("❌ Sai số!")
    except ValueError:
        pass