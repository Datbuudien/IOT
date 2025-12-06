import serial
import wave
import os
import time

# ========== CẤU HÌNH ==========
SERIAL_PORT = 'COM3'  
BAUD_RATE = 115200
SAMPLE_RATE = 16000
# Thư mục lưu file
OUTPUT_DIR = 'data/raw'
COMMANDS = {
    '0': 'on_pump',
    '1': 'off_pump',
    '2': 'on_light',
    '3': 'off_light',
    '4': 'noise'
}

# ========== HÀM CHÍNH ==========

def init_serial():
    """Khởi tạo kết nối Serial"""
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
        print(f"Đã kết nối: {SERIAL_PORT} @ {BAUD_RATE} baud")
        time.sleep(2)  # Đợi ESP32 khởi động
        return ser
    except Exception as e:
        print(f"Lỗi kết nối Serial: {e}")
        print("\n💡 Hãy kiểm tra:")
        print("   - ESP32 đã được kết nối?")
        print("   - Port COM đúng chưa? (Windows: Device Manager)")
        print("   - Driver USB đã cài?")
        return None

def create_output_dirs():
    """Tạo thư mục output nếu chưa có"""
    for cmd_name in COMMANDS.values():
        os.makedirs(f'{OUTPUT_DIR}/{cmd_name}', exist_ok=True)

def receive_audio_data(ser):
    """Nhận audio data từ ESP32"""
    # Đợi RECORD_START
    print("⏳ Đang đợi RECORD_START...")
    while True:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if not line:
            continue
        print(f"📨 ESP32: {line}")
        if line == "RECORD_START":
            break
    
    # Đợi RECORD_END
    while True:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if not line:
            continue
        print(f"📨 ESP32: {line}")
        if "RECORD_END" in line:
            break
    
    # Đợi DATA_START
    print("⏳ Đang đợi DATA_START...")
    while True:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if not line:
            continue
        if line == "DATA_START":
            break
    
    # Đọc số lượng samples
    samples_count_line = ser.readline().decode('utf-8', errors='ignore').strip()
    samples_count = int(samples_count_line)
    print(f"📊 Số samples: {samples_count}")
    
    # Đọc audio data (int16 = 2 bytes per sample)
    expected_bytes = samples_count * 2
    print(f"⏳ Đang đọc {expected_bytes} bytes...")
    
    audio_bytes = b''
    start_time = time.time()
    
    while len(audio_bytes) < expected_bytes:
        remaining = expected_bytes - len(audio_bytes)
        chunk = ser.read(min(remaining, 4096))  # Đọc từng chunk
        if chunk:
            audio_bytes += chunk
        else:
            # Timeout
            if time.time() - start_time > 5:
                print("Timeout khi đọc dữ liệu!")
                return None
    
    # Đợi DATA_END
    ser.readline()  # Bỏ qua dòng DATA_END
    
    print(f"✅ Đã nhận {len(audio_bytes)} bytes")
    return audio_bytes

def save_wav_file(audio_bytes, filename):
    """Lưu audio bytes thành file WAV"""
    try:
        with wave.open(filename, 'wb') as wf:
            wf.setnchannels(1)      # Mono
            wf.setsampwidth(2)       # 16-bit = 2 bytes
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(audio_bytes)
        return True
    except Exception as e:
        print(f"Lỗi lưu file: {e}")
        return False

def main():
    print("=" * 60)
    print("🎙️  ESP32 Audio Data Collector")
    print("=" * 60)
    print("\nCác lệnh:")
    print("  0 - ON PUMP")
    print("  1 - OFF PUMP")
    print("  2 - ON LIGHT")
    print("  3 - OFF LIGHT")
    print("  4 - NOISE (tiếng nhiễu)")
    print("  q - Thoát\n")
    
    # Khởi tạo
    ser = init_serial()
    if not ser:
        return
    
    create_output_dirs()
    
    try:
        while True:
            # Chọn lệnh
            choice = input("Chọn lệnh (0-4) hoặc 'q' để thoát: ").strip().lower()
            
            if choice == 'q':
                break
            
            if choice not in COMMANDS:
                print("Lựa chọn không hợp lệ!\n")
                continue
            
            cmd_name = COMMANDS[choice]
            
            # Đếm số file hiện có
            cmd_dir = f'{OUTPUT_DIR}/{cmd_name}'
            existing_files = [f for f in os.listdir(cmd_dir) if f.endswith('.wav')]
            next_num = len(existing_files) + 1
            filename = f'{cmd_dir}/{cmd_name}_{next_num:04d}.wav'
            
            print(f"\n📝 Lệnh: {cmd_name.upper()}")
            print(f"📁 File: {filename}")
            print("⏱️  Chuẩn bị trong 2 giây...")
            time.sleep(2)
            
            # Gửi lệnh thu âm
            print("📤 Gửi lệnh RECORD...")
            ser.write(b"RECORD\n")
            ser.flush()
            
            # Nhận audio data
            audio_bytes = receive_audio_data(ser)
            
            if audio_bytes:
                # Lưu file
                if save_wav_file(audio_bytes, filename):
                    print(f"Đã lưu: {filename}\n")
                else:
                    print("Lỗi khi lưu file!\n")
            else:
                print("Không nhận được dữ liệu!\n")
    
    except KeyboardInterrupt:
        print("\n\n👋 Đang thoát...")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
    finally:
        if ser:
            ser.close()
            print("Đã đóng kết nối Serial")

if __name__ == '__main__':
    main()